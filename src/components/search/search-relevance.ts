import { rankFuzzySearchResults, calculateRelevance, SearchableItem } from '@daloa/utils';

export type SearchableListing = SearchableItem;

/**
 * Calcule le score de pertinence d'une annonce selon le mot-clé saisi
 * en intégrant tolérance aux fautes Levenshtein et dictionnaire local ivoirien.
 */
export function calculateRelevanceScore(listing: SearchableListing, query: string): number {
  return calculateRelevance(listing, query);
}

/**
 * Filtre et classe les annonces par pertinence selon la requête et le mode de tri,
 * avec prise en compte du dictionnaire ivoirien et de la distance de Levenshtein.
 */
export function filterAndRankListings(
  listings: SearchableListing[],
  searchQuery: string,
  sortBy: 'recent' | 'price_asc' | 'price_desc' = 'recent'
): SearchableListing[] {
  return rankFuzzySearchResults(listings, searchQuery, sortBy);
}

