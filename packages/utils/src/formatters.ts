/**
 * Formate un prix en FCFA avec séparateurs de milliers
 * Ex: 15000 -> "15 000 FCFA"
 */
export function formatFCFA(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0 FCFA';
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Calcule l'intervalle de prix (min / max) pour une annonce avec variantes.
 * Si les variantes ont toutes le même prix (ex: juste des couleurs différentes)
 * ou s'il n'y a pas de variantes, hasRange vaut false et label affiche le prix unique.
 */
export function getListingPriceRange(
  basePrice: number,
  variants?: Array<{ price?: number | null; active?: boolean }> | null
): { minPrice: number; maxPrice: number; hasRange: boolean; label: string } {
  const base = Number(basePrice) || 0;
  const activeVariants = (variants || []).filter((v) => v.active !== false);

  if (!activeVariants || activeVariants.length === 0) {
    return {
      minPrice: base,
      maxPrice: base,
      hasRange: false,
      label: formatFCFA(base),
    };
  }

  const prices = activeVariants.map((v) =>
    v.price != null && Number(v.price) > 0 ? Number(v.price) : base
  );

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const hasRange = min < max;

  return {
    minPrice: min,
    maxPrice: max,
    hasRange,
    label: hasRange ? `${formatFCFA(min)} - ${formatFCFA(max)}` : formatFCFA(min),
  };
}

/**
 * Formate une distance en kilomètres ou mètres
 * Ex: 1.4 -> "1.4 km", 0.6 -> "600 m"
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm == null || isNaN(distanceKm)) return '0 m';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Formate une date ISO en chaîne française lisible
 * Ex: "2026-08-25T12:00:00Z" -> "25 août 2026"
 */
export function formatDate(isoString: string | null | undefined, includeTime = false): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };

  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

/**
 * Formate une date relative (ex: "Il y a 5 min", "Hier", "Il y a 3 jours")
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return 'Hier';
  if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;

  return formatDate(isoString);
}

/**
 * Nettoie et formate un numéro de téléphone pour WhatsApp (+225 CI)
 * Ex: 0701020304 -> 2250701020304
 */
export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('225')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `225${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 10) {
    return `225${digits}`;
  }

  return digits;
}

/**
 * Formate un numéro de téléphone ivoirien pour affichage
 * Ex: 0701020304 -> "07 01 02 03 04"
 */
export function formatDisplayPhone(phone?: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}
