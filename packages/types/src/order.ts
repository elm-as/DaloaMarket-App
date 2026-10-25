import { Database } from './database.types';
import { SellerInfo } from './listing';
import { DeliveryPersonSummary, DeliveryAssignmentRow } from './delivery';

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

/**
 * Domaine réel de `orders.status`, aligné sur la contrainte CHECK en base.
 *
 * Ce type listait auparavant `pending_payment`, `preparing`, `awaiting_pickup`,
 * `accepted`, `picked_up`, `refunded` — des valeurs qu'aucun chemin d'écriture ne
 * produit (les quatre du milieu appartiennent à `delivery_assignments.status`).
 * Les écrans mobiles s'étaient calés dessus et n'affichaient donc jamais le bon
 * libellé pour `pending` et `paid`, les deux statuts les plus courants.
 */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

/** Domaine de `delivery_assignments.status` — à ne pas confondre avec le précédent. */
export type DeliveryAssignmentStatus =
  | 'pending_seller_confirmation'
  | 'awaiting_pickup'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'auto_released'
  | 'disputed'
  | 'cancelled';

export interface OrderWithDetails extends Omit<OrderRow, 'listing_id'> {
  listing_id?: string | null;
  order_type?: 'marketplace' | 'express' | string;
  package_description?: string | null;
  package_type?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  payer_role?: 'sender' | 'recipient' | string | null;
  listing?: {
    id: string;
    title: string;
    photos: string[];
    price: number;
    district: string;
    category: string;
  } | null;
  seller?: SellerInfo | null;
  buyer?: {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    cod_orders_count?: number | null;
    cod_delivered_count?: number | null;
    cod_refused_count?: number | null;
    cod_reliability_score?: number | null;
    cod_warning_count?: number | null;
    cod_blocked_until?: string | null;
  } | null;
  delivery_assignment?: DeliveryAssignmentRow | null;
  delivery_person?: DeliveryPersonSummary | null;
  delivery_group_id?: string | null;
  is_grouped?: boolean;
  grouped_stop_index?: number | null;
  grouped_delivery_discount?: number | null;
}

export interface CheckoutPayload {
  listing_id: string;
  variant_id?: string | null;
  variant_label?: string | null;
  quantity: number;
  delivery_mode: 'delivery' | 'pickup';
  payment_method:
    | 'wave'
    | 'orange'
    | 'mtn'
    | 'moov'
    | 'cash_on_delivery'
    | 'cod'
    | 'cash_at_shop'
    | 'cash';
  delivery_address: string;
  delivery_district: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  buyer_notes?: string;
  buyer_phone: string;
  daloa_cash_discount?: number;
  use_daloa_cash?: boolean;
  delivery_group_id?: string;
  is_grouped?: boolean;
  grouped_delivery_discount?: number;
}

export interface OrderFeeBreakdown {
  productPrice: number;
  quantity: number;
  productSubtotal: number;
  deliveryFee: number;
  buyerServiceFee: number;
  daloaCashDiscount?: number;
  groupedDeliveryDiscount?: number;
  totalAmount: number;
  sellerCommission: number;
  sellerNetPayout: number;
  driverFee: number;
  driverNetPayout: number;
}
