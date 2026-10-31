import { ENV_CONFIG } from '@daloa/config';
import { supabase } from '../supabase';
import { attachContactPhones } from '../lib/contacts';
import { OrderWithDetails, CheckoutPayload } from '@daloa/types';

const COD_RPC_ERRORS: Record<string, string> = {
  unauthenticated: 'Session expirée. Reconnectez-vous pour commander.',
  empty_cart: 'Votre panier est vide.',
  unsupported_payment_method: 'Ce mode de paiement ne passe pas par ce chemin.',
  no_active_listing: 'Ces articles ne sont plus disponibles à la vente.',
  cod_not_allowed: 'Le paiement à la livraison n’est pas disponible pour cet article. Choisissez le paiement en ligne.',
  pickup_not_allowed: 'Le retrait en boutique n’est pas disponible pour cet article. Choisissez la livraison.',
  quote_expired: 'Le prix a expiré, il vient d’être recalculé. Vérifiez puis validez.',
  quote_used: 'Ce prix a déjà servi, il vient d’être recalculé. Vérifiez puis validez.',
  quote_stale: 'Un article a changé, le prix vient d’être recalculé. Vérifiez puis validez.',
  quote_not_found: 'Le prix vient d’être recalculé. Vérifiez puis validez.',
  quote_mismatch: 'Le prix vient d’être recalculé. Vérifiez puis validez.',
};

function codError(reason?: string): Error {
  const err: any = new Error(COD_RPC_ERRORS[reason || ''] || reason || 'Commande impossible.');
  err.reason = reason;
  return err;
}

const SELLER_RPC_ERRORS: Record<string, string> = {
  unauthorized: "Vous n'êtes pas autorisé à effectuer cette action sur cette commande.",
  order_not_found_or_unauthorized: 'Commande introuvable ou non rattachée à votre boutique.',
  order_not_found: 'Commande introuvable ou non rattachée à votre boutique.',
  assignment_not_found: 'Aucune course rattachée à cette commande.',
  invalid_status: "Cette commande n'est plus dans un état permettant cette action.",
  already_picked_up: 'Le coursier a déjà récupéré le colis : annulation impossible.',
  locked: 'Trop de tentatives : la commande est passée en litige.',
  not_authenticated: 'Session expirée. Reconnectez-vous.',
  not_cod_delivery: 'Cette action ne concerne que les livraisons payées à la livraison.',
  otp_required: "Commande payée en ligne : saisissez le code communiqué par l'acheteur.",
  reason_required: 'Décrivez le problème pour ouvrir un litige.',
};

