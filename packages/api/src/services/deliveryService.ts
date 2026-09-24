import { supabase } from '../supabase';
import { attachContactPhones } from '../lib/contacts';
import {
  AvailableDeliveryRun,
  ActiveDeliveryRunDetails,
  DriverDailyStats,
  DeliveryPersonRow,
  Coordinates,
  DeliveryRunStatus,
} from '@daloa/types';
import { haversineDistance, isLocationInDaloa, serializeGeoPoint } from '@daloa/utils';
import { DALOA_CENTER, DALOA_DISTRICT_COORDINATES } from '@daloa/config';
import {
  deliveryVerificationService,
  VerifyPickupParams,
  VerifyDeliveryParams,
  VerificationResult,
} from './deliveryVerificationService';
import { deliveryStorageService } from './deliveryStorageService';

/**
 * Part des frais de livraison retenue par la plateforme.
 *
 * `delivery_assignments` n'a pas de colonne `driver_fee` : la commission est
 * derivee ici du prix de la course, et le livreur conserve les 90 % restants
 * — le taux annonce aux coursiers a l'inscription.
 */
export const PLATFORM_COMMISSION_RATE = 0.1;

/** Aperçu d'une course à prendre, pour les pastilles et la cloche de l'en-tête. */
export interface AvailableRunBriefItem {
  assignmentId: string;
  pickupLocation: string;
  dropoffLocation: string;
  deliveryPrice: number;
  createdAt: string;
}

export interface AvailableRunsBrief {
  count: number;
  runs: AvailableRunBriefItem[];
}

const commissionOn = (deliveryPrice: number): number =>
  Math.round(deliveryPrice * PLATFORM_COMMISSION_RATE);

/**
 * `orders` n'a pas de colonne `delivery_district` : `ordersService` concatene le
 * quartier dans `delivery_address` sous la forme « Adresse (Quartier) ». On le
 * re-extrait ici, plutot que de demander a PostgREST une colonne inexistante.
 */
const parseDropoffAddress = (address?: string | null): { address: string; district: string } => {
  const raw = (address || '').trim();
  const match = raw.match(/^(.*?)\s*\(([^()]+)\)$/);
  return match
    ? { address: match[1].trim(), district: match[2].trim() }
    : { address: raw, district: '' };
};

