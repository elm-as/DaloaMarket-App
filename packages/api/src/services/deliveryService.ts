import { supabase } from '../supabase';
import {
  AvailableDeliveryRun,
  ActiveDeliveryRunDetails,
  DriverDailyStats,
  DeliveryPersonRow,
  Coordinates,
} from '@daloa/types';
import { haversineDistance, isWithinOtpProximity } from '@daloa/utils';

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
      .update({ current_location: coords })
      .eq('id', driverId);
  },

  /**
   * Récupère les courses disponibles en attente d'attribution
   */
  async getAvailableRuns(driverCoords?: Coordinates | null): Promise<AvailableDeliveryRun[]> {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*, orders:order_id(id, delivery_address, delivery_district, delivery_lat, delivery_lng, total_amount, quantity, listings:listing_id(id, title, photos, price, district), seller:seller_id(id, full_name, phone, shop_name, district, shop_latitude, shop_longitude), buyer:buyer_id(id, full_name, phone))')
      .in('status', ['awaiting_pickup', 'pending_seller_confirmation'])
      .is('delivery_person_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => {
      const order = item.orders || {};
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
      const deliveryPrice = item.delivery_price || 500;
      const driverFee = item.driver_fee || Math.round(deliveryPrice * 0.10);
      const driverNetGain = deliveryPrice - driverFee;

      return {
        assignmentId: item.id,
        orderId: item.order_id,
        pickupLocation: item.pickup_location || `${seller.shop_name || 'Vendeur'} (${seller.district || listing.district || 'Daloa'})`,
        dropoffLocation: item.dropoff_location || `${order.delivery_address} (${order.delivery_district})`,
        pickupDistrict: seller.district || listing.district || 'Daloa Centre',
        dropoffDistrict: order.delivery_district || 'Daloa',
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
   * Accepte une course disponible
   */
  async acceptRun(assignmentId: string, driverId: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_assignments')
      .update({
        delivery_person_id: driverId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .is('delivery_person_id', null);

    if (error) throw error;
  },

  /**
   * Récupère la course actuellement active pour un livreur
   */
  async getActiveRun(driverId: string): Promise<ActiveDeliveryRunDetails | null> {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*, orders:order_id(id, delivery_address, delivery_district, delivery_lat, delivery_lng, total_amount, listings:listing_id(id, title, photos, price, district), seller:seller_id(id, full_name, phone, shop_name, district, shop_latitude, shop_longitude), buyer:buyer_id(id, full_name, phone))')
      .eq('delivery_person_id', driverId)
      .in('status', ['accepted', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error || !data) return null;

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
    const deliveryPrice = data.delivery_price || 500;
    const driverFee = data.driver_fee || Math.round(deliveryPrice * 0.10);

    return {
      assignmentId: data.id,
      orderId: data.order_id,
      status: data.status,
      pickupOtp: data.pickup_otp,
      deliveryOtp: data.delivery_otp,
      pickupConfirmedBySeller: data.pickup_confirmed_by_seller,
      pickupConfirmedAt: data.pickup_confirmed_at,
      deliveredAt: data.delivered_at,
      pickupPhotoUrl: data.pickup_photo_url,
      deliveryPhotoUrl: data.delivery_photo_url,
      pickupLocation: data.pickup_location,
      dropoffLocation: data.dropoff_location,
      pickupDistrict: seller.district || listing.district || 'Daloa Centre',
      dropoffDistrict: order.delivery_district || 'Daloa',
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
      distanceKm: Math.round(distanceKm * 10) / 10,
      deliveryPrice,
      driverFee,
      driverNetGain: deliveryPrice - driverFee,
      isPrivate: data.is_private ?? false,
      sellerName: seller.shop_name || seller.full_name || 'Vendeur',
      sellerPhone: seller.phone || null,
      buyerName: buyer.full_name || 'Client',
      buyerPhone: buyer.phone || null,
      productTitle: listing.title,
      productPhoto: listing.photos?.[0] || null,
      createdAt: data.created_at,
    };
  },

  /**
   * Valide le ramassage chez le vendeur avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyPickupWithOtpAndGps(params: {
    assignmentId: string;
    enteredOtp: string;
    photoUrl: string;
    driverCoords: Coordinates;
    targetCoords?: Coordinates | null;
  }): Promise<{ success: boolean; message?: string }> {
    // 1. Récupérer l'assignation
    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('pickup_otp, pickup_otp_attempts')
      .eq('id', params.assignmentId)
      .single();

    if (error || !assignment) throw new Error('Assignation introuvable');

    if (assignment.pickup_otp.trim() !== params.enteredOtp.trim()) {
      await supabase
        .from('delivery_assignments')
        .update({ pickup_otp_attempts: (assignment.pickup_otp_attempts || 0) + 1 })
        .eq('id', params.assignmentId);
      throw new Error('Code OTP Vendeur incorrect. Demandez le code au vendeur.');
    }

    // 2. Proximité GPS si disponible
    let distanceMeters: number | null = null;
    if (params.targetCoords) {
      const prox = isWithinOtpProximity(params.driverCoords, params.targetCoords);
      distanceMeters = prox.distanceMeters;
    }

    // 3. Mise à jour de l'état -> picked_up / in_transit
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

    return { success: true, message: 'Colis ramassé avec succès ! En route vers l’acheteur.' };
  },

  /**
   * Valide la livraison chez l'acheteur avec vérification OTP + Photo + GPS (≤ 100m)
   */
  async verifyDeliveryWithOtpAndGps(params: {
    assignmentId: string;
    enteredOtp: string;
    photoUrl: string;
    driverCoords: Coordinates;
    targetCoords?: Coordinates | null;
  }): Promise<{ success: boolean; message?: string }> {
    // 1. Récupérer l'assignation
    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('delivery_otp, delivery_otp_attempts, order_id')
      .eq('id', params.assignmentId)
      .single();

    if (error || !assignment) throw new Error('Assignation introuvable');

    if (assignment.delivery_otp.trim() !== params.enteredOtp.trim()) {
      await supabase
        .from('delivery_assignments')
        .update({ delivery_otp_attempts: (assignment.delivery_otp_attempts || 0) + 1 })
        .eq('id', params.assignmentId);
      throw new Error('Code OTP Client incorrect. Demandez le code à l’acheteur.');
    }

    let distanceMeters: number | null = null;
    if (params.targetCoords) {
      const prox = isWithinOtpProximity(params.driverCoords, params.targetCoords);
      distanceMeters = prox.distanceMeters;
    }

    // 2. Mettre à jour l'assignation -> delivered
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

    // 3. Mettre à jour le statut de la commande -> delivered
    await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', assignment.order_id);

    return { success: true, message: 'Livraison validée avec succès ! Les fonds sont débloqués.' };
  },

  /**
   * Récupère les statistiques quotidiennes et le solde du livreur
   */
  async getDriverDailyStats(driverId: string): Promise<DriverDailyStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: driver } = await supabase
      .from('delivery_persons')
      .select('*')
      .eq('id', driverId)
      .single();

    const { data: completedRuns } = await supabase
      .from('delivery_assignments')
      .select('delivery_price, driver_fee, delivered_at')
      .eq('delivery_person_id', driverId)
      .eq('status', 'delivered')
      .gte('delivered_at', today.toISOString());

    let earningsToday = 0;
    (completedRuns || []).forEach((r) => {
      const gain = (r.delivery_price || 0) - (r.driver_fee || 0);
      earningsToday += gain;
    });

    return {
      completedRunsToday: completedRuns?.length || 0,
      earningsToday,
      pendingEscrowAmount: 0,
      totalAvailableBalance: earningsToday,
      rating: driver?.rating || 5.0,
      isOnline: Boolean(driver?.is_available),
    };
  },

  /**
   * Récupère la liste des livreurs partenaires de Daloa
   */
  async getDeliverersDirectory(vehicleType?: string, zone?: string): Promise<DeliveryPersonRow[]> {
    let query = supabase
      .from('delivery_persons')
      .select('*')
      .order('rating', { ascending: false });

    if (vehicleType && vehicleType !== 'all') {
      query = query.eq('vehicle_type', vehicleType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Soumet les documents KYC pour vérification CNI
   */
  async submitKycVerification(driverId: string, payload: {
    cniUrl: string;
    selfieCniUrl: string;
    portraitLiveUrl?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('delivery_persons')
      .update({
        cni_url: payload.cniUrl,
        selfie_cni_url: payload.selfieCniUrl,
        portrait_live_url: payload.portraitLiveUrl || null,
        verification_status: 'pending',
      })
      .eq('id', driverId);

    if (error) throw error;
  },
};
