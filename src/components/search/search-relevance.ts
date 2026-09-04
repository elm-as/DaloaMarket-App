export interface SearchableListing {
  id: string;
  title: string;
  price: number;
  description?: string | null;
  district?: string | null;
  created_at?: string;
  [key: string]: any;
}

/**
 * Calcule le score de pertinence d'une annonce selon le mot-clé saisi.
 * Règles validées :
 * - Titre exact (insensible à la casse) : 100 points
 * - Titre contenant le mot entier ou commençant par le mot : 80 points
 * - Titre contenant le terme en sous-chaîne : 60 points
 * - Description contenant le terme : 30 points
 * - District contenant le terme : 20 points
 */
export function calculateRelevanceScore(listing: SearchableListing, normalizedQuery: string): number {
  const title = (listing.title || '').toLowerCase().trim();
  const desc = (listing.description || '').toLowerCase();
  const district = (listing.district || '').toLowerCase();

  if (title === normalizedQuery) return 100;

  // Mot entier délimité par espaces ou ponctuation
  const wordBoundaryRegex = new RegExp(`(^|[\\s-_./,;])${escapeRegex(normalizedQuery)}($|[\\s-_./,;])`, 'i');

  if (wordBoundaryRegex.test(title)) return 80;
  if (title.includes(normalizedQuery)) return 60;
  if (wordBoundaryRegex.test(desc)) return 35;
  if (desc.includes(normalizedQuery)) return 25;
  if (district.includes(normalizedQuery)) return 20;

  return 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Filtre et classe les annonces par pertinence selon la requête et le mode de tri.
 * Pour les termes courts (≤3 lettres ex: TV, PC, PS5), exclut les faux positifs
 * où la chaîne apparaît au milieu d'un mot non pertinent (ex: "ventilateur" pour "tv").
 */
export function filterAndRankListings(
  listings: SearchableListing[],
  searchQuery: string,
  sortBy: 'recent' | 'price_asc' | 'price_desc' = 'recent'
): SearchableListing[] {
  const q = searchQuery.toLowerCase().trim();

  let results = [...listings];

  if (q.length > 0) {
    const isShortQuery = q.length <= 3;
    const boundaryRegex = isShortQuery
      ? new RegExp(`(^|[\\s-_./,;])${escapeRegex(q)}($|[\\s-_./,;])`, 'i')
      : null;

    results = results.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const district = (item.district || '').toLowerCase();

      if (isShortQuery && boundaryRegex) {
        // Pour les termes courts, exiger la correspondance par mot entier
        return boundaryRegex.test(title) || boundaryRegex.test(desc) || boundaryRegex.test(district);
      }

      // Pour les termes normaux, inclusion insensible à la casse
      return title.includes(q) || desc.includes(q) || district.includes(q);
    });

    // Calcul et tri par score de pertinence si tri standard 'recent'
    if (sortBy === 'recent') {
      const scoredItems = results.map((item) => ({
        item,
        score: calculateRelevanceScore(item, q),
      }));

      scoredItems.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // En cas d'égalité de score, les plus récents en premier
        const dateA = a.item.created_at ? new Date(a.item.created_at).getTime() : 0;
        const dateB = b.item.created_at ? new Date(b.item.created_at).getTime() : 0;
        return dateB - dateA;
      });

      return scoredItems.map((s) => s.item);
    }
  }

  // Tri explicite par prix
  if (sortBy === 'price_asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'recent' && q.length === 0) {
    results.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  return results;
}
