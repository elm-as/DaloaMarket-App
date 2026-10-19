import { formatFCFA, formatWhatsAppPhone } from '../formatters';

export interface ShopShareParams {
  shopName: string;
  shopSlug: string;
  district?: string | null;
  rating?: number | null;
  listingCount?: number;
}

export interface ListingOrderMessageParams {
  listingTitle: string;
  price: number;
  listingId: string;
  district?: string | null;
  sellerName?: string;
  variantLabel?: string;
}

/**
 * Construit l'URL web courte et partageable pour une boutique
 */
export function buildShopShareUrl(shopSlugOrId: string): string {
  const clean = (shopSlugOrId || '').trim();
  return `https://daloamarket.com/b/${clean}`;
}

/**
 * Construit l'URL web courte et partageable pour une annonce
 */
export function buildListingShareUrl(listingId: string): string {
  const clean = (listingId || '').trim();
  return `https://daloamarket.com/l/${clean}`;
}

/**
 * Formate le message promotionnel pour statuts et groupes WhatsApp
 */
export function formatShopWhatsAppShareMessage(params: ShopShareParams): string {
  const { shopName, shopSlug, district, rating, listingCount } = params;
  const url = buildShopShareUrl(shopSlug);

  const lines = [
    `🛍️ *${shopName}* est sur DaloaMarket !`,
    district ? `📍 Quartier : ${district}` : '📍 Ville : Daloa',
    rating && rating > 0 ? `⭐ Note : ${rating.toFixed(1)}/5` : '✨ Nouvelle boutique vérifiée',
  ];

  if (typeof listingCount === 'number' && listingCount > 0) {
    lines.push(`📦 ${listingCount} article${listingCount > 1 ? 's' : ''} disponible${listingCount > 1 ? 's' : ''}`);
  }

  lines.push('', '👉 Découvrez tous nos articles :', url, '', 'Livraison rapide à Daloa avec DaloaDelivery 🛵');

  return lines.join('\n');
}

/**
 * Formate le message de commande pré-rempli pour amorcer la discussion WhatsApp directe avec le commerçant
 */
export function formatListingWhatsAppOrderMessage(params: ListingOrderMessageParams): string {
  const { listingTitle, price, listingId, district, sellerName, variantLabel } = params;
  const listingUrl = buildListingShareUrl(listingId);
  const formattedPrice = formatFCFA(price);
  const greeting = sellerName ? `Bonjour ${sellerName},` : 'Bonjour,';

  const lines = [
    greeting,
    'Je suis intéressé(e) par votre article vu sur DaloaMarket :',
    '',
    `📦 *${listingTitle}*${variantLabel ? ` (${variantLabel})` : ''}`,
    `💰 Prix : *${formattedPrice}*`,
    district ? `📍 Quartier : ${district}` : '📍 Daloa',
    `🔗 Annonce : ${listingUrl}`,
    '',
    'Est-il toujours disponible ? Pouvons-nous convenir de la livraison via DaloaDelivery ? 🛵',
  ];

  return lines.join('\n');
}

/**
 * Construit l'URL wa.me prête à ouvrir pour WhatsApp
 */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return null;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}
