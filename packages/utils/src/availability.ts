/**
 * Disponibilité d'une annonce — source de vérité unique.
 *
 * Chaque surface calculait sa propre règle et elles se contredisaient :
 * les cartes (web et mobile) regardaient `stock`, la page détail web regardait
 * `status`, l'écran détail mobile ne regardait rien, et les valeurs par défaut
 * divergeaient (`?? 0` côté web, `?? 1` côté mobile). Une annonce remise en vente
 * sans restock (`status: 'active'`, `stock: 0`) s'affichait donc « Épuisé » sur la
 * carte, normale sur la fiche, et se faisait éjecter du panier.
 */

export interface AvailabilityVariant {
  id?: string;
  label?: string | null;
  stock?: number | null;
  active?: boolean | null;
}

export interface AvailabilityListing {
  status?: string | null;
  stock?: number | null;
  variants?: AvailabilityVariant[] | null;
}

/**
 * Certaines surfaces (cartes alimentées par un mapper partiel) ne transportent ni
 * `status` ni `stock`. Un champ absent ne doit JAMAIS être lu comme « indisponible » :
 * sinon toutes les cartes se couvriraient d'un bandeau « Vendu ». On ne conclut à
 * l'indisponibilité que sur une donnée réellement présente — le panier et la RPC de
 * commande restent de toute façon les garde-fous qui font autorité.
 */
function hasKnownStock(listing: AvailabilityListing): boolean {
  if (Array.isArray(listing.variants) && listing.variants.length > 0) return true;
  return listing.stock !== null && listing.stock !== undefined;
}

/** Stock réellement vendable : somme des variantes actives, sinon le stock global. */
export function getListingStock(listing: AvailabilityListing | null | undefined): number {
  if (!listing) return 0;

  const variants = Array.isArray(listing.variants) ? listing.variants : [];
  if (variants.length > 0) {
    return variants
      .filter((v) => v.active !== false)
      .reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
  }

  return Math.max(0, Number(listing.stock) || 0);
}

/**
 * Motif d'indisponibilité, pour choisir le bon libellé :
 * `null` = disponible (ou donnée absente), `'sold'` = vendue/retirée,
 * `'out_of_stock'` = épuisée.
 */
export function getUnavailabilityReason(
  listing: AvailabilityListing | null | undefined
): 'sold' | 'out_of_stock' | null {
  if (!listing) return null;
  if (listing.status != null && listing.status !== 'active') return 'sold';
  if (hasKnownStock(listing) && getListingStock(listing) <= 0) return 'out_of_stock';
  return null;
}

/** Une annonce est achetable si elle est active ET qu'il reste du stock. */
export function isListingAvailable(listing: AvailabilityListing | null | undefined): boolean {
  if (!listing) return false;
  return getUnavailabilityReason(listing) === null;
}

/**
 * `orders.delivery_mode` accepte trois valeurs en base : `delivery`, `pickup_point`
 * et `pickup`. Le web a toujours écrit `pickup_point`, le mobile `pickup` — et le
 * mobile ne testait que `'pickup'`, si bien qu'une commande retrait créée sur le web
 * n'affichait aucune action côté vendeur mobile. Les nouvelles commandes écrivent
 * `pickup_point` des deux côtés ; ce prédicat couvre l'historique.
 */
export function isPickupMode(deliveryMode: string | null | undefined): boolean {
  return deliveryMode === 'pickup_point' || deliveryMode === 'pickup';
}
