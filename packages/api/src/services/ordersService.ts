import { supabase } from '../supabase';
import { OrderWithDetails, CheckoutPayload, OrderStatus } from '@daloa/types';
import { calculateOrderBreakdown } from '@daloa/config';
import { haversineDistance, generateSecureOtp } from '@daloa/utils';
import { systemSettingsService } from './systemSettingsService';

export const ordersService = {
  /**
   * Crée une commande avec séquestre Escrow et génération des codes OTP
   */
  async createOrder(buyerId: string, payload: CheckoutPayload): Promise<OrderWithDetails> {
    // 1. Récupérer l'annonce et les infos vendeur
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('*, users:user_id(*)')
      .eq('id', payload.listing_id)
      .single();

    if (listingErr || !listing) throw new Error('Article introuvable');

    const seller = listing.users;
    const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());

    // 2. Calcul de la distance
    const sellerCoords = {
      lat: seller?.shop_latitude ?? seller?.latitude ?? 6.8773,
      lng: seller?.shop_longitude ?? seller?.longitude ?? -6.4502,
    };
    const buyerCoords = {
      lat: payload.delivery_lat ?? 6.8773,
      lng: payload.delivery_lng ?? -6.4502,
    };
    const distanceKm = haversineDistance(sellerCoords, buyerCoords);

    // Override de commission autoritaire depuis la config de phase (Phase 0 = 0%).
    // Lu ici pour garantir la cohérence web/mobile quel que soit l'appelant.
    let sellerFeeOverride: number | null = null;
    try {
      const { phaseConfig } = await systemSettingsService.getSettings();
      sellerFeeOverride = phaseConfig.seller_fee_override;
    } catch {
      // en cas d'échec, grille par défaut (fail-safe)
    }

    // 3. Calcul de la ventilation des montants
    const breakdown = calculateOrderBreakdown({
      productPrice: listing.price,
      quantity: payload.quantity,
      distanceKm,
      isProSeller: isPro,
      deliveryMode: payload.delivery_mode,
      deliveryFeeOverride: listing.delivery_fee_override,
      sellerFeeOverride,
    });

    // 4. Insertion de la commande
    const fullAddress = payload.delivery_district
      ? `${payload.delivery_address || ''} (${payload.delivery_district})`.trim()
      : payload.delivery_address || 'Daloa';

    const orderPayload = {
      buyer_id: buyerId,
      seller_id: listing.user_id,
      listing_id: payload.listing_id,
      variant_id: payload.variant_id || null,
      variant_label: payload.variant_label || null,
      unit_price: listing.price,
      quantity: payload.quantity || 1,
      product_amount: Math.round(breakdown.productSubtotal),
      delivery_fee: Math.round(breakdown.deliveryFee),
      platform_commission: Math.round(breakdown.sellerCommission),
      reserve_fee: Math.round(breakdown.buyerServiceFee),
      total_amount: Math.round(breakdown.totalAmount),
      status: 'pending',
      delivery_mode: payload.delivery_mode === 'pickup' ? 'pickup' : 'delivery',
      payment_method: payload.payment_method,
      delivery_address: fullAddress,
      delivery_lat: payload.delivery_lat || null,
      delivery_lng: payload.delivery_lng || null,
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) {
      console.error('[ordersService] Erreur création commande:', orderErr);
      throw orderErr;
    }

    // 5. Si livraison demandée, créer le delivery_assignment avec les deux codes OTP aléatoires 4 chiffres
    if (payload.delivery_mode === 'delivery') {
      const pickupOtp = generateSecureOtp(4);
      const deliveryOtp = generateSecureOtp(4);

      const { error: assignErr } = await supabase.from('delivery_assignments').insert({
        order_id: order.id,
        seller_id: listing.user_id,
        status: 'awaiting_pickup',
        pickup_location: `${seller?.shop_name || 'Boutique'} (${seller?.district || listing.district})`,
        dropoff_location: fullAddress,
        delivery_price: Math.round(breakdown.deliveryFee),
        pickup_otp: pickupOtp,
        delivery_otp: deliveryOtp,
        pickup_confirmed_by_seller: false,
      });

      if (assignErr) {
        console.warn('[ordersService] Erreur création delivery_assignment:', assignErr.message);
      }
    }

    return this.getOrderById(order.id);
  },

  /**
   * Récupère la liste des commandes d'un utilisateur (acheteur ou vendeur)
   */
  async getUserOrders(
    userId: string,
    role: 'buyer' | 'seller' = 'buyer',
    statusFilter?: string
  ): Promise<OrderWithDetails[]> {
    let query = supabase
      .from('orders')
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating), buyer:buyer_id(id, full_name, phone, avatar_url), delivery_assignments(*)')
      .order('created_at', { ascending: false });

    if (role === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else {
      query = query.eq('seller_id', userId);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      listing: item.listings || null,
      seller: item.seller || null,
      buyer: item.buyer || null,
      delivery_assignment: Array.isArray(item.delivery_assignments)
        ? item.delivery_assignments[0] || null
        : item.delivery_assignments || null,
    }));
  },

  /**
   * Récupère le détail complet d'une commande
   */
  async getOrderById(orderId: string): Promise<OrderWithDetails> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, pro_until), buyer:buyer_id(id, full_name, phone, avatar_url), delivery_assignments(*)')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Commande introuvable');

    const assignment = Array.isArray(data.delivery_assignments)
      ? data.delivery_assignments[0]
      : data.delivery_assignments;

    let deliveryPerson = null;
    if (assignment?.delivery_person_id) {
      const { data: dp } = await supabase
        .from('delivery_persons')
        .select('id, name, phone, photo_url, vehicle_type, rating, total_reviews, is_verified, current_location')
        .eq('id', assignment.delivery_person_id)
        .maybeSingle();
      deliveryPerson = dp;
    }

    return {
      ...data,
      listing: data.listings || null,
      seller: data.seller || null,
      buyer: data.buyer || null,
      delivery_assignment: assignment || null,
      delivery_person: deliveryPerson || null,
    };
  },

  /**
   * Annuler une commande par l'acheteur
   */
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('cancel_order_buyer', {
        p_order_id: orderId,
      });

      if (!error && data) {
        if (!data.success) {
          throw new Error(data.message || 'Impossible d’annuler cette commande.');
        }
        return;
      }
    } catch (rpcErr: any) {
      if (rpcErr.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('schema')) {
        throw rpcErr;
      }
    }

    // Fallback direct si la RPC n'est pas déployée
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Déclarer un litige sur une commande
   */
  async reportDispute(orderId: string, reason: string): Promise<void> {
    try {
      const { data: assignment } = await supabase
        .from('delivery_assignments')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (assignment?.id) {
        const { data, error } = await supabase.rpc('report_delivery_dispute', {
          p_assignment_id: assignment.id,
          p_reason: reason,
        });
        if (!error && data?.success) {
          return;
        }
      }
    } catch {
      // Poursuivre avec fallback si RPC non disponible
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'disputed',
        cancel_reason: reason,
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Souscription en temps réel aux mises à jour d'une commande
   */
  subscribeToOrderUpdates(orderId: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => onUpdate(payload)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'delivery_assignments', filter: `order_id=eq.${orderId}` },
        (payload) => onUpdate(payload)
      )
      .subscribe();
  },
};
