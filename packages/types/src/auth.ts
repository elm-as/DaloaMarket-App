import { UserProfile } from './user';
import { DeliveryPersonRow } from './delivery';

export interface AuthSession {
  user: {
    id: string;
    email?: string;
    phone?: string;
  } | null;
  profile: UserProfile | null;
  deliveryProfile?: DeliveryPersonRow | null;
  token?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  phone: string;
  fullName: string;
  district?: string;
  role?: 'buyer' | 'seller' | 'delivery';
  shopName?: string;
  // Specific to driver registration
  vehicleType?: 'moto' | 'velo' | 'voiture' | 'triporteur';
  vehicleDetails?: string;
  coverageZones?: string[];
}

export interface LoginInput {
  emailOrPhone: string;
  password: string;
  otpCode?: string;
}
