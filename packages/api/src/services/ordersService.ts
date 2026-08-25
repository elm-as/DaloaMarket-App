import { supabase } from '../supabase';
import { OrderWithDetails, CheckoutPayload, OrderStatus } from '@daloa/types';
import { calculateOrderBreakdown } from '@daloa/config';
import { haversineDistance } from '@daloa/utils';

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

    // 3. Calcul de la ventilation des montants
    const breakdown = calculateOrderBreakdown({
      productPrice: listing.price,
      quantity: payload.quantity,
      distanceKm,
      isProSeller: isPro,
      deliveryMode: payload.delivery_mode,
      deliveryFeeOverride: listing.delivery_fee_override,
    });

    // 4. Insertion de la commande
    const orderPayload = {
      buyer_id: buyerId,
      seller_id: listing.user_id,
      listing_id: payload.listing_id,
      variant_id: payload.variant_id || null,
      variant_label: payload.variant_label || null,
      unit_price: listing.price,
      quantity: payload.quantity,
      product_amount: breakdown.productSubtotal,
      delivery_fee: breakdown.deliveryFee,
      buyer_fee: breakdown.buyerServiceFee,
      seller_fee: breakdown.sellerCommission,
      total_amount: breakdown.totalAmount,
      status: payload.payment_method === 'cash_on_delivery' ? 'awaiting_pickup' : 'pending_payment',
      delivery_mode: payload.delivery_mode,
      payment_method: payload.payment_method,
      delivery_address: payload.delivery_address,
      delivery_district: payload.delivery_district,
      delivery_lat: payload.delivery_lat || null,
      delivery_lng: payload.delivery_lng || null,
      buyer_notes: payload.buyer_notes || null,
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 5. Si livraison demandée, créer le delivery_assignment avec les deux codes OTP aléatoires 4 chiffres
    if (payload.delivery_mode === 'delivery') {
      const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

      await supabase.from('delivery_assignments').insert({
        order_id: order.id,
        status: 'awaiting_pickup',
        pickup_location: `${seller?.shop_name || 'Boutique'} (${seller?.district || listing.district})`,
        dropoff_location: `${payload.delivery_address} (${payload.delivery_district})`,
        delivery_price: breakdown.deliveryFee,
        driver_fee: breakdown.driverFee,
        pickup_otp: pickupOtp,
        delivery_otp: deliveryOtp,
        pickup_confirmed_by_seller: false,
      });
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
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, review_count, pro_until, cash_on_delivery_enabled), buyer:buyer_id(id, full_name, phone, avatar_url), delivery_assignments(*)')
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
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: 'buyer',
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Déclarer un litige sur une commande
   */
  async reportDispute(orderId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'disputed',
        cancellation_reason: reason,
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
