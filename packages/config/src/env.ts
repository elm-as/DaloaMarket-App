import {
  DEFAULT_SUPPORT_WHATSAPP,
  DEFAULT_SUPPORT_EMAIL,
} from './constants';

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

const supportWhatsapp = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || DEFAULT_SUPPORT_WHATSAPP;
const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;

export const ENV_CONFIG = {
  SUPABASE_URL: requirePublicUrl(supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requirePublicValue(supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  PAYMENT_API_URL: requirePublicUrl(paymentApiUrl, 'EXPO_PUBLIC_PAYMENT_API_URL'),
  MARKET_WEB_URL: 'https://daloamarket.com',
  DELIVERY_WEB_URL: 'https://delivery.daloamarket.com',
  SUPPORT_WHATSAPP: supportWhatsapp,
  SUPPORT_EMAIL: supportEmail,
};

/**
 * Construit l'URL WhatsApp d'assistance officielle avec message d'accueil pré-rempli
 */
export function getSupportWhatsAppUrl(customMessage?: string): string {
  const cleanPhone = ENV_CONFIG.SUPPORT_WHATSAPP.replace(/\D/g, '');
  const base = `https://wa.me/${cleanPhone}`;
  if (!customMessage) return base;
  return `${base}?text=${encodeURIComponent(customMessage)}`;
}

/**
 * Le même numéro, mais lisible : « +225 01 73 80 15 59 ».
 *
 * Dérivé de SUPPORT_WHATSAPP plutôt qu'écrit à côté : un numéro affiché ne peut
 * donc jamais diverger de celui que le lien compose réellement.
 */
export function getSupportWhatsAppDisplay(): string {
  const digits = ENV_CONFIG.SUPPORT_WHATSAPP.replace(/\D/g, '');
  const local = digits.startsWith('225') ? digits.slice(3) : digits;
  const groups = local.match(/.{1,2}/g) ?? [local];
  return `+225 ${groups.join(' ')}`;
}


