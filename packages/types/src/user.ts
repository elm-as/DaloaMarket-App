import { Database } from './database.types';

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface UserProfile extends UserRow {
  isPro?: boolean;
}

export interface ShopSettingsUpdate {
  shop_name: string;
  shop_description?: string;
  shop_slug?: string;
  district?: string;
  address?: string;
  shop_latitude?: number | null;
  shop_longitude?: number | null;
  cash_on_delivery_enabled?: boolean;
  shop_logo_url?: string | null;
  shop_banner_url?: string | null;
}

export interface SellerStats {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalViews: number;
}
