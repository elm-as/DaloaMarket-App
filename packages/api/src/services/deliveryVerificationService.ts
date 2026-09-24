import { supabase } from '../supabase';
import { rpcOutcome } from '../lib/rpc';
import { Coordinates } from '@daloa/types';

export interface VerifyPickupParams {
  assignmentId: string;
  enteredOtp: string;
  photoUrl: string;
  driverCoords: Coordinates;
  /** @deprecated N'est plus utilisé : le contrôle de proximité GPS a été retiré. */
  targetCoords?: Coordinates | null;
}

export interface VerifyDeliveryParams {
  assignmentId: string;
  enteredOtp: string;
  photoUrl: string;
  driverCoords: Coordinates;
  /** @deprecated N'est plus utilisé : le contrôle de proximité GPS a été retiré. */
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

    // Le blocage GPS client (100 m) a été retiré : il était plus strict que le
    // serveur et refusait des ramassages légitimes dès que les coordonnées de la
    // boutique étaient approximatives. L'OTP vendeur est la preuve de présence.
    // Les coordonnées restent transmises à la RPC, qui les archive.

    // Tentative via fonction RPC Postgres atomique
    try {
      const { data: rpcRaw, error: rpcError } = await supabase.rpc('verify_pickup', {
        p_assignment_id: params.assignmentId,
        p_otp: trimmedOtp,
        p_photo_url: params.photoUrl,
        p_gps_lat: params.driverCoords.lat,
        p_gps_lng: params.driverCoords.lng,
      });

      const rpcData = rpcOutcome<{ attempts?: number; max_attempts?: number; distance?: number }>(rpcRaw);
      if (!rpcError && rpcData) {
        if (!rpcData.success) {
          if (rpcData.reason === 'invalid_otp') {
            throw new Error(
              `Code OTP Vendeur incorrect (tentative ${rpcData.attempts || '?'}/${rpcData.max_attempts || 5}).`
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

      // Erreur transport/permission : on remonte, on ne contourne pas.
      if (rpcError) throw rpcError;
      throw new Error('Réponse inattendue du serveur lors de la vérification du ramassage.');
    } catch (rpcErr: any) {
      throw rpcErr instanceof Error
        ? rpcErr
        : new Error(rpcErr?.message || 'Vérification du ramassage impossible.');
    }

    // Le repli qui existait ici a été retiré volontairement.
    // Il lisait `pickup_otp` en base puis comparait le code en JavaScript : le
    // livreur, qui a accès à la ligne, pouvait donc lire le code attendu — la
    // confirmation de prise en charge n'apportait alors aucune garantie. Il
    // s'activait aussi silencieusement sur une simple erreur de permission.
    // La RPC `verify_pickup` existe en base et contrôle correctement l'identité
    // de l'appelant, l'OTP, les tentatives et la distance GPS : elle est
    // désormais le seul chemin.
  },

  /**
   * Valide la remise au client avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyDelivery(params: VerifyDeliveryParams): Promise<VerificationResult> {
    const trimmedOtp = params.enteredOtp.trim();

    // Blocage GPS client retiré, comme pour le ramassage : c'est l'OTP acheteur
    // qui atteste la remise. La distance est archivée côté serveur pour l'audit.

    // Tentative via fonction RPC Postgres atomique
    {
      const { data: rpcRaw, error: rpcError } = await supabase.rpc('verify_delivery', {
        p_assignment_id: params.assignmentId,
        p_otp: trimmedOtp,
        p_photo_url: params.photoUrl,
        p_gps_lat: params.driverCoords.lat,
        p_gps_lng: params.driverCoords.lng,
      });

      const rpcData = rpcOutcome<{ attempts?: number; max_attempts?: number; distance?: number }>(rpcRaw);
      if (!rpcError && rpcData) {
        if (!rpcData.success) {
          if (rpcData.reason === 'invalid_otp') {
            throw new Error(
              `Code OTP Client incorrect (tentative ${rpcData.attempts || '?'}/${rpcData.max_attempts || 5}).`
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

      // Erreur transport/permission : on remonte, on ne contourne pas.
      if (rpcError) throw rpcError;
      throw new Error('Réponse inattendue du serveur lors de la vérification de la livraison.');
    }

    // Le repli qui existait ici a été retiré volontairement, pour les mêmes raisons
    // que celui de `verifyPickup`, plus une troisième :
    //  1. il lisait `delivery_otp` en base puis comparait le code en JavaScript. Le
    //     livreur, qui a accès à la ligne via RLS, pouvait donc lire le code attendu
    //     et valider une livraison sans jamais voir l'acheteur ;
    //  2. il s'activait silencieusement sur une simple erreur de permission ;
    //  3. il écrivait `status = 'delivered'` en direct, court-circuitant
    //     `create_seller_payout`, `create_delivery_payout` et `record_cod_receivable` :
    //     la course passait « livrée » sans qu'aucun virement ne soit programmé.
    // `verify_delivery` contrôle l'identité de l'appelant, l'OTP, les tentatives, et
    // déclenche les virements : elle est désormais le seul chemin.
  },

  /**
   * Signale un incident / litige sur une livraison
   */
  async reportIncident(assignmentId: string, reason: string): Promise<void> {
    // Pas de repli en UPDATE direct : `delivery_assignments` refuse les écritures
    // directes sur `status` (trigger `protect_delivery_assignments_columns`), donc
    // le repli ne modifiait rien tout en signalant un succès. La RPC bascule aussi
    // la commande en litige, ce que l'UPDATE ne faisait pas.
    const { data, error } = await supabase.rpc('report_delivery_dispute', {
      p_assignment_id: assignmentId,
      p_reason: reason,
    });

    if (error) throw error;
    const res = rpcOutcome(data);
    if (res && !res.success) {
      throw new Error(res.reason || 'Signalement du litige refusé par le serveur.');
    }
  },
};
