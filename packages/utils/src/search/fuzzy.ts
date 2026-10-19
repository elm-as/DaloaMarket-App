import { LOCAL_SYNONYMS_MAP, COMMON_TYPOS_MAP } from './synonyms';

/**
 * Normalise un terme en supprimant les accents, la ponctuation et en minuscules
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return '';
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .trim();
}

/**
 * Calcule la distance de Levenshtein entre deux mots
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Corrige un mot unique en vérifiant les fautes courantes puis la distance Levenshtein
 */
export function correctSingleWord(word: string): { corrected: string; wasCorrected: boolean } {
  const cleaned = normalizeSearchTerm(word);
  if (!cleaned || cleaned.length < 2) return { corrected: word, wasCorrected: false };

  // 1. Dictionnaire direct des fautes courantes à Daloa
  if (COMMON_TYPOS_MAP[cleaned]) {
    return { corrected: COMMON_TYPOS_MAP[cleaned], wasCorrected: true };
  }

  // 2. Déjà un mot valide dans le dictionnaire
  if (LOCAL_SYNONYMS_MAP[cleaned]) {
    return { corrected: cleaned, wasCorrected: false };
  }

  // 3. Rapprochement par distance de Levenshtein (seuil tolérant de 1 à 2 lettres)
  const allKnownTerms = Array.from(
    new Set([...Object.keys(LOCAL_SYNONYMS_MAP), ...Object.values(LOCAL_SYNONYMS_MAP).flat()])
  );

  let bestMatch = cleaned;
  let minDistance = Infinity;

  for (const candidate of allKnownTerms) {
    if (Math.abs(candidate.length - cleaned.length) > 2) continue;
    const dist = computeLevenshteinDistance(cleaned, candidate);
    const maxAllowed = cleaned.length >= 5 ? 2 : 1;
    if (dist <= maxAllowed && dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  if (minDistance <= (cleaned.length >= 5 ? 2 : 1) && bestMatch !== cleaned) {
    return { corrected: bestMatch, wasCorrected: true };
  }

  return { corrected: word, wasCorrected: false };
}

export interface SmartSearchExpansion {
  originalQuery: string;
  correctedQuery: string;
  isCorrected: boolean;
  didYouMeanText: string | null;
  expandedTerms: string[];
  suggestedCategory: string | null;
}

/**
 * Analyse une requête de recherche utilisateur et produit une expansion intelligente :
 * correction orthographique + synonymes locaux ivoiriens.
 */
export function expandSmartSearch(rawQuery: string): SmartSearchExpansion {
  const originalQuery = (rawQuery || '').trim();
  if (!originalQuery) {
    return {
      originalQuery: '',
      correctedQuery: '',
      isCorrected: false,
      didYouMeanText: null,
      expandedTerms: [],
      suggestedCategory: null,
    };
  }

  const rawWords = originalQuery.split(/\s+/).filter(Boolean);
  const correctedWords: string[] = [];
  let hasAnyCorrection = false;
  const wordExpansions: string[][] = [];

  for (const w of rawWords) {
    const { corrected, wasCorrected } = correctSingleWord(w);
    correctedWords.push(corrected);
    if (wasCorrected) hasAnyCorrection = true;

    const cleaned = normalizeSearchTerm(corrected);
    const synonyms = LOCAL_SYNONYMS_MAP[cleaned] || [];
    // Inclure le mot corrigé + jusqu'à 4 synonymes pertinents
    const directGroup = [cleaned, ...synonyms.slice(0, 4)];
    wordExpansions.push(directGroup);
  }

  const correctedQuery = correctedWords.join(' ');
  const didYouMeanText = hasAnyCorrection ? correctedQuery : null;
  const expandedTerms = Array.from(new Set(wordExpansions.flat())).filter((t) => t.length >= 2);

  // Détection automatique de la catégorie suggérée
  let suggestedCategory: string | null = null;
  const mainTerm = normalizeSearchTerm(correctedWords[0] || '');

  if (
    ['iphone', 'samsung', 'tecno', 'infinix', 'itel', 'xiaomi', 'telephone', 'smartphone', 'tel', 'chargeur', 'ecouteurs', 'ordinateur', 'pc', 'laptop'].includes(
      mainTerm
    )
  ) {
    suggestedCategory = 'electronics';
  } else if (
    ['moto', 'jakarta', 'scooter', 'sanili', 'apsonic', 'voiture', 'engin', 'casque'].includes(
      mainTerm
    )
  ) {
    suggestedCategory = 'vehicles';
  } else if (
    ['frigo', 'refrigerateur', 'congelateur', 'tv', 'television', 'gaz', 'gaziniere', 'cuisiniere', 'matelas', 'ventilateur', 'clim'].includes(
      mainTerm
    )
  ) {
    suggestedCategory = 'home';
  } else if (
    ['pagne', 'wax', 'mouchoir', 'robe', 'complet', 'ensemble', 'habit', 'vetement', 'chaussure', 'chaussures', 'baskets', 'claquettes', 'sandales', 'tape-cul', 'meches', 'perruque', 'pommade'].includes(
      mainTerm
    )
  ) {
    suggestedCategory = 'fashion';
  }

  return {
    originalQuery,
    correctedQuery,
    isCorrected: hasAnyCorrection,
    didYouMeanText,
    expandedTerms,
    suggestedCategory,
  };
}
