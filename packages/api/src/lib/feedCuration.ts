/**
 * Algorithmes de curation et d'ordonnancement de flux pour DaloaMarket.
 *
 * 1. Trending Velocity (Gravité type Hacker News / Reddit adapté au commerce local)
 * 2. Anti-Monopole / Seller Throttling (Intercalage de vendeurs pour un flux diversifié)
 * 3. Tri & diversification
 */

export interface FeedListingCandidate {
  id: string;
  user_id?: string;
  listing_user_id?: string;
  seller?: { id?: string; full_name?: string } | null;
  view_count?: number;
  created_at?: string;
  sort_at?: string;
  boosted_until?: string | null;
  stock?: number;
}

/**
 * Extrait l'identifiant unique du vendeur depuis l'annonce.
 */
function getListingSellerId(item: FeedListingCandidate): string | null {
  return item.user_id || item.seller?.id || item.listing_user_id || null;
}

/**
 * Calcule le score de tendance (Trending Velocity).
 * Formule basée sur la vélocité d'engagement pondérée par la décroissance temporelle (Gravity Decay).
 *
 * Score = (views + 2) / (ageDays + 2)^1.3 * (isBoosted ? 1.25 : 1.0)
 */
export function computeTrendingScore(listing: FeedListingCandidate): number {
  const views = Math.max(0, listing.view_count || 0);

  // Date de publication ou de dernier bump
  const dateStr = listing.sort_at || listing.created_at;
  const ageMs = dateStr ? Math.max(0, Date.now() - new Date(dateStr).getTime()) : 0;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Décroissance par gravité : évite que les vieilles annonces avec beaucoup de vues restent figées
  const gravity = Math.pow(ageDays + 2, 1.3);
  const baseScore = (views + 2) / gravity;

  // Boost actif : multiplicateur incitatif
  const isBoosted = listing.boosted_until ? new Date(listing.boosted_until) > new Date() : false;
  const boostMultiplier = isBoosted ? 1.25 : 1.0;

  return baseScore * boostMultiplier;
}

/**
 * Sélectionne et ordonne les annonces les plus tendances ("Populaire à Daloa").
 * Applique une diversité vendeurs (max 2 annonces par vendeur dans la sélection).
 */
export function getTrendingListings<T extends FeedListingCandidate>(
  listings: T[],
  limit = 8
): T[] {
  const available = listings.filter((l) => l.stock === undefined || l.stock > 0);

  const scored = available.map((item) => ({
    item,
    score: computeTrendingScore(item),
  }));

  scored.sort((a, b) => b.score - a.score);

  const out: T[] = [];
  const sellerCounts = new Map<string, number>();

  for (const entry of scored) {
    if (out.length >= limit) break;
    const sellerId = getListingSellerId(entry.item);
    if (sellerId) {
      const current = sellerCounts.get(sellerId) || 0;
      if (current >= 2) continue;
      sellerCounts.set(sellerId, current + 1);
    }
    out.push(entry.item);
  }

  // Compléter si la diversité a réduit en dessous du limit
  if (out.length < limit) {
    const includedIds = new Set(out.map((o) => o.id));
    for (const entry of scored) {
      if (out.length >= limit) break;
      if (!includedIds.has(entry.item.id)) {
        out.push(entry.item);
      }
    }
  }

  return out;
}

/**
 * Anti-Monopole : Réorganise un flux chronologique ou scoré pour garantir
 * qu'aucun vendeur ne monopolise plus de `maxConsecutive` (défaut: 2) positions consécutives.
 * Préserve l'ordre relatif des annonces au maximum.
 */
export function interleaveSellerListings<T extends FeedListingCandidate>(
  listings: T[],
  maxConsecutive = 2
): T[] {
  if (listings.length <= maxConsecutive) return listings;

  const result: T[] = [];
  const deferred: T[] = [];
  let currentSellerId: string | null = null;
  let consecutiveCount = 0;

  for (const item of listings) {
    const sellerId = getListingSellerId(item);

    // Vérifier si des éléments différés d'autres vendeurs peuvent être insérés
    if (deferred.length > 0) {
      for (let i = 0; i < deferred.length; i++) {
        const dItem = deferred[i];
        const dSellerId = getListingSellerId(dItem);
        if (dSellerId !== currentSellerId) {
          result.push(dItem);
          deferred.splice(i, 1);
          currentSellerId = dSellerId;
          consecutiveCount = 1;
          break;
        }
      }
    }

    if (sellerId && sellerId === currentSellerId) {
      if (consecutiveCount >= maxConsecutive) {
        // Trop d'annonces consécutives du même vendeur, on temporise
        deferred.push(item);
        continue;
      }
      consecutiveCount++;
    } else {
      currentSellerId = sellerId;
      consecutiveCount = 1;
    }

    result.push(item);
  }

  // Insérer les éléments restants différés
  while (deferred.length > 0) {
    const item = deferred.shift()!;
    result.push(item);
  }

  return result;
}
