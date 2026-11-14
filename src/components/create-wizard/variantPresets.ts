export interface PresetColor {
  name: string;
  code: string;
  border: boolean;
}

export interface DraftVariant {
  /** Présent pour une variante existante (édition) : à conserver tel quel. */
  id?: string;
  title: string;
  color?: string | null;
  color_code?: string | null;
  size?: string | null;
  price?: number | null;
  stock: number;
}

export const PRESET_COLORS: PresetColor[] = [
  { name: 'Noir', code: '#111827', border: false },
  { name: 'Blanc', code: '#FFFFFF', border: true },
  { name: 'Gris', code: '#6B7280', border: false },
  { name: 'Bleu', code: '#3B82F6', border: false },
  { name: 'Rouge', code: '#EF4444', border: false },
  { name: 'Vert', code: '#10B981', border: false },
  { name: 'Jaune', code: '#F59E0B', border: false },
  { name: 'Rose', code: '#EC4899', border: false },
  { name: 'Marron', code: '#78350F', border: false },
  { name: 'Beige', code: '#D6C7B2', border: true },
  { name: 'Orange', code: '#F97316', border: false },
  { name: 'Multicolore', code: '#EA580C', border: false },
];

export const PRESET_CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Unique'];
export const PRESET_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
export const PRESET_STORAGE_SIZES = ['64 Go', '128 Go', '256 Go', '512 Go', '1 To'];

export type MobileVariantTab = 'clothing_size' | 'shoe_size' | 'color' | 'combo' | 'custom';

/**
 * Suggère l'onglet d'options le plus adapté à la catégorie choisie par le vendeur.
 */
export function getRecommendedMobileVariantTab(category?: string): MobileVariantTab {
  if (category === 'fashion' || category === 'sports') return 'clothing_size';
  if (category === 'electronics') return 'custom';
  return 'color';
}

/**
 * Génère la liste des options simples ou combinées (Couleur · Taille/Pointure).
 */
export function buildMobileVariantCombinations(params: {
  colors: PresetColor[];
  sizes: string[];
  stockPerItem: number;
  basePriceNum: number | null;
}): DraftVariant[] {
  const safeStock = Math.max(1, Math.round(params.stockPerItem) || 1);
  const price = params.basePriceNum && params.basePriceNum >= 300 ? params.basePriceNum : null;

  if (params.colors.length > 0 && params.sizes.length > 0) {
    return params.colors.flatMap((color) =>
      params.sizes.map((size) => ({
        title: `${color.name} · ${size}`,
        color: color.name,
        color_code: color.code,
        size,
        price,
        stock: safeStock,
      }))
    );
  }

  if (params.colors.length > 0) {
    return params.colors.map((color) => ({
      title: color.name,
      color: color.name,
      color_code: color.code,
      size: null,
      price,
      stock: safeStock,
    }));
  }

  return params.sizes.map((size) => ({
    title: size,
    color: null,
    color_code: null,
    size,
    price,
    stock: safeStock,
  }));
}

/**
 * Ajoute des variantes sans créer de doublons sur le libellé.
 */
export function mergeMobileDraftVariants(
  existing: DraftVariant[],
  incoming: DraftVariant[]
): DraftVariant[] {
  const seen = new Set(existing.map((v) => v.title.trim().toLowerCase()));
  const additions = incoming.filter((v) => {
    const key = v.title.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...existing, ...additions];
}
