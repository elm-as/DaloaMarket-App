import { normalizeSearchTerm, expandSmartSearch, SmartSearchExpansion } from './fuzzy';

export interface SearchableItem {
  id: string;
  title: string;
  description?: string | null;
  district?: string | null;
  price?: number;
  created_at?: string;
  [key: string]: any;
}

/**
 * Calcule le score de pertinence d'une annonce selon l'expansion intelligente de recherche
 */
export function calculateRelevance(
  item: SearchableItem,
  queryOrClean: string,
  rawWords?: string[],
  expansion?: SmartSearchExpansion
): number {
  const exp = expansion ?? expandSmartSearch(queryOrClean);
  const primaryClean = rawWords ? queryOrClean : normalizeSearchTerm(exp.correctedQuery);
  const words = rawWords ?? exp.correctedQuery.split(/\s+/).map(normalizeSearchTerm).filter(Boolean);

  let score = 0;
  const titleClean = normalizeSearchTerm(item.title);
  const descClean = normalizeSearchTerm(item.description || '');
  const districtClean = normalizeSearchTerm(item.district || '');

  // 1. Titre exact ou contenant la requête complète
  if (titleClean === primaryClean) {
    score += 120;
  } else if (titleClean.includes(primaryClean)) {
    score += 80;
  }

  // 2. Mots clés individuels dans le titre
  let matchedCount = 0;
  for (const w of words) {
    if (titleClean.includes(w)) {
      matchedCount++;
      score += 35;
    } else if (descClean.includes(w)) {
      matchedCount += 0.5;
      score += 15;
    } else if (districtClean.includes(w)) {
      score += 10;
    }
  }

  // 3. Synonymes locaux dans le titre ou la description
  for (const synonym of exp.expandedTerms) {
    if (titleClean.includes(synonym)) {
      score += 25;
    } else if (descClean.includes(synonym)) {
      score += 10;
    }
  }

  // Bonus si tous les mots de la requête sont présents
  if (words.length > 1 && matchedCount >= words.length) {
    score += 40;
  }

  return score;
}

/**
 * Filtre et classe une liste d'annonces par pertinence selon la requête
 * et le mode de tri demandé
 */
export function rankFuzzySearchResults<T extends SearchableItem>(
  items: T[],
  query: string,
  sortBy: 'recent' | 'price_asc' | 'price_desc' = 'recent'
): T[] {
  const q = (query || '').trim();
  if (!q || items.length === 0) return items;

  const expansion = expandSmartSearch(q);
  const primaryClean = normalizeSearchTerm(expansion.correctedQuery);
  const rawWords = expansion.correctedQuery
    .split(/\s+/)
    .map(normalizeSearchTerm)
    .filter(Boolean);

  const scoredItems: { item: T; score: number }[] = [];

  for (const item of items) {
    const score = calculateRelevance(item, primaryClean, rawWords, expansion);
    // Filtrage strict : élimine les faux positifs sans rapport
    if (score > 0) {
      scoredItems.push({ item, score });
    }
  }

  // Tri par pertinence par défaut, sinon selon sortBy
  if (sortBy === 'price_asc') {
    scoredItems.sort((a, b) => (a.item.price ?? 0) - (b.item.price ?? 0));
  } else if (sortBy === 'price_desc') {
    scoredItems.sort((a, b) => (b.item.price ?? 0) - (a.item.price ?? 0));
  } else {
    // Tri combiné pertinence > récence
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = a.item.created_at ? new Date(a.item.created_at).getTime() : 0;
      const dateB = b.item.created_at ? new Date(b.item.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  return scoredItems.map((s) => s.item);
}
