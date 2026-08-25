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
}

export interface ActiveDeliveryRunDetails extends AvailableDeliveryRun {
  status: DeliveryRunStatus;
  pickupOtp: string;
  deliveryOtp: string;
  pickupConfirmedBySeller: boolean;
  pickupConfirmedAt?: string | null;
  deliveredAt?: string | null;
  pickupPhotoUrl?: string | null;
  deliveryPhotoUrl?: string | null;
}

export interface DriverDailyStats {
  completedRunsToday: number;
  earningsToday: number;
  pendingEscrowAmount: number;
  totalAvailableBalance: number;
  rating: number;
  isOnline: boolean;
}
