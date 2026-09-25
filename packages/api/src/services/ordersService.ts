import { supabase } from '../supabase';
import { attachContactPhones } from '../lib/contacts';
import { OrderWithDetails, CheckoutPayload, OrderStatus } from '@daloa/types';

/*
 * Plus aucun calcul de montant ici : distance, frais et commissions sont
 * décidés par la RPC `create_cod_order`. Les imports de tarification et de
 * géolocalisation ont été retirés pour que personne ne rebranche un second
 * calcul par mégarde — c'était la cause du prix affiché différent du prix payé.
 */

/** Traduction des `reason` renvoyés par `create_cod_order`. */
const COD_RPC_ERRORS: Record<string, string> = {
  unauthenticated: 'Session expirée. Reconnectez-vous pour commander.',
  empty_cart: 'Votre panier est vide.',
  unsupported_payment_method: 'Ce mode de paiement ne passe pas par ce chemin.',
  no_active_listing: "Ces articles ne sont plus disponibles à la vente.",
  cod_not_allowed: 'Le paiement à la livraison n’est pas disponible pour cet article. Choisissez le paiement en ligne.',
  pickup_not_allowed: 'Le retrait en boutique n’est pas disponible pour cet article. Choisissez la livraison.',
};

/** Traduction des `reason` renvoyés par les RPC vendeur. */
const SELLER_RPC_ERRORS: Record<string, string> = {
  unauthorized: "Vous n'êtes pas autorisé à effectuer cette action sur cette commande.",
  order_not_found_or_unauthorized: 'Commande introuvable ou non rattachée à votre boutique.',
  order_not_found: 'Commande introuvable ou non rattachée à votre boutique.',
  assignment_not_found: 'Aucune course rattachée à cette commande.',
  invalid_status: "Cette commande n'est plus dans un état permettant cette action.",
  locked: 'Trop de tentatives : la commande est passée en litige.',
  not_authenticated: 'Session expirée. Reconnectez-vous.',
  not_cod_delivery: 'Cette action ne concerne que les livraisons payées à la livraison.',
  otp_required: "Commande payée en ligne : saisissez le code communiqué par l'acheteur.",
  reason_required: 'Décrivez le problème pour ouvrir un litige.',
};

export const ordersService = {
  /**
   * Crée une commande en espèces (COD ou retrait boutique).
   *
   * Les montants ne sont plus composés ici : la RPC `create_cod_order` relit les
   * prix, résout les positions, calcule la distance et les frais, puis écrit la
   * commande, ses lignes et la course. Le client ne transmet que les articles,
   * la position et la distance routière qu'il a mesurée — distance que la base
   * ne retient que si elle est plausible (voir `fn_reconcile_road_km`).
   *
   * Ce chemin ne crée AUCUN séquestre : le séquestre n'existe que pour le
   * paiement en ligne, créé par l'API dans `/create-payment`.
   */
  async createOrder(
    buyerId: string,
    payload: CheckoutPayload,
    roadKm?: number | null
  ): Promise<OrderWithDetails> {
    // Anti-doublon : réutilise une commande 'pending' récente identique plutôt
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

    const fullAddress = payload.delivery_district
      ? `${payload.delivery_address || ''} (${payload.delivery_district})`.trim()
      : payload.delivery_address || 'Daloa';

    // La distance routière est transmise par vendeur : on a donc besoin de
    // l'identifiant du vendeur de cette annonce.
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
    });

    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; first_order_id?: string } | null;
    if (!res?.success || !res.first_order_id) {
      throw new Error(COD_RPC_ERRORS[res?.reason || ''] || res?.reason || 'Commande impossible.');
    }

    return this.getOrderById(res.first_order_id);
  },

  /**
   * Crée les commandes d'un panier en espèces : la RPC les regroupe PAR VENDEUR
   * (une commande + N lignes + une course par vendeur, transport 1×/vendeur).
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
      deliveryDistrict?: string | null;
      /** Distance routière mesurée, par identifiant de vendeur. */
      roadKmBySeller?: Record<string, number>;
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
    });

    if (error) throw error;

    const res = data as { success?: boolean; reason?: string; first_order_id?: string } | null;
    if (!res?.success) {
      throw new Error(COD_RPC_ERRORS[res?.reason || ''] || res?.reason || 'Commande impossible.');
    }

    return res.first_order_id || null;
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
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating), buyer:buyer_id(id, full_name, avatar_url), delivery_assignments(*)')
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
      .select('*, listings:listing_id(id, title, photos, price, district, category), seller:seller_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating, pro_until), buyer:buyer_id(id, full_name, avatar_url), delivery_assignments(*), order_items(*, listings:listing_id(id, title, photos, price))')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      // Repli sans jointure imbriquée order_items si un problème de relation survient
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

    // Téléphones de l'acheteur et du vendeur : visibles des parties de la commande.
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

  /**
   * Annuler une commande par l'acheteur.
   *
   * Passe uniquement par `cancel_order_buyer`, qui rembourse le séquestre et
   * applique la limite d'annulations. Le repli qui écrivait `orders.status`
   * directement a été retiré : `protect_orders_columns` l'annulait en silence,
   * et l'écran annonçait une annulation qui n'avait pas eu lieu.
   */
  async cancelOrder(orderId: string, _reason?: string): Promise<void> {
    const { data, error } = await supabase.rpc('cancel_order_buyer', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; message?: string } | null;
    if (!res?.success) {
      throw new Error(res?.message || 'Impossible d’annuler cette commande.');
    }
  },

  /**
   * Vendeur : marque un colis payé à la livraison comme expédié.
   *
   * Contrepartie mobile de `SellerSection.handleDispatchCodOrder` du web. En COD il
   * n'y a ni séquestre ni course coursier : le vendeur pilote lui-même le passage
   * en `in_transit`, puis valide l'encaissement via `complete_pickup_order`.
   */
  async dispatchCodOrder(orderId: string): Promise<void> {
    // Un UPDATE direct sur `orders.status` est annulé en silence par
    // `protect_orders_columns` : la transition passe par une RPC.
    const { data, error } = await supabase.rpc('dispatch_cod_order', {
      p_order_id: orderId,
    });
    if (error) throw error;

    const res = data as { success?: boolean; reason?: string } | null;
    if (!res?.success) {
      throw new Error(SELLER_RPC_ERRORS[res?.reason || ''] || res?.reason || 'Expédition impossible.');
    }
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
   * Déclarer un litige sur une commande, avec ou sans course.
   *
   * `report_order_dispute` couvre aussi les retraits en boutique (aucune course)
   * et inscrit le litige dans `order_disputes`, ce qui alerte l'administration.
   * L'ancien repli écrivait `orders.status` directement et restait sans effet.
   */
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