export const deliveryService = {
  /**
   * Bascule la disponibilité du livreur (En Ligne / Hors Ligne)
   */
  async setDriverAvailability(driverId: string, isAvailable: boolean): Promise<void> {
    const { error } = await supabase
      .from('delivery_persons')
      .update({ is_available: isAvailable })
      .eq('id', driverId);

    if (error) throw error;
  },

  /**
   * Met à jour la position GPS du livreur
   */
  async updateDriverLocation(driverId: string, coords: Coordinates): Promise<void> {
    await supabase
      .from('delivery_persons')
      .update({ current_location: serializeGeoPoint(coords) })
      .eq('id', driverId);
  },

  /**
   * Récupère les courses disponibles en attente d'attribution
   */
  async getAvailableRuns(driverCoords?: Coordinates | null): Promise<AvailableDeliveryRun[]> {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*, orders:order_id(id, delivery_address, delivery_lat, delivery_lng, total_amount, quantity, listings:listing_id(id, title, photos, price, district), seller:seller_id(id, full_name, shop_name, district, shop_latitude, shop_longitude), buyer:buyer_id(id, full_name))')
      .eq('status', 'awaiting_pickup')
      .is('delivery_person_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Téléphones via get_contact_phones : avant l'acceptation, seul celui d'un
    // vendeur en ligne est visible ; celui de l'acheteur l'est une fois la course prise.
    await attachContactPhones((data || []).flatMap((item: any) => [item.orders?.seller, item.orders?.buyer]));

    return (data || []).map((item: any) => {
      const order = item.orders || {};
      const listing = order.listings || {};
      const seller = order.seller || {};
      const buyer = order.buyer || {};

      const dropoff = parseDropoffAddress(order.delivery_address);

      const isSellerGpsValid =
        seller.shop_latitude != null &&
        seller.shop_longitude != null &&
        isLocationInDaloa(seller.shop_latitude, seller.shop_longitude);

      const sellerDistrictFallback =
        (seller.district && (DALOA_DISTRICT_COORDINATES as any)[seller.district]) ||
        (listing.district && (DALOA_DISTRICT_COORDINATES as any)[listing.district]);

      const pickupCoords: Coordinates = {
        lat: isSellerGpsValid
          ? seller.shop_latitude
          : (sellerDistrictFallback?.latitude ?? DALOA_CENTER.lat),
        lng: isSellerGpsValid
          ? seller.shop_longitude
          : (sellerDistrictFallback?.longitude ?? DALOA_CENTER.lng),
      };

      const isOrderGpsValid =
        order.delivery_lat != null &&
        order.delivery_lng != null &&
        isLocationInDaloa(order.delivery_lat, order.delivery_lng);

      const buyerDistrictFallback =
        dropoff.district && (DALOA_DISTRICT_COORDINATES as any)[dropoff.district];

      const dropoffCoords: Coordinates = {
        lat: isOrderGpsValid
          ? order.delivery_lat
          : (buyerDistrictFallback?.latitude ?? DALOA_CENTER.lat),
        lng: isOrderGpsValid
          ? order.delivery_lng
          : (buyerDistrictFallback?.longitude ?? DALOA_CENTER.lng),
      };

      const distanceKm = haversineDistance(pickupCoords, dropoffCoords);
      const deliveryPrice = Number(item.delivery_price) || 500;
      const driverFee = commissionOn(deliveryPrice);
      const driverNetGain = deliveryPrice - driverFee;

      return {
        assignmentId: item.id,
        orderId: item.order_id,
        pickupLocation: item.pickup_location || `${seller.shop_name || 'Vendeur'} (${seller.district || listing.district || 'Daloa'})`,
        dropoffLocation: item.dropoff_location || item.dropoff_address || dropoff.address || 'Adresse client',
        pickupDistrict: seller.district || listing.district || 'Daloa Centre',
        dropoffDistrict: dropoff.district || 'Daloa',
        pickupCoordinates: pickupCoords,
        dropoffCoordinates: dropoffCoords,
        distanceKm: Math.round(distanceKm * 10) / 10,
        deliveryPrice,
        driverFee,
        driverNetGain,
        isPrivate: item.is_private ?? false,
        sellerName: seller.shop_name || seller.full_name || 'Vendeur',
        sellerPhone: seller.phone || null,
        buyerName: buyer.full_name || 'Client DaloaMarket',
        buyerPhone: buyer.phone || null,
        productTitle: listing.title,
        productPhoto: listing.photos?.[0] || null,
        createdAt: item.created_at,
      };
    });
  },

  /**
   * Version légère de `getAvailableRuns` pour les pastilles et la cloche : le
   * décompte exact des courses à prendre + les quelques plus récentes.
   *
   * Volontairement sans jointure ni calcul de distance — c'est ce qui permet de
   * l'appeler depuis la barre du haut sans dupliquer la requête complète de
   * l'écran « Courses disponibles ».
   */
  async getAvailableRunsBrief(limit = 5): Promise<AvailableRunsBrief> {
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
   * Accepte une course disponible (via RPC sécurisée accept_delivery_assignment pour passer les RLS)
   */
  async acceptRun(assignmentId: string, driverId: string): Promise<void> {
    const { data, error } = await supabase.rpc('accept_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_delivery_person_id: driverId,
    });

    // Le repli qui existait ici a été retiré volontairement.
    // Il rejouait l'acceptation par un UPDATE direct filtré sur
    // `.is('delivery_person_id', null)` : aucune policy RLS UPDATE ne couvre une
    // ligne sans livreur assigné, donc PostgREST renvoyait 0 ligne modifiée *sans
    // erreur*. La promesse résolvait, l'app naviguait vers l'écran de course, et
    // la course restait en réalité disponible pour tout le monde.
    // `accept_delivery_assignment` est désormais le seul chemin.
    if (error) throw error;

    if (data && typeof data === 'object' && 'success' in (data as any) && !(data as any).success) {
      throw new Error((data as any).reason || 'Cette course a déjà été acceptée par un autre livreur.');
    }
  },

  /**
   * Récupère la course actuellement active pour un livreur.
   * Note de sécurité : pickupOtp et deliveryOtp sont exclus de la réponse envoyée au livreur.
   */
  async getActiveRun(driverId: string): Promise<ActiveDeliveryRunDetails | null> {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*, orders:order_id(id, delivery_address, delivery_lat, delivery_lng, total_amount, listings:listing_id(id, title, photos, price, district), seller:seller_id(id, full_name, shop_name, district, shop_latitude, shop_longitude), buyer:buyer_id(id, full_name))')
      .eq('delivery_person_id', driverId)
      .in('status', ['accepted', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error || !data) return null;

    await attachContactPhones([(data as any).orders?.seller, (data as any).orders?.buyer]);

    const order = data.orders || {};
    const listing = order.listings || {};
    const seller = order.seller || {};
    const buyer = order.buyer || {};

    const pickupCoords: Coordinates = {
      lat: seller.shop_latitude ?? 6.8773,
      lng: seller.shop_longitude ?? -6.4502,
    };
    const dropoffCoords: Coordinates = {
      lat: order.delivery_lat ?? 6.8773,
      lng: order.delivery_lng ?? -6.4502,
    };
    const distanceKm = haversineDistance(pickupCoords, dropoffCoords);
    const deliveryPrice = Number(data.delivery_price) || 500;
    const driverFee = commissionOn(deliveryPrice);
    const dropoff = parseDropoffAddress(order.delivery_address);

    return {
      assignmentId: data.id,
      orderId: data.order_id,
      status: data.status as DeliveryRunStatus,
      pickupConfirmedBySeller: data.pickup_confirmed_by_seller,
      pickupConfirmedAt: data.pickup_confirmed_at,
      deliveredAt: data.delivered_at,
      pickupPhotoUrl: data.pickup_photo_url,
      deliveryPhotoUrl: data.delivery_photo_url,
      pickupLocation: data.pickup_location,
      dropoffLocation:
        (typeof data.dropoff_location === 'string' && data.dropoff_location) ||
        (typeof data.dropoff_address === 'string' && data.dropoff_address) ||
        dropoff.address || 'Adresse client',
      pickupDistrict: seller.district || listing.district || 'Daloa Centre',
      dropoffDistrict: dropoff.district || 'Daloa',
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
      distanceKm: Math.round(distanceKm * 10) / 10,
      deliveryPrice,
      driverFee,
      driverNetGain: deliveryPrice - driverFee,
      isPrivate: data.is_private ?? false,
      sellerName: seller.shop_name || seller.full_name || 'Vendeur',
      sellerPhone: (seller as { phone?: string | null }).phone || null,
      buyerName: buyer.full_name || 'Client',
      buyerPhone: (buyer as { phone?: string | null }).phone || null,
      productTitle: listing.title,
      productPhoto: listing.photos?.[0] || null,
      createdAt: data.created_at,
    };
  },

  /**
   * Valide le ramassage chez le vendeur avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyPickupWithOtpAndGps(params: VerifyPickupParams): Promise<VerificationResult> {
    return deliveryVerificationService.verifyPickup(params);
  },

  /**
   * Valide le code OTP Vendeur
   */
  async verifyPickupOtp(
    assignmentId: string,
    enteredOtp: string,
    photoUrl: string,
    driverCoords?: Coordinates,
    targetCoords?: Coordinates | null
  ): Promise<VerificationResult> {
    return deliveryVerificationService.verifyPickup({
      assignmentId,
      enteredOtp,
      photoUrl,
      driverCoords: driverCoords || { lat: 6.8773, lng: -6.4502 },
      targetCoords,
    });
  },

  /**
   * Valide la livraison chez l'acheteur avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyDeliveryWithOtpAndGps(params: VerifyDeliveryParams): Promise<VerificationResult> {
    return deliveryVerificationService.verifyDelivery(params);
  },

  /**
   * Valide le code OTP Client Acheteur
   */
  async verifyDeliveryOtp(
    assignmentId: string,
    enteredOtp: string,
    photoUrl: string,
    driverCoords?: Coordinates,
    targetCoords?: Coordinates | null
  ): Promise<VerificationResult> {
    return deliveryVerificationService.verifyDelivery({
      assignmentId,
      enteredOtp,
      photoUrl,
      driverCoords: driverCoords || { lat: 6.8773, lng: -6.4502 },
      targetCoords,
    });
  },

  /**
   * Récupère les statistiques quotidiennes et le solde réel du livreur
   */
  async getDriverDailyStats(driverId: string): Promise<DriverDailyStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: driver } = await supabase
      .from('delivery_persons')
      .select('id, user_id, rating, is_available')
      .eq('id', driverId)
      .maybeSingle();

    const driverUserId = driver?.user_id || driverId;

    const [deliveredRes, activeRes, payoutsRes] = await Promise.all([
      // 1. Toutes les courses livrées par ce coursier
      supabase
        .from('delivery_assignments')
        .select('delivery_price, delivered_at')
        .eq('delivery_person_id', driverId)
        .eq('status', 'delivered'),
      // 2. Courses actuellement en cours d'acheminement
      supabase
        .from('delivery_assignments')
        .select('delivery_price')
        .eq('delivery_person_id', driverId)
        .in('status', ['assigned', 'picked_up', 'in_transit']),
      // 3. Versements liés aux livraisons uniquement
      supabase
        .from('payouts')
        .select('amount, status')
        .eq('user_id', driverUserId)
        .eq('type', 'delivery'),
    ]);

    const allDelivered = deliveredRes.data || [];
    const activeRuns = activeRes.data || [];
    const payouts = payoutsRes.data || [];

    let earningsToday = 0;
    let completedRunsToday = 0;
    let totalLifetimeEarnings = 0;

    allDelivered.forEach((r) => {
      const price = Number(r.delivery_price) || 0;
      const net = price - commissionOn(price);
      totalLifetimeEarnings += net;

      if (r.delivered_at && new Date(r.delivered_at) >= today) {
        earningsToday += net;
        completedRunsToday += 1;
      }
    });

    const pendingEscrowAmount = activeRuns.reduce((sum, r) => {
      const price = Number(r.delivery_price) || 0;
      return sum + (price - commissionOn(price));
    }, 0);

    const pendingPayoutAmount = payouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const paidOutAmount = payouts
      .filter((p) => p.status === 'paid' || p.status === 'completed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalAvailableBalance = Math.max(0, totalLifetimeEarnings - paidOutAmount - pendingPayoutAmount);

    return {
      completedRunsToday,
      earningsToday,
      pendingEscrowAmount,
      totalAvailableBalance,
      rating: driver?.rating != null ? Number(driver.rating) : null,
      isOnline: Boolean(driver?.is_available),
      totalLifetimeEarnings,
      totalCompletedRuns: allDelivered.length,
      pendingPayoutAmount,
      paidOutAmount,
    };
  },

  /**
   * Récupère l'annuaire des livreurs partenaires de Daloa
   */
  async getDeliverersDirectory(vehicleType?: string, zone?: string): Promise<DeliveryPersonRow[]> {
    let query = supabase
      .from('delivery_persons_directory')
      .select('*')
      .order('rating', { ascending: false });

    if (vehicleType && vehicleType !== 'all') {
      query = query.eq('vehicle_type', vehicleType);
    }

    if (zone && zone !== 'all') {
      query = query.contains('coverage_zones', [zone]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data as unknown as DeliveryPersonRow[]) || []).filter(
      (d) => Boolean(d.name && d.name.trim().length > 0 && d.phone && d.phone.trim().length > 0)
    );
  },

  /**
   * Téléverse un document KYC vers le bucket sécurisé
   */
  async uploadKycDocument(
    fileUri: string,
    driverId: string,
    docType: 'cni_front' | 'cni_back' | 'selfie' | string
  ): Promise<string> {
    return deliveryStorageService.uploadKycDocument(fileUri, driverId, docType);
  },

  /**
   * Soumet les documents KYC pour vérification CNI
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
   * Téléverse une photo de preuve vers Supabase Storage sécurisé
   */
  async uploadDeliveryProof(fileUri: string, assignmentId?: string): Promise<string> {
    return deliveryStorageService.uploadDeliveryProof(fileUri, assignmentId);
  },

  /**
   * Signale un incident de livraison
   */
  async reportIncident(assignmentId: string, reason: string): Promise<void> {
    return deliveryVerificationService.reportIncident(assignmentId, reason);
  },
};
