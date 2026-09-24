import { Database } from './database.types';

export type ListingRow = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];

/** Variantes stockées dans la colonne JSON `listings.variants` (il n'existe pas de table dédiée). */
export interface ListingVariant {
  id?: string;
  listing_id?: string;
  label: string;
  color?: string | null;
  color_code?: string | null;
  size?: string | null;
  price?: number | null;
  stock: number;
  active?: boolean;
}

export interface SellerInfo {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  shop_name: string | null;
  shop_description: string | null;
  shop_logo_url: string | null;
  shop_banner_url: string | null;
  shop_slug: string | null;
  district: string | null;
  rating: number | null;
  review_count: number;
  pro_until: string | null;
  cash_on_delivery_enabled: boolean;
  created_at: string;
}

export interface ListingFull extends Omit<ListingRow, 'variants'> {
  seller?: SellerInfo | null;
  variants?: ListingVariant[];
  is_favorite?: boolean;
  similarity_score?: number;
}

export interface ListingFilters {
  category?: string;
  district?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  acceptsDeliveryOnly?: boolean;
  sellerId?: string;
  boostedOnly?: boolean;
  status?: string;
  sortBy?: 'created_at_desc' | 'price_asc' | 'price_desc' | 'popularity';
}

export interface ListingCreateInput {
  title: string;
  description: string;
  price: number;
  original_price?: number | null;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'used';
  district: string;
  photos: string[];
  /** Ignoré s'il y a des variantes : le stock est alors la somme de leurs stocks. */
  stock: number;
  /** `id` conservé à l'édition : les commandes passées y font référence. */
  variants?: Array<Omit<ListingVariant, 'listing_id'>>;
}
