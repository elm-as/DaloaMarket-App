/**
 * Service d'apprentissage comportemental et profilage sur l'appareil (Mobile On-Device ML).
 * Construit un profil de préférences dynamique avec décroissance temporelle exponentielle (7 jours).
 */

import { SecureStorageAdapter } from '@daloa/utils';
import { analyticsService } from '@daloa/api';
import {
  computeTF,
  tokenizeText,
  cosineSimilarity,
  priceSimilarity,
  categorySimilarity,
  locationSimilarity,
  normalizeText,
  ListingLike,
  ScoredRecommendation,
} from '../lib/recommendationEngine';

export type InteractionType = 'view' | 'click' | 'search' | 'favorite' | 'contact' | 'add_to_cart';

export interface UserInteraction {
  type: InteractionType;
  listingId?: string;
  category?: string;
  price?: number;
  title?: string;
  district?: string;
  searchQuery?: string;
  timestamp: number;
}

export interface UserPreferenceProfile {
  categoryWeights: Record<string, number>;
  averagePrice: number;
  priceVariance: number;
  topKeywords: string[];
  districtWeights: Record<string, number>;
  totalInteractions: number;
  lastActive: number;
}

const STORAGE_KEY = 'dm_mobile_interactions_v1';
const MAX_INTERACTIONS = 40;
const HALF_LIFE_DAYS = 7;

const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  view: 1.0,
  click: 2.0,
  search: 3.0,
  add_to_cart: 4.5,
  favorite: 5.0,
  contact: 7.0,
};

const EVENT_NAME_MAP: Record<InteractionType, 'listing_view' | 'listing_click' | 'search' | 'favorite_add' | 'contact_seller' | 'add_to_cart'> = {
  view: 'listing_view',
  click: 'listing_click',
  search: 'search',
  favorite: 'favorite_add',
  contact: 'contact_seller',
  add_to_cart: 'add_to_cart',
};

class UserBehaviorService {
  private interactions: UserInteraction[] = [];
  private cachedProfile: UserPreferenceProfile | null = null;
  private profileDirty = true;
  private isLoaded = false;

