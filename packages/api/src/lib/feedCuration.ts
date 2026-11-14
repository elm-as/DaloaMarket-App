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
  view_count?: number | null;
  created_at?: string;
  sort_at?: string | null;
  boosted_until?: string | null;
  stock?: number | null;
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
  const available = listings.filter((l) => l.stock == null || l.stock > 0);

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

function findAlternateSellerIndex<T extends FeedListingCandidate>(
  deferred: T[],
  blockedSellerId: string | null
): number {
  return deferred.findIndex((candidate) => getListingSellerId(candidate) !== blockedSellerId);
}

/**
 * Anti-Monopole : Réorganise un flux chronologique ou scoré pour garantir
 * qu'aucun vendeur ne monopolise plus de `maxConsecutive` (défaut: 2) positions consécutives.
 * Préserve l'ordre relatif des annonces de manière pure sans muter le tableau d'entrée.
 */
export function interleaveSellerListings<T extends FeedListingCandidate>(
  listings: T[],
  maxConsecutive = 2
): T[] {
  if (listings.length <= maxConsecutive) return [...listings];

  const result: T[] = [];
  let deferred: T[] = [];
  let currentSellerId: string | null = null;
  let consecutiveCount = 0;

  for (const item of listings) {
    const altIdx = deferred.length > 0 ? findAlternateSellerIndex(deferred, currentSellerId) : -1;
    if (altIdx >= 0) {
      const picked = deferred[altIdx];
      deferred = [...deferred.slice(0, altIdx), ...deferred.slice(altIdx + 1)];
      result.push(picked);
      currentSellerId = getListingSellerId(picked);
      consecutiveCount = 1;
    }

    const sellerId = getListingSellerId(item);
    const exceedsStreak = Boolean(sellerId && sellerId === currentSellerId && consecutiveCount >= maxConsecutive);
    if (exceedsStreak) {
      deferred = [...deferred, item];
      continue;
    }

    consecutiveCount = sellerId === currentSellerId ? consecutiveCount + 1 : 1;
    currentSellerId = sellerId;
    result.push(item);
  }

  return [...result, ...deferred];
}
