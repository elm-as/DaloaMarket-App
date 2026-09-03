import { colors } from './colors';

/**
 * Accents par application — la DA propre à chaque app.
 *
 * DaloaMarket  → orange chaleureux (marketplace, shopping)
 * DaloaDelivery→ cyan électrique  (outil de livraison, logistique)
 *
 * Les composants de @daloa/ui lisent l'accent via `useAccent()` / `useTheme()`
 * (voir theme/ThemeProvider). Le même composant rend donc orange dans Market
 * et cyan dans Delivery, sans code dupliqué.
 */

/** Échelle cyan DaloaDelivery (base #06B6D4). */
const cyan = {
  DEFAULT: '#06B6D4',
  50: '#ECFEFF',
  100: '#CFFAFE',
  200: '#A5F3FC',
  300: '#67E8F9',
  400: '#22D3EE',
  500: '#06B6D4',
  600: '#0891B2',
  700: '#0E7490',
  800: '#155E75',
  900: '#164E63',
};

export const accents = {
  market: colors.primary, // orange (échelle déjà définie dans colors)
  delivery: cyan,
};

export type AccentName = keyof typeof accents;
/** Forme d'une échelle d'accent (DEFAULT + 50…900). */
export type AccentScale = typeof colors.primary;
