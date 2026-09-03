/**
 * Moteur de recommandations DaloaMarket (Mobile)
 * Profile construit depuis les favoris Supabase — persistant, cross-device.
 * Algorithmes identiques au web mais sans localStorage.
 */

// ─── Stop words français ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'le','la','les','un','une','des','du','de','d','l','a','à','au','aux',
  'en','dans','sur','sous','par','pour','avec','sans','et','ou','mais','donc',
  'or','ni','car','ce','cet','cette','ces','mon','ton','son','notre','votre',
  'leur','je','tu','il','elle','on','nous','vous','ils','elles','se','sa',
  'ses','est','sont','suis','es','sommes','etes','être','avoir',
  'tres','très','plus','moins','bien','bon','bonne','vends','vendre','vente',
  'urgent','quasi','neuf','etat','état','prix','fcfa','daloa',
]);

// ─── Catégories connexes ─────────────────────────────────────────────────────

const CATEGORY_GRAPH: Record<string, { related: string[]; weight: number }> = {
  electronics: { related: ['informatique','telephone','high-tech'], weight: 0.8 },
  fashion:     { related: ['mode','chaussures','accessoires','beaute'], weight: 0.8 },
  vehicles:    { related: ['auto','moto','pieces-detachees','deux-roues'], weight: 0.8 },
  home:        { related: ['maison','electromenager','meubles','deco'], weight: 0.8 },
  sports:      { related: ['loisirs','fitness','velo'], weight: 0.7 },
  books:       { related: ['scolaire','culture','bureau'], weight: 0.7 },
  food:        { related: ['alimentaire','produits-locaux','terroir'], weight: 0.8 },
};

// ─── Quartiers Daloa ─────────────────────────────────────────────────────────

const DISTRICT_CLUSTERS: Record<string, string[]> = {
  centre: ['commerce','grand marche','zone industrielle','marche central','administratif'],
  nord:   ['tazibou','kennedy','abattoir','garage'],
  sud:    ['lobia','labia','kirman','soleil','balouzon','bribouo','marais','zakoua','gbeuliville'],
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  categoryWeights: Record<string, number>;
  avgPrice: number;
  districtWeights: Record<string, number>;
  topKeywords: string[];
  hasFavorites: boolean;
}

export interface FavoriteLike {
  title: string;
  price?: number | null;
  category?: string | null;
  district?: string | null;
  description?: string | null;
}

export interface ListingLike {
  id: string;
  title: string;
  price: number;
  category?: string | null;
  district?: string | null;
  description?: string | null;
  condition?: string | null;
  created_at?: string;
  boosted_until?: string | null;
  stock?: number;
  photos?: string[];
  view_count?: number;
  user_id?: string;
  seller?: { id?: string } | null;
}

