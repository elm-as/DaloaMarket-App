import { supabase } from '../supabase';
import { OrderWithDetails, CheckoutPayload, OrderStatus } from '@daloa/types';
import { calculateOrderBreakdown, DALOA_CENTER, DALOA_DISTRICT_COORDINATES } from '@daloa/config';
import { haversineDistance, generateSecureOtp, isLocationInDaloa } from '@daloa/utils';
import { systemSettingsService } from './systemSettingsService';

/** Traduction des `reason` renvoyés par les RPC vendeur. */
const SELLER_RPC_ERRORS: Record<string, string> = {
  unauthorized: "Vous n'êtes pas autorisé à effectuer cette action sur cette commande.",
  order_not_found_or_unauthorized: 'Commande introuvable ou non rattachée à votre boutique.',
  order_not_found: 'Commande introuvable ou non rattachée à votre boutique.',
  assignment_not_found: 'Aucune course rattachée à cette commande.',
  invalid_status: "Cette commande n'est plus dans un état permettant cette action.",
  locked: 'Trop de tentatives : la commande est passée en litige.',
};

export const ordersService = {
  /**
   * Crée la commande côté client (paiement à la livraison).
   *
   * Note : contrairement à ce que laissait entendre l'ancien commentaire, ce
   * chemin ne crée AUCUN séquestre — le séquestre n'existe que pour le paiement
   * en ligne, créé par l'API dans `/create-payment`.
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
    const rawSellerLat = seller?.shop_latitude ?? seller?.latitude;
    const rawSellerLng = seller?.shop_longitude ?? seller?.longitude;
    let sellerCoords = { lat: DALOA_CENTER.lat, lng: DALOA_CENTER.lng };
    if (rawSellerLat != null && rawSellerLng != null && isLocationInDaloa(Number(rawSellerLat), Number(rawSellerLng))) {
      sellerCoords = { lat: Number(rawSellerLat), lng: Number(rawSellerLng) };
    } else {
      const sellerDistrict = seller?.district || listing.district;
      const districtPoint = sellerDistrict ? (DALOA_DISTRICT_COORDINATES as any)[sellerDistrict] : null;
      if (districtPoint) {
        sellerCoords = { lat: districtPoint.latitude, lng: districtPoint.longitude };
      }
    }

    const rawBuyerLat = payload.delivery_lat;
    const rawBuyerLng = payload.delivery_lng;
    let buyerCoords = { lat: DALOA_CENTER.lat, lng: DALOA_CENTER.lng };
    if (rawBuyerLat != null && rawBuyerLng != null && isLocationInDaloa(Number(rawBuyerLat), Number(rawBuyerLng))) {
      buyerCoords = { lat: Number(rawBuyerLat), lng: Number(rawBuyerLng) };
    } else {
      const buyerDistrict = payload.delivery_district;
      const districtPoint = buyerDistrict ? (DALOA_DISTRICT_COORDINATES as any)[buyerDistrict] : null;
      if (districtPoint) {
        buyerCoords = { lat: districtPoint.latitude, lng: districtPoint.longitude };
      }
    }
    const distanceKm = Math.min(15.0, Math.max(0.5, Number(haversineDistance(sellerCoords, buyerCoords).toFixed(1))));

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

    // 3b. Anti-doublon : réutilise une commande 'pending' récente identique plutôt
    // que d'en créer une nouvelle à chaque tentative (évite les orphelins créés
    // quand le paiement échoue ou que l'utilisateur réessaie).
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
      // `pickup_point` est la valeur canonique, celle qu'ecrit le web. En ecrivant
      // `pickup`, les commandes retrait creees sur mobile n'etaient reconnues que
      // par le mobile. Les deux valeurs restent acceptees en lecture.
      delivery_mode: payload.delivery_mode === 'pickup' ? 'pickup_point' : 'delivery',
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

    // 4b. Décrémenter le stock et marquer comme vendu si stock = 0
    try {
      const prevStock = Number(listing.stock) || 1;
      const orderQty = payload.quantity || 1;
      const newStock = Math.max(0, prevStock - orderQty);
      const updateData: any = {
        stock: newStock,
        status: newStock === 0 ? 'sold' : listing.status,
      };
      if (Array.isArray(listing.variants) && payload.variant_id) {
        updateData.variants = listing.variants.map((v: any) => {
          if (v.id === payload.variant_id) {
            const vStock = Math.max(0, (Number(v.stock) || 0) - orderQty);
            return { ...v, stock: vStock, active: vStock > 0 };
          }
          return v;
        });
      }
      await supabase.from('listings').update(updateData).eq('id', payload.listing_id);
    } catch (stockErr) {
      console.warn('[ordersService] Erreur mise à jour stock:', stockErr);
    }

    // 5. Si livraison demandée, créer le delivery_assignment avec ses deux codes.
    //    OTP sur 6 chiffres pour s'aligner sur le serveur (createOrderFromEscrow) :
    //    4 chiffres ne font que 10 000 combinaisons pour un code qui déclenche un
    //    virement. Le scanner QR accepte déjà \d{4,6}.
    if (payload.delivery_mode === 'delivery') {
      const pickupOtp = generateSecureOtp(6);
      const deliveryOtp = generateSecureOtp(6);

      const { error: assignErr } = await supabase.from('delivery_assignments').insert({
        order_id: order.id,
        seller_id: listing.user_id,
        // Aligné sur le chemin de paiement en ligne : le vendeur doit confirmer
        // qu'il a l'article (confirm_seller_availability) avant qu'un livreur
        // puisse prendre la course. Sinon un livreur se déplace pour rien.
        status: 'pending_seller_confirmation',
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
   * Crée les commandes d'un panier COD/espèces : regroupées PAR VENDEUR
   * (une commande + N order_items + une livraison par vendeur, transport 1×/vendeur).
   * Retourne l'id de la première commande créée.
   */
  async createCartOrders(
    buyerId: string,
    items: Array<{ listing: any; variant?: any | null; quantity: number }>,
    opts: {
      deliveryMode: 'delivery' | 'pickup';
      paymentMethod: string;
      fullAddress: string;
      deliveryLat?: number | null;
      deliveryLng?: number | null;
    }
  ): Promise<string | null> {
    // Regrouper par vendeur
    const groups = new Map<string, { seller: any; items: typeof items }>();
    for (const ci of items) {
      const sellerId = ci.listing.user_id || ci.listing.seller?.id;
      if (!sellerId) continue;
      if (!groups.has(sellerId)) groups.set(sellerId, { seller: ci.listing.seller || ci.listing.users || {}, items: [] });
      groups.get(sellerId)!.items.push(ci);
    }

    // Override commission de phase (0 en Phase 0)
    let sellerFeeOverride: number | null = null;
    try {
      const { phaseConfig } = await systemSettingsService.getSettings();
      sellerFeeOverride = phaseConfig.seller_fee_override;
    } catch {
      /* fail-safe */
    }

    const rawBuyerLat = opts.deliveryLat;
    const rawBuyerLng = opts.deliveryLng;
    let buyerCoords = { lat: DALOA_CENTER.lat, lng: DALOA_CENTER.lng };
    if (rawBuyerLat != null && rawBuyerLng != null && isLocationInDaloa(Number(rawBuyerLat), Number(rawBuyerLng))) {
      buyerCoords = { lat: Number(rawBuyerLat), lng: Number(rawBuyerLng) };
    }
    let firstOrderId: string | null = null;

    for (const [sellerId, group] of groups.entries()) {
      const seller = group.seller || {};
      const rawSellerLat = seller.shop_latitude ?? seller.latitude;
      const rawSellerLng = seller.shop_longitude ?? seller.longitude;
      let sellerCoords = { lat: DALOA_CENTER.lat, lng: DALOA_CENTER.lng };
      if (rawSellerLat != null && rawSellerLng != null && isLocationInDaloa(Number(rawSellerLat), Number(rawSellerLng))) {
        sellerCoords = { lat: Number(rawSellerLat), lng: Number(rawSellerLng) };
      } else {
        const sellerDistrict = seller.district || group.items[0]?.listing?.district;
        const districtPoint = sellerDistrict ? (DALOA_DISTRICT_COORDINATES as any)[sellerDistrict] : null;
        if (districtPoint) {
          sellerCoords = { lat: districtPoint.latitude, lng: districtPoint.longitude };
        }
      }
      const distanceKm = Math.min(15.0, Math.max(0.5, Number(haversineDistance(sellerCoords, buyerCoords).toFixed(1))));
      const productAmount = group.items.reduce(
        (s, ci) => s + (ci.variant?.price ?? ci.listing.price) * ci.quantity,
        0
      );
      const totalQty = group.items.reduce((s, ci) => s + ci.quantity, 0);
      const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());

      const breakdown = calculateOrderBreakdown({
        productPrice: productAmount,
        quantity: 1,
        distanceKm,
        isProSeller: isPro,
        deliveryMode: opts.deliveryMode,
        sellerFeeOverride,
      });

      const first = group.items[0];
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          listing_id: first.listing.id,
          variant_id: first.variant?.id || null,
          variant_label: first.variant?.label || null,
          unit_price: first.variant?.price ?? first.listing.price,
          quantity: totalQty,
          product_amount: Math.round(breakdown.productSubtotal),
          delivery_fee: Math.round(breakdown.deliveryFee),
          // Doit porter la commission VENDEUR, comme createOrder ci-dessus.
          // Stockait buyerServiceFee (0 %), donc la commission d'une commande
          // panier était enregistrée à 0 quelle que soit la phase.
          platform_commission: Math.round(breakdown.sellerCommission),
          reserve_fee: Math.round(breakdown.buyerServiceFee),
          total_amount: Math.round(breakdown.totalAmount),
          status: 'pending',
          delivery_mode: opts.deliveryMode === 'pickup' ? 'pickup_point' : 'delivery',
          payment_method: opts.paymentMethod,
          delivery_address: opts.fullAddress,
          delivery_lat: opts.deliveryLat || null,
          delivery_lng: opts.deliveryLng || null,
        })
        .select('id')
        .single();

      if (orderErr || !order) throw orderErr || new Error('Erreur création commande');
      if (!firstOrderId) firstOrderId = order.id;

      // Lignes d'articles
      await supabase.from('order_items').insert(
        group.items.map((ci) => ({
          order_id: order.id,
          listing_id: ci.listing.id,
          variant_id: ci.variant?.id || null,
          variant_label: ci.variant?.label || null,
          unit_price: ci.variant?.price ?? ci.listing.price,
          quantity: ci.quantity,
          product_amount: (ci.variant?.price ?? ci.listing.price) * ci.quantity,
        }))
      );

      // Décrémenter le stock pour chaque article du panier
      for (const ci of group.items) {
        try {
          const prevStock = Number(ci.listing.stock) || 1;
          const newStock = Math.max(0, prevStock - ci.quantity);
          const updateData: any = {
            stock: newStock,
            status: newStock === 0 ? 'sold' : ci.listing.status,
          };
          if (Array.isArray(ci.listing.variants) && ci.variant?.id) {
            updateData.variants = ci.listing.variants.map((v: any) => {
              if (v.id === ci.variant.id) {
                const vStock = Math.max(0, (Number(v.stock) || 0) - ci.quantity);
                return { ...v, stock: vStock, active: vStock > 0 };
              }
              return v;
            });
          }
          await supabase.from('listings').update(updateData).eq('id', ci.listing.id);
        } catch (stockErr) {
          console.warn('[ordersService] Erreur mise à jour stock panier:', stockErr);
        }
      }

      // Une livraison par vendeur
      if (opts.deliveryMode === 'delivery') {
        await supabase.from('delivery_assignments').insert({
          order_id: order.id,
          seller_id: sellerId,
          status: 'pending_seller_confirmation',
          pickup_location: `${seller?.shop_name || 'Boutique'} (${seller?.district || ''})`.trim(),
          dropoff_location: opts.fullAddress,
          delivery_price: Math.round(breakdown.deliveryFee),
          pickup_otp: generateSecureOtp(6),
          delivery_otp: generateSecureOtp(6),
          pickup_confirmed_by_seller: false,
        });
      }
    }

    return firstOrderId;
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
   * Décompte des commandes « en cours » d'un utilisateur, pour les pastilles.
   *
   * Est active : une commande payée ou en transit, ainsi qu'une commande
   * espèces (COD) encore `pending` — elle attend une action du vendeur. Une
   * commande `pending` payée en ligne est un panier abandonné au paiement :
   * elle resterait affichée indéfiniment, donc elle est exclue.
   *
   * Une seule requête sert les deux rôles : les volumes par utilisateur sont
   * faibles et le filtrage se fait en mémoire, ce qui évite un `or()` imbriqué
   * côté PostgREST.
   */
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

  /**
   * Récupère le détail complet d'une commande
   */
  async getOrderById(orderId: string): Promise<OrderWithDetails> {
    let rawData: any = null;
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, pro_until), buyer:buyer_id(id, full_name, phone, avatar_url), delivery_assignments(*), order_items(*, listings:listing_id(id, title, photos, price))')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      // Repli sans jointure imbriquée order_items si un problème de relation survient
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('orders')
        .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, pro_until), buyer:buyer_id(id, full_name, phone, avatar_url), delivery_assignments(*)')
        .eq('id', orderId)
        .single();

      if (fallbackErr || !fallbackData) throw fallbackErr || error || new Error('Commande introuvable');
      rawData = fallbackData;
    } else {
      rawData = data;
    }

    // Normalise les lignes d'articles (multi-articles par vendeur).
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
   * Vendeur : marque un colis payé à la livraison comme expédié.
   *
   * Contrepartie mobile de `SellerSection.handleDispatchCodOrder` du web. En COD il
   * n'y a ni séquestre ni course coursier : le vendeur pilote lui-même le passage
   * en `in_transit`, puis valide l'encaissement via `complete_pickup_order`.
   */
  async dispatchCodOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'in_transit' })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Vendeur : annule une commande faute de stock (« je n'ai plus le produit »).
   *
   * Contrepartie mobile de `SellerSection.handleCancelUnavailable` côté web.
   * Elle manquait entièrement à l'app : un vendeur mobile n'avait aucun moyen de
   * libérer une commande qu'il ne pouvait pas honorer. La RPC annule aussi la
   * course rattachée, ce qu'un simple UPDATE sur `orders` ne fait pas.
   */
  async cancelOrderUnavailable(orderId: string): Promise<void> {
    const { data, error } = await supabase.rpc('cancel_order_unavailable', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; current_status?: string } | null;
    if (res && res.success === false) {
      throw new Error(SELLER_RPC_ERRORS[res.reason || ''] || res.reason || 'Annulation impossible.');
    }
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
   * Vendeur : confirme qu'il a bien l'article, ce qui rend la course visible
   * aux livreurs (`pending_seller_confirmation` → `awaiting_pickup`).
   *
   * Ces RPC renvoient `{ success: false, reason }` dans le corps de la réponse
   * plutôt qu'une erreur Postgres : il faut lire `data.success`, sinon un refus
   * d'autorisation passe pour un succès.
   */
  async confirmSellerAvailability(orderId: string): Promise<void> {
    const { data, error } = await supabase.rpc('confirm_seller_availability', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; current_status?: string } | null;
    if (res && res.success === false) {
      throw new Error(SELLER_RPC_ERRORS[res.reason || ''] || res.reason || 'Confirmation impossible.');
    }
  },

  /**
   * Vendeur : valide la remise en boutique. Libère le séquestre et programme le
   * virement vendeur. `enteredOtp` est optionnel — s'il est fourni, le serveur
   * le vérifie réellement (5 tentatives puis litige).
   */
  async completePickupOrder(orderId: string, enteredOtp?: string): Promise<void> {
    const { data, error } = await supabase.rpc('complete_pickup_order', {
      p_order_id: orderId,
      p_entered_otp: enteredOtp?.trim() || null,
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
