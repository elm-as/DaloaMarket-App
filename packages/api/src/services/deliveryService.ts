import { supabase } from '../supabase';
import { attachContactPhones } from '../lib/contacts';
import {
  AvailableDeliveryRun,
  ActiveDeliveryRunDetails,
  DriverDailyStats,
  DeliveryPersonRow,
  Coordinates,
} from '@daloa/types';
import { serializeGeoPoint } from '@daloa/utils';
import {
  deliveryVerificationService,
  VerifyPickupParams,
  VerifyDeliveryParams,
  VerificationResult,
} from './deliveryVerificationService';
import { deliveryStorageService } from './deliveryStorageService';
import {
  AvailableRunBriefItem,
  AvailableRunsBrief,
  PLATFORM_COMMISSION_RATE,
  mapActiveDeliveryRun,
  mapAvailableDeliveryRun,
} from './deliveryRunMapper';
import { fetchDeliverersDirectory, fetchDriverDailyStats } from './deliveryDriverStats';

export { PLATFORM_COMMISSION_RATE };
export type { AvailableRunBriefItem, AvailableRunsBrief };

let lastStaleSweepAt = 0;
const STALE_SWEEP_INTERVAL_MS = 60_000;
const PICKUP_TIMEOUT_MINUTES = 210; // Libère automatiquement après 3h30 sans retrait chez le vendeur

async function sweepStaleAcceptedRunsIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now - lastStaleSweepAt < STALE_SWEEP_INTERVAL_MS) return;
  lastStaleSweepAt = now;
  await deliveryVerificationService.releaseStaleAcceptedRuns(PICKUP_TIMEOUT_MINUTES);
}

// Exclut explicitement `pickup_otp` et `delivery_otp` côté livreur.
export const SAFE_DELIVERY_ASSIGNMENT_COLUMNS =
  'id, order_id, seller_id, delivery_person_id, status, is_private, is_express, is_grouped, delivery_group_id, group_total_stops, group_completed_stops, grouped_stops, pickup_confirmed_by_seller, pickup_confirmed_at, delivered_at, pickup_photo_url, delivery_photo_url, pickup_location, dropoff_location, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, delivery_price, package_description, package_type, sender_name, sender_phone, recipient_name, recipient_phone, payer_role, pickup_otp_attempts, delivery_otp_attempts, current_driver_lat, current_driver_lng, location_updated_at, disputed_at, dispute_reason, accepted_at, created_at, updated_at';

const RUN_DETAIL_SELECT = `${SAFE_DELIVERY_ASSIGNMENT_COLUMNS}, orders:order_id(id, order_type, delivery_address, delivery_lat, delivery_lng, total_amount, quantity, payment_method, is_grouped, delivery_group_id, package_description, package_type, sender_name, sender_phone, recipient_name, recipient_phone, payer_role, listings:listing_id(id, title, photos, price, district), order_items(id, quantity, unit_price, product_amount, listings:listing_id(title, photos)), seller:seller_id(id, full_name, shop_name, district, shop_latitude, shop_longitude), buyer:buyer_id(id, full_name, cod_reliability_score, cod_delivered_count, cod_refused_count))`;

