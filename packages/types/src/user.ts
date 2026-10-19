import { Database } from './database.types';

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface UserProfile extends UserRow {
  isPro?: boolean;
}

export type CodRefusalReason =
  | 'buyer_unreachable'
  | 'buyer_refused_no_money'
  | 'buyer_refused_changed_mind'
  | 'buyer_fake_location'
  | 'other';

export type BuyerReliabilityTier = 'verified' | 'new_client' | 'warning' | 'at_risk';

export interface BuyerReliabilityInfo {
  score: number;
  tier: BuyerReliabilityTier;
  deliveredCount: number;
  refusedCount: number;
  warningCount: number;
  isCodBlocked: boolean;
  blockedUntil?: string | null;
  label: string;
  badgeText: string;
  advice?: string | null;
}

// ── Parrainage Daloa Cash (F10) ──
export type DaloaCashReferralStatus = 'pending' | 'completed' | 'cancelled';

export interface DaloaCashReferral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: DaloaCashReferralStatus;
  referee_reward_amount: number;
  referrer_reward_amount: number;
  first_order_id?: string | null;
  rewarded_at?: string | null;
  created_at: string;
  referee?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type DaloaCashTransactionType =
  | 'referral_bonus_referee'
  | 'referral_bonus_referrer'
  | 'checkout_discount'
  | 'checkout_refund'
  | 'admin_adjustment';

export interface DaloaCashTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: DaloaCashTransactionType;
  order_id?: string | null;
  referral_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ReferralSummary {
  referralCode: string;
  balance: number;
  totalEarned: number;
  invitedCount: number;
  rewardedCount: number;
  pendingCount: number;
  referrals: DaloaCashReferral[];
  transactions: DaloaCashTransaction[];
}

export interface ApplyReferralResult {
  success: boolean;
  message: string;
  bonusAmount?: number;
  referrerName?: string;
  reason?: string;
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
