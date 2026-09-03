import { useWindowDimensions } from 'react-native';

/**
 * Hook responsive réactif (basé sur useWindowDimensions, pas Dimensions.get figé).
 * Fournit des breakpoints et des utilitaires pour adapter grilles, colonnes et
 * largeurs de cartes aux smartphones Android (360 → 428px) et tablettes.
 */
export interface Responsive {
  /** Largeur actuelle de la fenêtre (réactive à la rotation / split-screen). */
  width: number;
  /** Hauteur actuelle de la fenêtre. */
  height: number;
  /** < 360px : très petit téléphone. */
  isSmallPhone: boolean;
  /** 360–599px : téléphone standard (cible principale). */
  isPhone: boolean;
  /** ≥ 600px : tablette / grand écran / pliable déplié. */
  isTablet: boolean;
  /** Nombre de colonnes recommandé pour une grille de cartes produit. */
  gridColumns: number;
  /** Largeur max du contenu centré sur grand écran (évite les lignes trop larges). */
  contentMaxWidth: number;
  /**
   * Calcule la largeur d'une carte pour `columns` colonnes en tenant compte
   * du padding horizontal et de l'espacement inter-cartes.
   */
  cardWidth: (columns?: number, horizontalPadding?: number, gap?: number) => number;
  /** Met à l'échelle une valeur selon la largeur (base 390px), bornée. */
  scale: (size: number, min?: number, max?: number) => number;
}

const BASE_WIDTH = 390; // référence iPhone 14 / Pixel standard

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 600;
  const isPhone = !isTablet;

  // 2 colonnes sur téléphone, 3 sur petite tablette, 4 sur grande tablette.
  const gridColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const contentMaxWidth = isTablet ? 720 : width;

  const cardWidth = (columns = gridColumns, horizontalPadding = 28, gap = 12) => {
    const available = Math.min(width, contentMaxWidth) - horizontalPadding;
    return (available - gap * (columns - 1)) / columns;
  };

  const scale = (size: number, min?: number, max?: number) => {
    const factor = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.15);
    const scaled = Math.round(size * factor * 10) / 10;
    if (min !== undefined && scaled < min) return min;
    if (max !== undefined && scaled > max) return max;
    return scaled;
  };

  return {
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    gridColumns,
    contentMaxWidth,
    cardWidth,
    scale,
  };
}
