import { Database } from './database.types';
import { SellerInfo } from './listing';
import { DeliveryPersonSummary, DeliveryAssignmentRow } from './delivery';

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'awaiting_pickup'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'disputed'
  | 'cancelled'
  | 'refunded';

export interface OrderWithDetails extends OrderRow {
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
  } | null;
  delivery_assignment?: DeliveryAssignmentRow | null;
  delivery_person?: DeliveryPersonSummary | null;
}

export interface CheckoutPayload {
  listing_id: string;
  variant_id?: string | null;
  variant_label?: string | null;
  quantity: number;
  delivery_mode: 'delivery' | 'pickup';
  payment_method: 'wave' | 'orange' | 'mtn' | 'moov' | 'cash_on_delivery';
  delivery_address: string;
  delivery_district: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  buyer_notes?: string;
  buyer_phone: string;
}

export interface OrderFeeBreakdown {
  productPrice: number;
  quantity: number;
  productSubtotal: number;
  deliveryFee: number;
  buyerServiceFee: number;
  totalAmount: number;
  sellerCommission: number;
  sellerNetPayout: number;
  driverFee: number;
  driverNetPayout: number;
}