export const deliveryService = {
  /**
   * Bascule la disponibilité du livreur (En Ligne / Hors Ligne).
   */
  async setDriverAvailability(driverId: string, isAvailable: boolean): Promise<void> {
    const { error } = await supabase
      .from('delivery_persons')
      .update({ is_available: isAvailable })
      .eq('id', driverId);

    if (error) throw error;
  },

  /**
   * Met à jour la position GPS du livreur en signalant tout échec réseau sans bloquer la boucle GPS.
   */
  async updateDriverLocation(driverId: string, coords: Coordinates): Promise<void> {
    const { error } = await supabase
      .from('delivery_persons')
      .update({ current_location: serializeGeoPoint(coords) })
      .eq('id', driverId);

    if (error) {
      console.warn('[deliveryService.updateDriverLocation] Echec mise a jour GPS:', error.message);
    }
  },

  /**
   * Récupère les courses disponibles en attente d'attribution.
   * Note de sécurité : `pickup_otp` et `delivery_otp` ne sont jamais sélectionnés côté livreur.
   */
  async getAvailableRuns(_driverCoords?: Coordinates | null): Promise<AvailableDeliveryRun[]> {
    await sweepStaleAcceptedRunsIfNeeded();

    const { data, error } = await (supabase.from('delivery_assignments') as any)
      .select(RUN_DETAIL_SELECT)
      .eq('status', 'awaiting_pickup')
      .is('delivery_person_id', null)
      .order('delivery_price', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Dédoublonnage des tournées groupées : une seule carte par `delivery_group_id`.
    const seenGroups = new Set<string>();
    const deduplicated = (data || []).filter((item: any) => {
      const gid = item.delivery_group_id || item.orders?.delivery_group_id;
      if (!gid) return true;
      if (seenGroups.has(gid)) return false;
      seenGroups.add(gid);
      return true;
    });

    await attachContactPhones(
      deduplicated.flatMap((item: any) => [item.orders?.seller, item.orders?.buyer])
    );

    return deduplicated.map(mapAvailableDeliveryRun);
  },

  /**
   * Version légère de `getAvailableRuns` pour les pastilles et la cloche de l'en-tête.
   */
  async getAvailableRunsBrief(limit = 5): Promise<AvailableRunsBrief> {
    await sweepStaleAcceptedRunsIfNeeded();

    const { data, count, error } = await supabase
      .from('delivery_assignments')
      .select('id, pickup_location, dropoff_location, delivery_price, created_at', {
        count: 'exact',
      })
      .eq('status', 'awaiting_pickup')
      .is('delivery_person_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      count: count ?? (data || []).length,
      runs: (data || []).map((item: any) => ({
        assignmentId: item.id,
        pickupLocation: item.pickup_location || 'Boutique',
        dropoffLocation: item.dropoff_location || 'Adresse client',
        deliveryPrice: Number(item.delivery_price) || 0,
        createdAt: item.created_at,
      })),
    };
  },

  /**
   * Accepte une course disponible via la RPC sécurisée `accept_delivery_assignment`.
   */
  async acceptRun(assignmentId: string, driverId: string): Promise<void> {
    const { data, error } = await supabase.rpc('accept_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_delivery_person_id: driverId,
    });

    // Pas de fallback UPDATE direct : aucune policy RLS ne permet à un livreur
    // de modifier une ligne sans `delivery_person_id`, PostgREST renvoyait 0 ligne sans erreur.
    if (error) throw error;

    if (data && typeof data === 'object' && 'success' in (data as any) && !(data as any).success) {
      throw new Error(
        (data as any).reason || 'Cette course a déjà été acceptée par un autre livreur.'
      );
    }
  },

  /**
   * Libère une course acceptée avant le ramassage chez le vendeur et la remet en ligne.
   */
  async releaseRun(assignmentId: string, reason?: string): Promise<void> {
    return deliveryVerificationService.releaseRun(assignmentId, reason);
  },

  /**
   * Récupère la course actuellement active pour un livreur (`pickup_otp`/`delivery_otp` exclus).
   */
  async getActiveRun(driverId: string): Promise<ActiveDeliveryRunDetails | null> {
    await sweepStaleAcceptedRunsIfNeeded();

    const { data: rawResult, error } = await (supabase.from('delivery_assignments') as any)
      .select(RUN_DETAIL_SELECT)
      .eq('delivery_person_id', driverId)
      .in('status', ['accepted', 'picked_up', 'in_transit'])
      .order('delivery_price', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[deliveryService.getActiveRun] Erreur lecture course active:', error.message);
      return null;
    }
    if (!rawResult) return null;

    await attachContactPhones([rawResult.orders?.seller, rawResult.orders?.buyer]);
    return mapActiveDeliveryRun(rawResult);
  },

  /**
   * Valide le ramassage chez le vendeur avec vérification OTP + Photo + GPS (<= 100 m).
   */
  async verifyPickupWithOtpAndGps(params: VerifyPickupParams): Promise<VerificationResult> {
    return deliveryVerificationService.verifyPickup(params);
  },

  /**
   * Valide la livraison chez l'acheteur avec vérification OTP + Photo + GPS (<= 100 m).
   */
  async verifyDeliveryWithOtpAndGps(params: VerifyDeliveryParams): Promise<VerificationResult> {
    return deliveryVerificationService.verifyDelivery(params);
  },

  /**
   * Récupère les statistiques quotidiennes et le solde réel disponible du livreur.
   */
  async getDriverDailyStats(driverId: string): Promise<DriverDailyStats> {
    return fetchDriverDailyStats(driverId);
  },

  /**
   * Récupère l'annuaire des livreurs partenaires de Daloa.
   */
  async getDeliverersDirectory(vehicleType?: string, zone?: string): Promise<DeliveryPersonRow[]> {
    return fetchDeliverersDirectory(vehicleType, zone);
  },

  /**
   * Téléverse un document KYC vers le bucket sécurisé.
   */
  async uploadKycDocument(
    fileUri: string,
    driverId: string,
    docType: 'cni_front' | 'cni_back' | 'selfie' | string
  ): Promise<string> {
    return deliveryStorageService.uploadKycDocument(fileUri, driverId, docType);
  },

  /**
   * Soumet les documents KYC pour vérification CNI.
   */
  async submitKycVerification(
    driverId: string,
    payload: {
      cniUrl: string;
      selfieCniUrl: string;
      portraitLiveUrl?: string;
      licenceUrl?: string | null;
    }
  ): Promise<void> {
    return deliveryStorageService.submitKycVerification(driverId, payload);
  },

  /**
   * Téléverse une photo de preuve vers Supabase Storage sécurisé.
   */
  async uploadDeliveryProof(
    input: string | { fileUri: string; base64?: string | null },
    assignmentId?: string
  ): Promise<string> {
    return deliveryStorageService.uploadDeliveryProof(input, assignmentId);
  },

  /**
   * Signale un incident de livraison.
   */
  async reportIncident(assignmentId: string, reason: string): Promise<void> {
    return deliveryVerificationService.reportIncident(assignmentId, reason);
  },
};