async function triggerPayoutProcessing(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    await fetch(`${ENV_CONFIG.PAYMENT_API_URL}/process-payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    // Le cron serveur prendra le relais si l'appel immédiat échoue.
  }
}

export const ordersService = {
  async createOrder(
    buyerId: string,
    payload: CheckoutPayload,
    roadKm?: number | null,
    quoteId?: string | null
  ): Promise<OrderWithDetails> {
    const { data: existingPending } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('listing_id', payload.listing_id)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPending?.id) {
      return this.getOrderById(existingPending.id);
    }

    const fullAddress = payload.delivery_district
      ? `${payload.delivery_address || ''} (${payload.delivery_district})`.trim()
      : payload.delivery_address || 'Daloa';

    let roadKmBySeller: Record<string, number> = {};
    if (roadKm != null && roadKm > 0) {
      const { data: owner } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', payload.listing_id)
        .maybeSingle();
      if (owner?.user_id) roadKmBySeller = { [owner.user_id]: roadKm };
    }

    const { data, error } = await supabase.rpc('create_cod_order', {
      p_items: [
        {
          listing_id: payload.listing_id,
          variant_id: payload.variant_id || null,
          variant_label: payload.variant_label || null,
          quantity: payload.quantity || 1,
        },
      ],
      p_delivery_mode: payload.delivery_mode,
      p_payment_method: payload.payment_method,
      p_delivery_address: fullAddress,
      p_delivery_lat: payload.delivery_lat ?? undefined,
      p_delivery_lng: payload.delivery_lng ?? undefined,
      p_delivery_district: payload.delivery_district || undefined,
      p_road_km: roadKmBySeller,
      ...(quoteId ? { p_quote_id: quoteId } : {}),
    } as any);

    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; first_order_id?: string } | null;
    if (!res?.success || !res.first_order_id) {
      throw codError(res?.reason);
    }

    return this.getOrderById(res.first_order_id);
  },

  async createCartOrders(
    _buyerId: string,
    items: Array<{ listing: any; variant?: any | null; quantity: number }>,
    opts: {
      deliveryMode: 'delivery' | 'pickup';
      paymentMethod: string;
      fullAddress: string;
      deliveryLat?: number | null;
      deliveryLng?: number | null;
      deliveryDistrict?: string | null;
      roadKmBySeller?: Record<string, number>;
      quoteId?: string | null;
    }
  ): Promise<string | null> {
    const { data, error } = await supabase.rpc('create_cod_order', {
      p_items: items.map((ci) => ({
        listing_id: ci.listing.id,
        variant_id: ci.variant?.id || null,
        variant_label: ci.variant?.label || null,
        quantity: ci.quantity,
      })),
      p_delivery_mode: opts.deliveryMode,
      p_payment_method: opts.paymentMethod,
      p_delivery_address: opts.fullAddress,
      p_delivery_lat: opts.deliveryLat ?? undefined,
      p_delivery_lng: opts.deliveryLng ?? undefined,
      p_delivery_district: opts.deliveryDistrict ?? undefined,
      p_road_km: opts.roadKmBySeller || {},
      ...(opts.quoteId ? { p_quote_id: opts.quoteId } : {}),
    } as any);

    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; first_order_id?: string } | null;
    if (!res?.success) {
      throw codError(res?.reason);
    }

    return res.first_order_id || null;
  },

  async getUserOrders(
    userId: string,
    role: 'buyer' | 'seller' = 'buyer',
    statusFilter?: string
  ): Promise<OrderWithDetails[]> {
    let query = supabase
      .from('orders')
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating), buyer:buyer_id(id, full_name, avatar_url), delivery_assignments(*)')
      .order('created_at', { ascending: false });

    query = role === 'buyer' ? query.eq('buyer_id', userId) : query.eq('seller_id', userId);
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    await attachContactPhones((data || []).flatMap((item: any) => [item.seller, item.buyer]));

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

  async countActiveOrders(userId: string): Promise<{ buying: number; selling: number; total: number }> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, payment_method, buyer_id, seller_id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .in('status', ['pending', 'paid', 'in_transit']);

    if (error) throw error;

    const isActive = (o: any) =>
      o.status === 'paid' || o.status === 'in_transit' || (o.status === 'pending' && o.payment_method === 'cod');

    const active = (data || []).filter(isActive);
    const buying = active.filter((o: any) => o.buyer_id === userId).length;
    const selling = active.filter((o: any) => o.seller_id === userId).length;

    return { buying, selling, total: buying + selling };
  },

  async getOrderById(orderId: string): Promise<OrderWithDetails> {
    let rawData: any = null;
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating, pro_until), buyer:buyer_id(id, full_name, avatar_url), delivery_assignments(*), order_items(*, listings:listing_id(id, title, photos, price))')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('orders')
        .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating, pro_until), buyer:buyer_id(id, full_name, avatar_url), delivery_assignments(*)')
        .eq('id', orderId)
        .single();

      if (fallbackErr || !fallbackData) throw fallbackErr || error || new Error('Commande introuvable');
      rawData = fallbackData;
    } else {
      rawData = data;
    }

    const orderItems = Array.isArray((rawData as any).order_items)
      ? (rawData as any).order_items.map((it: any) => ({ ...it, listing: it.listings || null }))
      : [];

    const assignment = Array.isArray(rawData.delivery_assignments)
      ? rawData.delivery_assignments[0]
      : rawData.delivery_assignments;

    let deliveryPerson = null;
    if (assignment?.delivery_person_id) {
      const { data: dp } = await supabase
        .from('delivery_persons')
        .select('id, name, phone, photo_url, vehicle_type, rating, total_reviews, is_verified, current_location')
        .eq('id', assignment.delivery_person_id)
        .maybeSingle();
      deliveryPerson = dp;
    }

    await attachContactPhones([rawData.seller, rawData.buyer]);

    return {
      ...rawData,
      listing: rawData.listings || null,
      seller: rawData.seller || null,
      buyer: rawData.buyer || null,
      delivery_assignment: assignment || null,
      delivery_person: deliveryPerson || null,
      order_items: orderItems,
    };
  },

  async cancelOrder(orderId: string, _reason?: string): Promise<void> {
    const { data, error } = await supabase.rpc('cancel_order_buyer', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; message?: string; is_online_paid?: boolean } | null;
    if (!res?.success) {
      const err: any = new Error(res?.message || 'Impossible d’annuler cette commande.');
      err.reason = res?.reason;
      throw err;
    }

    if (res.is_online_paid) {
      void triggerPayoutProcessing();
    }
  },

  async dispatchCodOrder(orderId: string): Promise<void> {
    const { data, error } = await supabase.rpc('dispatch_cod_order', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string } | null;
    if (!res?.success) {
      throw new Error(SELLER_RPC_ERRORS[res?.reason || ''] || res?.reason || 'Expédition impossible.');
    }
  },

  async cancelOrderUnavailable(orderId: string): Promise<void> {
    const { data, error } = await supabase.rpc('cancel_order_unavailable', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; refunded?: boolean } | null;
    if (res && res.success === false) {
      throw new Error(SELLER_RPC_ERRORS[res.reason || ''] || res.reason || 'Annulation impossible.');
    }

    if (res?.refunded) {
      void triggerPayoutProcessing();
    }
  },

  async reportDispute(orderId: string, reason: string): Promise<void> {
    const { data, error } = await supabase.rpc('report_order_dispute', {
      p_order_id: orderId,
      p_reason: reason,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string } | null;
    if (!res?.success) {
      throw new Error(SELLER_RPC_ERRORS[res?.reason || ''] || res?.reason || 'Signalement impossible.');
    }
  },

  async confirmSellerAvailability(orderId: string): Promise<void> {
    const { data, error } = await supabase.rpc('confirm_seller_availability', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string } | null;
    if (res && res.success === false) {
      throw new Error(SELLER_RPC_ERRORS[res.reason || ''] || res.reason || 'Confirmation impossible.');
    }
  },

  async completePickupOrder(orderId: string, enteredOtp?: string): Promise<void> {
    const { data, error } = await supabase.rpc('complete_pickup_order', {
      p_order_id: orderId,
      p_entered_otp: enteredOtp?.trim() || undefined,
    });
    if (error) throw error;

    const res = data as
      | { success?: boolean; reason?: string; attempts?: number; max_attempts?: number }
      | null;
    if (res && res.success === false) {
      if (res.reason === 'invalid_otp') {
        throw new Error(
          `Code incorrect (tentative ${res.attempts ?? '?'}/${res.max_attempts ?? 5}).`
        );
      }
      throw new Error(SELLER_RPC_ERRORS[res.reason || ''] || res.reason || 'Validation impossible.');
    }

    void triggerPayoutProcessing();
  },

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
