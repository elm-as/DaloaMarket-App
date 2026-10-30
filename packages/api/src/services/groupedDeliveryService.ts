import { supabase } from '../supabase';
import {
  GroupedPickupStop,
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
        .select('id, order_id, delivery_group_id, is_grouped, group_total_stops, group_completed_stops, grouped_stops, delivery_price, status')
        .eq('delivery_group_id', groupId)
        .order('delivery_price', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (ordersRes.error) {
      console.warn('Erreur chargement commandes groupées:', ordersRes.error);
      return null;
    }

    const orders = (ordersRes.data || []) as unknown as OrderWithDetails[];
    const assignment = assignmentRes.data as any;

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
   * Initialise de manière atomique une tournée groupée pour une liste de commandes multi-vendeurs
   * via la RPC SECURITY DEFINER `setup_grouped_delivery_run`.
   */
  async setupGroupedDeliveryRun(
    orderIds: string[],
    _buyerId: string,
    options: {
      fullAddress: string;
      district?: string;
      lat?: number;
      lng?: number;
    }
  ): Promise<string | null> {
    if (!orderIds || orderIds.length <= 1) return null;

    const { data, error } = await (supabase.rpc as any)('setup_grouped_delivery_run', {
      p_order_ids: orderIds,
      p_dropoff_address: options.fullAddress || 'Daloa',
      p_dropoff_district: options.district || null,
      p_dropoff_lat: options.lat ?? null,
      p_dropoff_lng: options.lng ?? null,
    });

    if (error) {
      console.warn('Erreur initialisation tournée groupée:', error.message);
      return null;
    }

    const payload = data as any;
    if (!payload?.success || !payload?.group_id) {
      return null;
    }

    return String(payload.group_id);
  },
};
