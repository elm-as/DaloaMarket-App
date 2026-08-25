/**
 * Configuration des URLs et clés publiques pour les applications mobiles Daloa
 */
export const ENV_CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wjanjnoxzizxxhtbwyqd.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BLrm_nNwAjmvcwrjxL6BYA_VGdKOx2a',
  PAYMENT_API_URL: process.env.EXPO_PUBLIC_PAYMENT_API_URL || 'https://api.daloamarket.com',
  MARKET_WEB_URL: 'https://daloamarket.com',
  DELIVERY_WEB_URL: 'https://delivery.daloamarket.com',
  SUPPORT_PHONE: '+2250700000000',
  SUPPORT_WHATSAPP: '2250700000000',
};
