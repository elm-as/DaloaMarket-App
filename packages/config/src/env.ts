import {
  DEFAULT_SUPPORT_PHONE,
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

const supportPhone = process.env.EXPO_PUBLIC_SUPPORT_PHONE || DEFAULT_SUPPORT_PHONE;
const supportWhatsapp = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || DEFAULT_SUPPORT_WHATSAPP;
const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;

export const ENV_CONFIG = {
  SUPABASE_URL: requirePublicUrl(supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requirePublicValue(supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  PAYMENT_API_URL: requirePublicUrl(paymentApiUrl, 'EXPO_PUBLIC_PAYMENT_API_URL'),
  MARKET_WEB_URL: 'https://daloamarket.com',
  DELIVERY_WEB_URL: 'https://delivery.daloamarket.com',
  SUPPORT_PHONE: supportPhone,
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
 * Construit l'URL d'appel téléphonique direct d'assistance officielle
 */
export function getSupportCallUrl(): string {
  return `tel:${ENV_CONFIG.SUPPORT_PHONE}`;
}

