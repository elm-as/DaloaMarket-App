const requirePublicUrl = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Configuration manquante: ${name}`);

  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Configuration invalide: ${name} doit être une URL HTTPS valide`);
  }
};

const requirePublicValue = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Configuration manquante: ${name}`);
  return value;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const paymentApiUrl = process.env.EXPO_PUBLIC_PAYMENT_API_URL;

export const ENV_CONFIG = {
  SUPABASE_URL: requirePublicUrl(supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requirePublicValue(supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  PAYMENT_API_URL: requirePublicUrl(paymentApiUrl, 'EXPO_PUBLIC_PAYMENT_API_URL'),
  MARKET_WEB_URL: 'https://daloamarket.com',
  DELIVERY_WEB_URL: 'https://delivery.daloamarket.com',
  SUPPORT_PHONE: '+2250788000831',
  SUPPORT_WHATSAPP: '2250788000831',
  SUPPORT_EMAIL: 'support@daloamarket.com',
};
