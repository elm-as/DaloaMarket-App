import { supabase } from '../supabase';
import { Coordinates } from '@daloa/types';
import { isWithinOtpProximity } from '@daloa/utils';

export interface VerifyPickupParams {
  assignmentId: string;
  enteredOtp: string;
  photoUrl: string;
  driverCoords: Coordinates;
  targetCoords?: Coordinates | null;
}

export interface VerifyDeliveryParams {
  assignmentId: string;
  enteredOtp: string;
  photoUrl: string;
  driverCoords: Coordinates;
  targetCoords?: Coordinates | null;
}

export interface VerificationResult {
  success: boolean;
  message?: string;
}

/**
 * Service de validation cryptographique et géographique des étapes de livraison
 */
export const deliveryVerificationService = {
  /**
   * Valide le ramassage chez le vendeur avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyPickup(params: VerifyPickupParams): Promise<VerificationResult> {
    const trimmedOtp = params.enteredOtp.trim();

    // 1. Validation GPS bloquante côté client si les coordonnées cibles sont fournies
    let distanceMeters: number | null = null;
    if (params.targetCoords) {
      const prox = isWithinOtpProximity(params.driverCoords, params.targetCoords);
      if (!prox.isWithin) {
        throw new Error(
          `Distance GPS excessive (${prox.distanceMeters}m). Rapprochez-vous à moins de 100m du vendeur pour valider.`
        );
      }
      distanceMeters = prox.distanceMeters;
    }

    // 2. Tentative via fonction RPC Postgres atomique
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_pickup', {
        p_assignment_id: params.assignmentId,
        p_otp: trimmedOtp,
        p_photo_url: params.photoUrl,
        p_gps_lat: params.driverCoords.lat,
        p_gps_lng: params.driverCoords.lng,
      });

      if (!rpcError && rpcData) {
        if (!rpcData.success) {
          if (rpcData.reason === 'invalid_otp') {
            throw new Error(
              `Code OTP Vendeur incorrect (tentative ${rpcData.attempts || '?'}/${rpcData.max_attempts || 3}).`
            );
          }
          if (rpcData.reason === 'too_many_attempts') {
            throw new Error('Trop de tentatives OTP erronées. La course a été placée en litige.');
          }
          if (rpcData.reason === 'gps_distance_exceeded') {
            throw new Error(
              `Distance GPS non conforme (${Math.round(rpcData.distance || 0)}m). Rapprochez-vous du point de retrait.`
            );
          }
          if (rpcData.reason === 'photo_required') {
            throw new Error('Une photo de preuve du colis est obligatoire.');
          }
          throw new Error(rpcData.reason || 'Vérification du ramassage refusée par le serveur.');
        }

        return {
          success: true,
          message: 'Colis ramassé avec succès ! En route vers l’acheteur.',
        };
      }
    } catch (rpcErr: any) {
      if (rpcErr.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('schema')) {
        throw rpcErr;
      }
      console.warn('RPC verify_pickup non disponible, exécution du contrôle sécurisé:', rpcErr);
    }

    // 3. Fallback sécurisé en cas d'indisponibilité de la fonction RPC
    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('pickup_otp, pickup_otp_attempts')
      .eq('id', params.assignmentId)
      .single();

    if (error || !assignment) {
      throw new Error('Assignation de livraison introuvable');
    }

    if (assignment.pickup_otp.trim() !== trimmedOtp) {
      const nextAttempts = (assignment.pickup_otp_attempts || 0) + 1;
      const isLocked = nextAttempts >= 3;

      await supabase
        .from('delivery_assignments')
        .update({
          pickup_otp_attempts: nextAttempts,
          ...(isLocked
            ? { status: 'disputed', dispute_reason: 'too_many_otp_attempts', disputed_at: new Date().toISOString() }
            : {}),
        })
        .eq('id', params.assignmentId);

      if (isLocked) {
        throw new Error('Nombre maximal d’essais dépassé. La course est passée en litige.');
      }
      throw new Error(`Code OTP Vendeur incorrect (${nextAttempts}/3). Demandez le code au vendeur.`);
    }

    const { error: updateErr } = await supabase
      .from('delivery_assignments')
      .update({
        status: 'picked_up',
        pickup_confirmed_at: new Date().toISOString(),
        pickup_photo_url: params.photoUrl,
        pickup_gps: params.driverCoords,
        pickup_gps_distance_m: distanceMeters,
      })
      .eq('id', params.assignmentId);

    if (updateErr) throw updateErr;

    return {
      success: true,
      message: 'Colis ramassé avec succès ! En route vers l’acheteur.',
    };
  },

  /**
   * Valide la remise au client avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyDelivery(params: VerifyDeliveryParams): Promise<VerificationResult> {
    const trimmedOtp = params.enteredOtp.trim();

    // 1. Validation GPS bloquante côté client si les coordonnées cibles sont fournies
    let distanceMeters: number | null = null;
    if (params.targetCoords) {
      const prox = isWithinOtpProximity(params.driverCoords, params.targetCoords);
      if (!prox.isWithin) {
        throw new Error(
          `Distance GPS excessive (${prox.distanceMeters}m). Rapprochez-vous à moins de 100m de l'acheteur pour valider.`
        );
      }
      distanceMeters = prox.distanceMeters;
    }

    // 2. Tentative via fonction RPC Postgres atomique
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_delivery', {
        p_assignment_id: params.assignmentId,
        p_otp: trimmedOtp,
        p_photo_url: params.photoUrl,
        p_gps_lat: params.driverCoords.lat,
        p_gps_lng: params.driverCoords.lng,
      });

      if (!rpcError && rpcData) {
        if (!rpcData.success) {
          if (rpcData.reason === 'invalid_otp') {
            throw new Error(
              `Code OTP Client incorrect (tentative ${rpcData.attempts || '?'}/${rpcData.max_attempts || 3}).`
            );
          }
          if (rpcData.reason === 'too_many_attempts') {
            throw new Error('Nombre maximal de tentatives atteint. Course marquée en litige.');
          }
          if (rpcData.reason === 'gps_distance_exceeded') {
            throw new Error(
              `Distance GPS non conforme (${Math.round(rpcData.distance || 0)}m). Rapprochez-vous de l'acheteur.`
            );
          }
          if (rpcData.reason === 'photo_required') {
            throw new Error('Une photo de preuve de livraison est obligatoire.');
          }
          throw new Error(rpcData.reason || 'Vérification de livraison refusée par le serveur.');
        }

        return {
          success: true,
          message: 'Livraison validée avec succès ! Les fonds sont débloqués.',
        };
      }
    } catch (rpcErr: any) {
      if (rpcErr.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('schema')) {
        throw rpcErr;
      }
      console.warn('RPC verify_delivery non disponible, exécution du contrôle sécurisé:', rpcErr);
    }

    // 3. Fallback sécurisé en cas d'indisponibilité de la fonction RPC
    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('delivery_otp, delivery_otp_attempts, order_id')
      .eq('id', params.assignmentId)
      .single();

    if (error || !assignment) {
      throw new Error('Assignation de livraison introuvable');
    }

    if (assignment.delivery_otp.trim() !== trimmedOtp) {
      const nextAttempts = (assignment.delivery_otp_attempts || 0) + 1;
      const isLocked = nextAttempts >= 3;

      await supabase
        .from('delivery_assignments')
        .update({
          delivery_otp_attempts: nextAttempts,
          ...(isLocked
            ? { status: 'disputed', dispute_reason: 'too_many_otp_attempts', disputed_at: new Date().toISOString() }
            : {}),
        })
        .eq('id', params.assignmentId);

      if (isLocked) {
        throw new Error('Nombre maximal d’essais dépassé. La course est passée en litige.');
      }
      throw new Error(`Code OTP Client incorrect (${nextAttempts}/3). Demandez le code à l’acheteur.`);
    }

    const { error: updateErr } = await supabase
      .from('delivery_assignments')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_photo_url: params.photoUrl,
        delivery_gps: params.driverCoords,
        delivery_gps_distance_m: distanceMeters,
      })
      .eq('id', params.assignmentId);

    if (updateErr) throw updateErr;

    // Mise à jour de la commande
    await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', assignment.order_id);

    return {
      success: true,
      message: 'Livraison validée avec succès ! Les fonds sont débloqués.',
    };
  },

  /**
   * Signale un incident / litige sur une livraison
   */
  async reportIncident(assignmentId: string, reason: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('report_delivery_dispute', {
        p_assignment_id: assignmentId,
        p_reason: reason,
      });
      if (!error && data?.success) {
        return;
      }
    } catch {
      // Poursuivre avec la mise à jour directe si RPC indisponible
    }

    const { error } = await supabase
      .from('delivery_assignments')
      .update({
        status: 'disputed',
        dispute_reason: reason,
        disputed_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (error) throw error;
  },
};