// ─── Fonctions de base ───────────────────────────────────────────────────────

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeText(text: string): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  const words = norm.split(/\s+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  const tokens = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]}_${words[i + 1]}`);
  }
  return tokens;
}

export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (!tokens.length) return tf;
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  let sumSq = 0;
  for (const v of tf.values()) sumSq += v * v;
  const norm = Math.sqrt(sumSq) || 1;
  for (const [t, v] of tf.entries()) tf.set(t, v / norm);
  return tf;
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (!a.size || !b.size) return 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, val] of small.entries()) {
    const valB = large.get(term);
    if (valB !== undefined) dot += val * valB;
  }
  return Math.max(0, Math.min(1, dot));
}

export function priceSimilarity(p1: number, p2: number, sigma = 0.5): number {
  if (p1 <= 0 || p2 <= 0) return 0.5;
  const logRatio = Math.log(p2) - Math.log(p1);
  return Math.max(0, Math.min(1, Math.exp(-(logRatio * logRatio) / (2 * sigma * sigma))));
}

export function categorySimilarity(a: string, b: string): number {
  if (!a || !b) return 0.2;
  const ca = a.toLowerCase().trim();
  const cb = b.toLowerCase().trim();
  if (ca === cb) return 1.0;
  const ga = CATEGORY_GRAPH[ca];
  if (ga?.related.includes(cb)) return ga.weight;
  const gb = CATEGORY_GRAPH[cb];
  if (gb?.related.includes(ca)) return gb.weight;
  return 0.1;
}

export function locationSimilarity(la?: string | null, lb?: string | null): number {
  if (!la || !lb) return 0.5;
  const na = normalizeText(la);
  const nb = normalizeText(lb);
  if (na === nb) return 1.0;
  for (const cluster of Object.values(DISTRICT_CLUSTERS)) {
    const hasA = cluster.some((d) => na.includes(d));
    const hasB = cluster.some((d) => nb.includes(d));
    if (hasA && hasB) return 0.75;
  }
  return 0.4;
}

// ─── Profil utilisateur depuis les favoris ───────────────────────────────────

export function buildUserProfile(favorites: FavoriteLike[]): UserProfile {
  if (!favorites.length) {
    return { categoryWeights: {}, avgPrice: 25000, districtWeights: {}, topKeywords: [], hasFavorites: false };
  }

  const catCounts: Record<string, number> = {};
  const distCounts: Record<string, number> = {};
  const kwCounts: Record<string, number> = {};
  let priceSum = 0;
  let priceN = 0;

  for (const fav of favorites) {
    if (fav.category) {
      const c = fav.category.toLowerCase().trim();
      catCounts[c] = (catCounts[c] || 0) + 1;
    }
    if (fav.district) {
      const d = normalizeText(fav.district);
      if (d) distCounts[d] = (distCounts[d] || 0) + 1;
    }
    if (fav.price && fav.price > 0) {
      priceSum += fav.price;
      priceN++;
    }
    const tokens = tokenizeText(`${fav.title || ''} ${fav.description || ''}`);
    for (const t of tokens) kwCounts[t] = (kwCounts[t] || 0) + 1;
  }

  const catTotal = Object.values(catCounts).reduce((a, b) => a + b, 0);
  const categoryWeights: Record<string, number> = {};
  for (const [c, n] of Object.entries(catCounts)) categoryWeights[c] = n / catTotal;

  const distTotal = Object.values(distCounts).reduce((a, b) => a + b, 0);
  const districtWeights: Record<string, number> = {};
  for (const [d, n] of Object.entries(distCounts)) districtWeights[d] = n / distTotal;

  const avgPrice = priceN > 0 ? priceSum / priceN : 25000;

  const topKeywords = Object.entries(kwCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([kw]) => kw);

  return { categoryWeights, avgPrice, districtWeights, topKeywords, hasFavorites: true };
}

// ─── Score user-to-item ──────────────────────────────────────────────────────

export function scoreForUser(listing: ListingLike, profile: UserProfile): number {
  if (!profile.hasFavorites) {
    let s = 50;
    if (listing.boosted_until && new Date(listing.boosted_until) > new Date()) s += 20;
    return s;
  }

  // Affinité catégorie
  const cat = (listing.category || '').toLowerCase().trim();
  let catScore = profile.categoryWeights[cat] || 0;
  if (catScore === 0) {
    for (const [uc, w] of Object.entries(profile.categoryWeights)) {
      const sim = categorySimilarity(uc, cat);
      if (sim > 0.5) catScore = Math.max(catScore, w * sim);
    }
  }

  // Affinité textuelle
  const profileVec = computeTF(profile.topKeywords);
  const listingVec = computeTF(tokenizeText(`${listing.title} ${listing.description || ''}`));
  const textScore = cosineSimilarity(profileVec, listingVec);

  // Affinité prix
  const priceScore = priceSimilarity(profile.avgPrice, listing.price, 0.6);

  // Affinité quartier
  const dist = normalizeText(listing.district || '');
  const locationScore = dist && profile.districtWeights[dist] ? 0.9 : 0.5;

  // Fraîcheur
  let recencyScore = 0.5;
  if (listing.created_at) {
    const ageDays = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24);
    recencyScore = Math.max(0.2, Math.min(1.0, 1.0 - ageDays / 45));
  }

  const raw =
    catScore     * 0.35 +
    textScore    * 0.30 +
    priceScore   * 0.20 +
    locationScore * 0.08 +
    recencyScore * 0.07;

  const boost = listing.boosted_until && new Date(listing.boosted_until) > new Date() ? 1.08 : 1.0;
  return Math.min(100, Math.round(raw * 100 * boost));
}

// ─── Recommandations complètes avec motifs et Cold Start ────────────────────

export interface ScoredRecommendation<T = ListingLike> {
  item: T;
  score: number;
  similarityPercent: number;
  matchReason: string;
  isPersonalized: boolean;
}

/**
 * Retourne les meilleures recommandations pour l'utilisateur.
 * Si l'utilisateur n'a pas encore de favoris (Cold Start),
 * le moteur met en avant les annonces populaires, boostées et fraîches à Daloa.
 */
export function getRecommendationsForUser<T extends ListingLike>(
  listings: T[],
  favorites: FavoriteLike[],
  options: { limit?: number; excludeIds?: string[] } = {}
): ScoredRecommendation<T>[] {
  const { limit = 8, excludeIds = [] } = options;
  const excludeSet = new Set(excludeIds);
  const candidates = listings.filter((l) => !excludeSet.has(l.id) && (l.stock === undefined || l.stock > 0));

  const hasPersonalization = favorites && favorites.length > 0;

  const safeLimit = Math.min(8, Math.max(1, options.limit ?? 8));

  if (!hasPersonalization) {
    // Mode Découverte (Cold-Start) : popularité locale réelle + fraîcheur + boost.
    // Normalisation log des vues pour éviter qu'un article très vu écrase tout.
    const maxLogViews = Math.max(
      1,
      ...candidates.map((c) => Math.log1p(c.view_count || 0))
    );

    const scored = candidates.map((item) => {
      let score = 45;
      const isBoosted = item.boosted_until && new Date(item.boosted_until) > new Date();
      if (isBoosted) score += 20;
      if (item.photos && item.photos.length > 0) score += 8;

      // Popularité (0-20 pts) via view_count normalisé
      const popularity = Math.log1p(item.view_count || 0) / maxLogViews;
      score += Math.round(popularity * 20);

      // Fraîcheur (0-12 pts)
      if (item.created_at) {
        const ageDays = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 3) score += 12;
        else if (ageDays < 7) score += 8;
        else if (ageDays < 21) score += 4;
      }

      const matchReason = isBoosted
        ? 'En vedette'
        : popularity > 0.6
        ? 'Populaire à Daloa'
        : 'À découvrir';

      return { item, score, similarityPercent: score, matchReason, isPersonalized: false };
    });

    scored.sort((a, b) => b.score - a.score);
    return diversifyRecommendations(scored, safeLimit);
  }

  const profile = buildUserProfile(favorites);

  const scored = candidates.map((item) => {
    const score = scoreForUser(item, profile);

    const cat = (item.category || '').toLowerCase().trim();
    const catWeight = profile.categoryWeights[cat] || 0;
    const priceDiff = Math.abs(item.price - profile.avgPrice) / (profile.avgPrice || 1);

    let matchReason = 'Pour vous';
    if (catWeight > 0.4) {
      matchReason = 'Catégorie favorite';
    } else if (priceDiff < 0.25) {
      matchReason = 'Dans votre budget';
    } else if (item.district && profile.districtWeights[normalizeText(item.district)]) {
      matchReason = `Quartier ${item.district}`;
    }

    return { item, score, similarityPercent: score, matchReason, isPersonalized: true };
  });

  scored.sort((a, b) => b.score - a.score);
  return diversifyRecommendations(scored, safeLimit);
}

/** Diversité vendeurs (max 2) + dédup quasi-doublons sur une liste de recommandations. */
function diversifyRecommendations<T extends ListingLike>(
  scored: ScoredRecommendation<T>[],
  limit: number
): ScoredRecommendation<T>[] {
  const out: ScoredRecommendation<T>[] = [];
  const sellerCount = new Map<string, number>();
  const seenFp = new Set<string>();

  for (const s of scored) {
    if (out.length >= limit) break;
    const fp = titleFingerprint(s.item.title);
    if (fp && seenFp.has(fp)) continue;
    const seller = getSellerKey(s.item);
    if (seller) {
      const n = sellerCount.get(seller) || 0;
      if (n >= 2) continue;
      sellerCount.set(seller, n + 1);
    }
    if (fp) seenFp.add(fp);
    out.push(s);
  }

  if (out.length < limit) {
    const chosen = new Set(out.map((o) => o.item.id));
    for (const s of scored) {
      if (out.length >= limit) break;
      if (!chosen.has(s.item.id)) out.push(s);
    }
  }

  return out;
}

// ─── Classement du feed (compatibilité ascendante) ───────────────────────────

export function rankForUser<T extends ListingLike>(
  listings: T[],
  favorites: FavoriteLike[],
  options: { limit?: number; excludeIds?: string[] } = {}
): T[] {
  return getRecommendationsForUser(listings, favorites, options).map((r) => r.item);
}

// ─── Item-to-item : articles similaires (page détail) ────────────────────────

type ProductCluster =
  | 'phone' | 'tv' | 'computer' | 'audio_accessory' | 'moto'
  | 'car' | 'appliance' | 'fashion' | 'furniture' | 'general';

/** Détecte le type précis d'un produit pour éviter de mélanger TV et smartphones. */
export function detectProductCluster(title: string): ProductCluster {
  const n = normalizeText(title);
  if (/iphone|samsung|galaxy|tecno|infinix|xiaomi|redmi|poco|itel|smartphone|telephone\b/.test(n)) {
    if (/chargeur|cable|ecouteur|airpod|coque|pochette|verre|incassable|support/.test(n)) return 'audio_accessory';
    return 'phone';
  }
  if (/tv\b|television|smart tv|led|plasma|hisense|tcl|ecran/.test(n)) return 'tv';
  if (/ordinateur|pc\b|laptop|macbook|desktop|unite centrale|core i[0-9]|hp\b|dell\b|lenovo/.test(n)) return 'computer';
  if (/airpod|ecouteur|casque bluetooth|baffle|enceinte/.test(n)) return 'audio_accessory';
  if (/moto\b|jakarta|scooter|apsonic|ktm|yamaha|dayang|royal/.test(n)) return 'moto';
  if (/voiture|toyota|mercedes|peugeot|hyundai|kia/.test(n)) return 'car';
  if (/frigo|refrigerateur|congelateur|congelo|gaziniere|cuisiniere|climatiseur|clim\b|ventilateur|ventilo|four\b/.test(n)) return 'appliance';
  if (/robe|pantalon|chemise|chaussure|sneaker|basket|claquette|pagne|t-shirt|costume|sac\b|perruque/.test(n)) return 'fashion';
  if (/matelas|lit\b|fauteuil|canape|salon|armoire|buffet|table\b/.test(n)) return 'furniture';
  return 'general';
}

function conditionSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0.7;
  return a.toLowerCase() === b.toLowerCase() ? 1.0 : 0.5;
}

/** Score de similarité article-à-article (0-100) avec garde-fous sémantiques. */
export function scoreItemSimilarity(
  source: ListingLike,
  target: ListingLike,
  sourceVec?: Map<string, number>
): number {
  const srcCluster = detectProductCluster(source.title);
  const tgtCluster = detectProductCluster(target.title);

  let clusterMult = 1.0;
  if (srcCluster !== 'general' && tgtCluster !== 'general') {
    if (srcCluster === tgtCluster) {
      clusterMult = 1.15;
    } else if (
      (srcCluster === 'phone' && tgtCluster === 'audio_accessory') ||
      (srcCluster === 'audio_accessory' && tgtCluster === 'phone') ||
      (srcCluster === 'computer' && tgtCluster === 'audio_accessory')
    ) {
      clusterMult = 0.75;
    } else {
      clusterMult = 0.05; // incompatible total (téléphone vs TV)
    }
  } else if (srcCluster !== tgtCluster) {
    // un seul type précis : éviter qu'un article générique remonte par coïncidence textuelle
    const sameCat = normalizeText(source.category || '') === normalizeText(target.category || '');
    clusterMult = sameCat ? 0.9 : 0.55;
  }

  const srcVec = sourceVec || computeTF(tokenizeText(`${source.title} ${source.description || ''}`));
  const tgtVec = computeTF(tokenizeText(`${target.title} ${target.description || ''}`));
  const textScore = cosineSimilarity(srcVec, tgtVec);
  const priceScore = priceSimilarity(source.price, target.price);
  const catScore = categorySimilarity(source.category || '', target.category || '');
  const locScore = locationSimilarity(source.district, target.district);
  const condScore = conditionSimilarity(source.condition, target.condition);

  let recencyScore = 0.5;
  if (target.created_at) {
    const ageDays = (Date.now() - new Date(target.created_at).getTime()) / (1000 * 60 * 60 * 24);
    recencyScore = Math.max(0.1, Math.min(1.0, 1.0 - ageDays / 60));
  }

  const raw =
    (catScore * 0.30 + textScore * 0.35 + priceScore * 0.20 +
     locScore * 0.08 + condScore * 0.04 + recencyScore * 0.03) * clusterMult;

  const boost = target.boosted_until && new Date(target.boosted_until) > new Date() ? 1.08 : 1.0;
  return Math.min(100, Math.round(raw * 100 * boost));
}

function getSellerKey(item: ListingLike): string | null {
  return item.user_id || item.seller?.id || null;
}

function titleFingerprint(title: string): string {
  return tokenizeText(title).filter((t) => !t.includes('_')).sort().slice(0, 6).join('|');
}

/**
 * Sélectionne les articles les plus similaires à une annonce donnée,
 * avec diversité vendeurs (max 2) et suppression des quasi-doublons.
 */
export function findSimilar<T extends ListingLike>(
  source: ListingLike,
  candidates: T[],
  options: { limit?: number; minScore?: number; excludeIds?: string[] } = {}
): T[] {
  const { limit = 4, minScore = 28, excludeIds = [] } = options;
  const excludeSet = new Set([source.id, ...excludeIds]);
  const srcVec = computeTF(tokenizeText(`${source.title} ${source.description || ''}`));

  const scored = candidates
    .filter((c) => !excludeSet.has(c.id) && (c.stock === undefined || c.stock > 0))
    .map((c) => ({ item: c, score: scoreItemSimilarity(source, c, srcVec) }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const out: T[] = [];
  const sellerCount = new Map<string, number>();
  const seenFp = new Set<string>();

  for (const s of scored) {
    if (out.length >= limit) break;
    const fp = titleFingerprint(s.item.title);
    if (fp && seenFp.has(fp)) continue;
    const seller = getSellerKey(s.item);
    if (seller) {
      const n = sellerCount.get(seller) || 0;
      if (n >= 2) continue;
      sellerCount.set(seller, n + 1);
    }
    if (fp) seenFp.add(fp);
    out.push(s.item);
  }

  // Compléter si la diversité a trop réduit la liste
  if (out.length < limit) {
    const chosen = new Set(out.map((o) => o.id));
    for (const s of scored) {
      if (out.length >= limit) break;
      if (!chosen.has(s.item.id)) out.push(s.item);
    }
  }

  return out;
}
