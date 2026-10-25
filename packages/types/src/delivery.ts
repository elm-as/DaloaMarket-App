import { Database } from './database.types';

export type DeliveryPersonRow = Database['public']['Tables']['delivery_persons']['Row'];
export type DeliveryAssignmentRow = Database['public']['Tables']['delivery_assignments']['Row'];

export interface Coordinates {
  lat: number;
  lng: number;
}

export type VehicleType = 'moto' | 'velo' | 'voiture' | 'triporteur';

export type DeliveryRunStatus =
  | 'pending_seller_confirmation'
  | 'awaiting_pickup'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'auto_released'
  | 'disputed'
  | 'cancelled';

export interface DeliveryPersonSummary {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  vehicle_type: VehicleType | string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  current_location?: Coordinates | null;
}

export type ExpressPackageType = 'parcel' | 'envelope' | 'food' | 'merchandise' | 'other';

export type ExpressPayerRole = 'sender' | 'recipient';

export interface ExpressDeliveryInput {
  pickupDistrict: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffDistrict: string;
  dropoffAddress: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  packageType: ExpressPackageType | string;
  packageDescription: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  payerRole?: ExpressPayerRole;
  paymentMethod?: string;
  roadKm?: number | null;
}

export interface ExpressDeliveryResult {
  success: boolean;
  orderId?: string;
  assignmentId?: string;
  deliveryFee?: number;
  distanceKm?: number;
  driverNetGain?: number;
  pickupOtp?: string;
  deliveryOtp?: string;
  error?: string;
  reason?: string;
}

export interface AvailableDeliveryRun {
  assignmentId: string;
  orderId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDistrict: string;
  dropoffDistrict: string;
  pickupCoordinates?: Coordinates | null;
  dropoffCoordinates?: Coordinates | null;
  distanceKm: number;
  deliveryPrice: number;
  driverFee: number;
  driverNetGain: number;
  isPrivate: boolean;
  sellerName: string;
  sellerPhone?: string | null;
  buyerName: string;
  buyerPhone?: string | null;
  productTitle?: string;
  productPhoto?: string | null;
  createdAt: string;
  isExpress?: boolean;
  packageDescription?: string | null;
  packageType?: string | null;
  senderName?: string;
  senderPhone?: string | null;
  recipientName?: string;
  recipientPhone?: string | null;
  payerRole?: ExpressPayerRole;
  isCod?: boolean;
  buyerCodReliabilityScore?: number | null;
  buyerCodDeliveredCount?: number | null;
  buyerCodRefusedCount?: number | null;
  isGrouped?: boolean;
  deliveryGroupId?: string | null;
  groupTotalStops?: number;
  groupCompletedStops?: number;
  groupedStops?: GroupedPickupStop[];
}

export interface GroupedPickupStop {
  stopIndex: number;
  sellerId: string;
  shopName: string;
  address?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  status: 'pending' | 'picked_up';
  pickedUpAt?: string | null;
  notes?: string | null;
}

export interface DeliveryGroupRun {
  id: string;
  buyerId: string;
  totalSellers: number;
  status: 'awaiting_pickup' | 'accepted' | 'in_pickup' | 'in_transit' | 'delivered' | 'cancelled';
  deliveryPersonId?: string | null;
  totalDeliveryPrice: number;
  driverEarning: number;
  platformFee: number;
  buyerDiscount: number;
  dropoffAddress: string;
  dropoffDistrict?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  stops?: GroupedPickupStop[];
  createdAt: string;
}

export interface ActiveDeliveryRunDetails extends AvailableDeliveryRun {
  status: DeliveryRunStatus;
  pickupConfirmedBySeller: boolean;
  pickupConfirmedAt?: string | null;
  deliveredAt?: string | null;
  pickupPhotoUrl?: string | null;
  deliveryPhotoUrl?: string | null;
  currentDriverLat?: number | null;
  currentDriverLng?: number | null;
  driverLocationUpdatedAt?: string | null;
}

/**
 * Fraîcheur du signal GPS en temps réel :
 * - live : < 20 secondes (signal actif, livreur en déplacement)
 * - stale : 20 à 60 secondes (signal intermittent / réseau ralenti)
 * - disconnected : > 60 secondes (perte de signal GPS / hors ligne)
 */
export type RunTrackingFreshness = 'live' | 'stale' | 'disconnected';

/**
 * Payload éphémère transmis via Supabase Realtime Broadcast
 * sur le canal dédié `run_tracking:{assignmentId}`
 */
export interface DeliveryLiveLocationEvent {
  assignmentId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface DriverDailyStats {
  completedRunsToday: number;
  earningsToday: number;
  pendingEscrowAmount: number;
  totalAvailableBalance: number;
  rating: number | null;
  isOnline: boolean;
  totalLifetimeEarnings?: number;
  totalCompletedRuns?: number;
  pendingPayoutAmount?: number;
  paidOutAmount?: number;
}
