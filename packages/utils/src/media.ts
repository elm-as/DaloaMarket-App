/**
 * Résolution de la photo d'une annonce.
 *
 * Une URI locale d'appareil (`file://`, `content://`) peut se retrouver en base si
 * un téléversement a échoué : elle s'affiche encore sur le téléphone qui l'a créée,
 * mais nulle part ailleurs — le navigateur refuse même de la charger
 * (« Not allowed to load local resource »). On la traite donc comme absente et on
 * bascule sur le visuel de remplacement.
 */

export const LISTING_PHOTO_FALLBACK =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

/** Une URL est affichable partout si elle est distante (http/https) ou embarquée (data:). */
export function isDisplayablePhotoUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  );
}

/**
 * Première photo affichable d'une annonce, ou le visuel de remplacement.
 * `fallback` permet de fournir un placeholder propre à une surface.
 */
export function resolveListingPhoto(
  photos: unknown,
  fallback: string = LISTING_PHOTO_FALLBACK
): string {
  if (!Array.isArray(photos)) return fallback;
  const first = photos.find((p) => isDisplayablePhotoUrl(p));
  return isDisplayablePhotoUrl(first) ? first.trim() : fallback;
}
