import { supabase } from '../supabase';
import {
  GroupedPickupStop,
  DeliveryGroupRun,
  OrderWithDetails,
} from '@daloa/types';
import {
  calculateGroupedDeliveryQuote,
  GroupedDeliveryBreakdown,
} from '@daloa/config';

export interface ConfirmStopResult {
  success: boolean;
  stopIndex: number;
  completedStops: number;
  totalStops: number;
  allCompleted: boolean;
  newStatus: string;
}

export interface GroupedDeliveryRunDetails {
  groupId: string;
  isGrouped: boolean;
  totalStops: number;
  completedStops: number;
  stops: GroupedPickupStop[];
  orders: OrderWithDetails[];
  allCompleted: boolean;
  dropoffAddress: string;
  dropoffDistrict?: string;
}

export const groupedDeliveryService = {
  /**
   * Calcule le devis de livraison groupée pour plusieurs vendeurs
   */
  calculateQuote(sellerDeliveryFees: number[]): GroupedDeliveryBreakdown {
    return calculateGroupedDeliveryQuote(sellerDeliveryFees);
  },

  /**
   * Récupère les détails d'une tournée groupée avec toutes ses commandes et stops
   */
  async getGroupedRunDetails(groupId: string): Promise<GroupedDeliveryRunDetails | null> {
    if (!groupId) return null;

    const [ordersRes, assignmentRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, listing:listing_id(id, title, photos, price, district), seller:seller_id(id, full_name, shop_name, phone, district, shop_latitude, shop_longitude)')
        .eq('delivery_group_id', groupId)
        .order('grouped_stop_index', { ascending: true }),
      supabase
        .from('delivery_assignments')
        .select('*')
        .eq('delivery_group_id', groupId)
        .maybeSingle(),
    ]);

    if (ordersRes.error) {
      console.warn('Erreur chargement commandes groupées:', ordersRes.error);
      return null;
    }

    const orders = (ordersRes.data || []) as unknown as OrderWithDetails[];
    const assignment = assignmentRes.data;

    let stops: GroupedPickupStop[] = [];

    if (assignment?.grouped_stops && Array.isArray(assignment.grouped_stops)) {
      stops = assignment.grouped_stops.map((s: any) => ({
        stopIndex: Number(s.stop_index) || 1,
        sellerId: s.seller_id,
        shopName: s.shop_name || 'Boutique',
        address: s.address,
        district: s.district,
        latitude: s.latitude ? Number(s.latitude) : null,
        longitude: s.longitude ? Number(s.longitude) : null,
        phone: s.phone,
        status: s.status === 'picked_up' ? 'picked_up' : 'pending',
        pickedUpAt: s.picked_up_at,
        notes: s.notes,
      }));
    } else {
      // Reconstitution à partir des commandes si l'assignation n'a pas encore le jsonb
      stops = orders.map((o, idx) => ({
        stopIndex: o.grouped_stop_index || idx + 1,
        sellerId: o.seller_id,
        shopName: o.seller?.shop_name || o.seller?.full_name || 'Vendeur',
        address: o.seller?.district || 'Daloa',
        district: o.seller?.district,
        latitude: (o.seller as any)?.shop_latitude ?? null,
        longitude: (o.seller as any)?.shop_longitude ?? null,
        phone: o.seller?.phone,
        status: o.status === 'shipped' || o.status === 'delivered' ? 'picked_up' : 'pending',
        pickedUpAt: null,
      }));
    }

    const totalStops = assignment?.group_total_stops || stops.length;
    const completedStops = assignment?.group_completed_stops || stops.filter((s) => s.status === 'picked_up').length;
    const firstOrder = orders[0];

    return {
      groupId,
      isGrouped: true,
      totalStops,
      completedStops,
      stops,
      orders,
      allCompleted: completedStops >= totalStops,
      dropoffAddress: firstOrder?.delivery_address || 'Adresse de livraison',
      dropoffDistrict: (firstOrder as any)?.delivery_district,
    };
  },

  /**
   * Confirme la collecte d'un stop spécifique lors d'une tournée groupée
   */
  async confirmPickupStop(
    assignmentId: string,
    stopIndex: number,
    sellerId: string,
    notes?: string
  ): Promise<ConfirmStopResult> {
    const { data, error } = await supabase.rpc('confirm_grouped_pickup_stop' as any, {
      p_assignment_id: assignmentId,
      p_stop_index: stopIndex,
      p_seller_id: sellerId,
      p_notes: notes || null,
    } as any);

    if (error) {
      throw new Error(error.message || 'Impossible de valider ce stop');
    }

    const payload = data as any;
    return {
      success: Boolean(payload?.success),
      stopIndex: Number(payload?.stop_index) || stopIndex,
      completedStops: Number(payload?.completed_stops) || 0,
      totalStops: Number(payload?.total_stops) || 1,
      allCompleted: Boolean(payload?.all_completed),
      newStatus: payload?.new_status || 'picked_up',
    };
  },

  /**
   * Initialise une tournée groupée pour une liste de commandes multi-vendeurs
   */
  async setupGroupedDeliveryRun(
    orderIds: string[],
    buyerId: string,
    options: {
      fullAddress: string;
      district?: string;
      lat?: number;
      lng?: number;
    }
  ): Promise<string | null> {
    if (!orderIds || orderIds.length <= 1) return null;

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, seller_id, delivery_fee, seller:seller_id(id, shop_name, full_name, district, shop_latitude, shop_longitude, phone)')
      .in('id', orderIds);

    if (ordersErr || !orders || orders.length <= 1) return null;

    const fees = orders.map((o: any) => Number(o.delivery_fee) || 500);
    const quote = calculateGroupedDeliveryQuote(fees);
    const groupId = (crypto as any)?.randomUUID?.() || `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const groupedStops: GroupedPickupStop[] = orders.map((o: any, idx: number) => ({
      stopIndex: idx + 1,
      sellerId: o.seller_id,
      shopName: o.seller?.shop_name || o.seller?.full_name || 'Boutique',
      address: o.seller?.district || 'Daloa',
      district: o.seller?.district || null,
      latitude: o.seller?.shop_latitude ? Number(o.seller.shop_latitude) : null,
      longitude: o.seller?.shop_longitude ? Number(o.seller.shop_longitude) : null,
      phone: o.seller?.phone || null,
      status: 'pending',
    }));

    const discountPerOrder = Math.round(quote.savings / orders.length);

    await Promise.all([
      ...orders.map((o: any, idx: number) =>
        supabase
          .from('orders')
          .update({
            delivery_group_id: groupId,
            is_grouped: true,
            grouped_stop_index: idx + 1,
            grouped_delivery_discount: discountPerOrder,
          } as any)
          .eq('id', o.id)
      ),
      ...orders.map((o: any) =>
        supabase
          .from('delivery_assignments')
          .update({
            delivery_group_id: groupId,
            is_grouped: true,
            group_total_stops: orders.length,
            group_completed_stops: 0,
            grouped_stops: groupedStops as any,
          } as any)
          .eq('order_id', o.id)
      ),
      (supabase.from('delivery_group_runs' as any) as any).insert({
        id: groupId,
        buyer_id: buyerId,
        total_sellers: orders.length,
        status: 'awaiting_pickup',
        total_delivery_price: quote.totalGroupedFee,
        driver_earning: quote.driverTotalGain,
        platform_fee: Math.round(quote.totalGroupedFee * 0.1),
        buyer_discount: quote.savings,
        dropoff_address: options.fullAddress,
        dropoff_district: options.district || null,
        dropoff_lat: options.lat || null,
        dropoff_lng: options.lng || null,
      }),
    ]);

    return groupId;
  },
};
