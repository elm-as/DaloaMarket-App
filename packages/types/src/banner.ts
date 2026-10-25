export type PromoBannerLinkType =
  | 'listing'
  | 'seller'
  | 'express'
  | 'referral'
  | 'external'
  | 'none';

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  badge_text?: string | null;
  badge_color?: string | null;
  link_type: PromoBannerLinkType;
  link_target?: string | null;
  is_active: boolean;
  priority: number;
  seller_id?: string | null;
  sponsor_name?: string | null;
  price_paid?: number;
  views_count: number;
  clicks_count: number;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}