  constructor() {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      const raw = await SecureStorageAdapter.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.interactions = parsed.slice(-MAX_INTERACTIONS);
          this.profileDirty = true;
        }
      }
    } catch {
      this.interactions = [];
    } finally {
      this.isLoaded = true;
    }
  }

  private persistInteractions(): void {
    const compact = this.interactions.slice(-MAX_INTERACTIONS).map((i) => ({
      type: i.type,
      listingId: i.listingId,
      category: i.category,
      price: i.price,
      title: i.title ? i.title.substring(0, 40) : undefined,
      district: i.district,
      searchQuery: i.searchQuery ? i.searchQuery.substring(0, 30) : undefined,
      timestamp: i.timestamp,
    }));

    void SecureStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(compact));
  }

  /**
   * Enregistre une interaction utilisateur (vue, clic, recherche, favori...).
   */
  public trackInteraction(
    interaction: Omit<UserInteraction, 'timestamp'>,
    userId?: string | null
  ): void {
    const now = Date.now();
    const fullInteraction: UserInteraction = {
      ...interaction,
      timestamp: now,
    };

    // Éviter les doublons consécutifs immédiats (< 2s)
    const last = this.interactions[this.interactions.length - 1];
    if (
      last &&
      last.type === fullInteraction.type &&
      last.listingId === fullInteraction.listingId &&
      now - last.timestamp < 2000
    ) {
      return;
    }

    this.interactions.push(fullInteraction);
    if (this.interactions.length > MAX_INTERACTIONS) {
      this.interactions.shift();
    }

    this.profileDirty = true;
    this.persistInteractions();

    // Log serveur asynchrone fire-and-forget
    const eventName = EVENT_NAME_MAP[fullInteraction.type];
    if (eventName) {
      analyticsService.logEvent({
        eventName,
        userId: userId ?? null,
        listingId: fullInteraction.listingId ?? null,
        props: {
          category: fullInteraction.category,
          price: fullInteraction.price,
          district: fullInteraction.district,
          searchQuery: fullInteraction.searchQuery,
        },
      });
    }
  }

  /**
   * Enregistre une recherche textuelle.
   */
  public trackSearch(query: string, userId?: string | null): void {
    if (!query || query.trim().length < 2) return;
    this.trackInteraction(
      {
        type: 'search',
        searchQuery: query.trim(),
      },
      userId
    );
  }

  /**
   * Hydrate l'apprentissage local à partir des favoris existants dans Supabase.
   */
  public hydrateFavorites(
    favorites: Array<{ id: string; category?: string | null; price?: number | null; title?: string | null; district?: string | null }>
  ): void {
    if (!favorites.length) return;

    const existingFavIds = new Set(
      this.interactions.filter((i) => i.type === 'favorite').map((i) => i.listingId)
    );

    let added = 0;
    for (const fav of favorites) {
      if (existingFavIds.has(fav.id)) continue;
      const simulatedAge = Math.random() * 14 * 24 * 60 * 60 * 1000;
      this.interactions.push({
        type: 'favorite',
        listingId: fav.id,
        category: fav.category ?? undefined,
        price: fav.price ?? undefined,
        title: fav.title ?? undefined,
        district: fav.district ?? undefined,
        timestamp: Date.now() - simulatedAge,
      });
      added++;
    }

    if (added === 0) return;

    this.interactions = this.interactions
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_INTERACTIONS);

    this.profileDirty = true;
    this.persistInteractions();
  }

  /**
   * Calcule le profil de préférences dynamiques de l'utilisateur.
   */
  public getUserProfile(): UserPreferenceProfile {
    if (!this.profileDirty && this.cachedProfile) {
      return this.cachedProfile;
    }

    const now = Date.now();
    const catScores: Record<string, number> = {};
    const districtScores: Record<string, number> = {};
    const keywordScores: Record<string, number> = {};
    const priceWeights: { price: number; weight: number }[] = [];

    for (const action of this.interactions) {
      const ageDays = (now - action.timestamp) / (1000 * 60 * 60 * 24);
      const timeDecay = Math.pow(2, -ageDays / HALF_LIFE_DAYS);
      const baseWeight = INTERACTION_WEIGHTS[action.type] || 1.0;
      const effectiveWeight = baseWeight * timeDecay;

      if (action.category) {
        const cat = action.category.toLowerCase().trim();
        catScores[cat] = (catScores[cat] || 0) + effectiveWeight;
      }

      if (action.district) {
        const dist = normalizeText(action.district);
        if (dist) districtScores[dist] = (districtScores[dist] || 0) + effectiveWeight;
      }

      if (action.price && action.price > 0) {
        priceWeights.push({ price: action.price, weight: effectiveWeight });
      }

      const text = `${action.title || ''} ${action.searchQuery || ''}`;
      if (text.trim()) {
        const tokens = tokenizeText(text);
        for (const token of tokens) {
          keywordScores[token] = (keywordScores[token] || 0) + effectiveWeight;
        }
      }
    }

    const normalizedCats: Record<string, number> = {};
    let catSum = 0;
    for (const val of Object.values(catScores)) catSum += val;
    if (catSum > 0) {
      for (const [cat, score] of Object.entries(catScores)) {
        normalizedCats[cat] = score / catSum;
      }
    }

    const normalizedDistricts: Record<string, number> = {};
    let distSum = 0;
    for (const val of Object.values(districtScores)) distSum += val;
    if (distSum > 0) {
      for (const [dist, score] of Object.entries(districtScores)) {
        normalizedDistricts[dist] = score / distSum;
      }
    }

    let avgPrice = 25000;
    if (priceWeights.length > 0) {
      let weightedPriceSum = 0;
      let totalPWeight = 0;
      for (const item of priceWeights) {
        weightedPriceSum += item.price * item.weight;
        totalPWeight += item.weight;
      }
      if (totalPWeight > 0) {
        avgPrice = Math.round(weightedPriceSum / totalPWeight);
      }
    }

    const topKeywords = Object.entries(keywordScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([kw]) => kw);

    this.cachedProfile = {
      categoryWeights: normalizedCats,
      averagePrice: avgPrice,
      priceVariance: 0.5,
      topKeywords,
      districtWeights: normalizedDistricts,
      totalInteractions: this.interactions.length,
      lastActive: this.interactions.length > 0 ? this.interactions[this.interactions.length - 1].timestamp : now,
    };

    this.profileDirty = false;
    return this.cachedProfile;
  }

  /**
   * Retourne les recommandations personnalisées on-device pour les candidats fournis.
   */
  public getPersonalizedListings<T extends ListingLike>(
    candidates: T[],
    options: { limit?: number; minScore?: number; excludeIds?: string[] } = {}
  ): ScoredRecommendation<T>[] {
    const { limit = 8, minScore = 25, excludeIds = [] } = options;
    const profile = this.getUserProfile();
    const excludeSet = new Set(excludeIds);

    const available = candidates.filter(
      (c) => !excludeSet.has(c.id) && (c.stock === undefined || c.stock > 0)
    );

    if (profile.totalInteractions < 2) {
      return [];
    }

    const profileVec = computeTF(profile.topKeywords);
    const scoredList: ScoredRecommendation<T>[] = [];

    for (const item of available) {
      const itemCat = (item.category || '').toLowerCase().trim();
      let catScore = profile.categoryWeights[itemCat] || 0;
      if (catScore === 0) {
        for (const [userCat, weight] of Object.entries(profile.categoryWeights)) {
          const sim = categorySimilarity(userCat, itemCat);
          if (sim > 0.5) catScore = Math.max(catScore, weight * sim);
        }
      }

      const itemVec = computeTF(tokenizeText(`${item.title} ${item.description || ''}`));
      const textScore = cosineSimilarity(profileVec, itemVec);
      const priceScore = priceSimilarity(profile.averagePrice, item.price, 0.6);

      const itemDist = normalizeText(item.district || '');
      const locationScore = itemDist && profile.districtWeights[itemDist] ? 0.9 : 0.5;

      let recencyScore = 0.5;
      if (item.created_at) {
        const ageDays = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
        recencyScore = Math.max(0.2, Math.min(1.0, 1.0 - ageDays / 45));
      }

      const raw =
        catScore * 0.35 +
        textScore * 0.30 +
        priceScore * 0.20 +
        locationScore * 0.08 +
        recencyScore * 0.07;

      const isBoosted = item.boosted_until && new Date(item.boosted_until) > new Date();
      const finalScore = Math.min(100, Math.round(raw * 100 * (isBoosted ? 1.08 : 1.0)));

      let matchReason = 'Pour vous';
      if (catScore > 0.4 && textScore > 0.3) {
        matchReason = 'Correspond à vos intérêts';
      } else if (catScore > 0.4) {
        matchReason = 'Catégorie favorite';
      } else if (priceScore > 0.85) {
        matchReason = 'Dans votre budget';
      } else if (itemDist && profile.districtWeights[itemDist]) {
        matchReason = `Quartier ${item.district}`;
      }

      if (finalScore >= minScore) {
        scoredList.push({
          item,
          score: finalScore,
          similarityPercent: finalScore,
          matchReason,
          isPersonalized: true,
        });
      }
    }

    scoredList.sort((a, b) => b.score - a.score);
    return scoredList.slice(0, limit);
  }
}

export const userBehaviorService = new UserBehaviorService();
