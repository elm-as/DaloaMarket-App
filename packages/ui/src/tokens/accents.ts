import { colors } from './colors';

/**
 * Accents par application.
 *
 * DÉCISION (14/09/2026) : les deux applications partagent le même orange
 * `#FF9800`, qui est la valeur exacte utilisée par les deux sites web en
 * production (DaloaMarket-v2 et DaloaDelivery). Une identité unique évite de
 * désorienter les utilisateurs qui connaissent déjà le web.
 *
 * Historique : `delivery` valait auparavant un cyan `#06B6D4`, jamais déployé
 * sur le web. Cohabitaient donc quatre valeurs (#FF9800 web, #FF7F00 tokens,
 * #FF6B00 barre d'onglets mobile, #06B6D4 accent). Tout est ramené sur #FF9800.
 *
 * Les composants de @daloa/ui lisent l'accent via `useAccent()` / `useTheme()`.
 * Le mécanisme reste en place : si les deux apps doivent un jour se
 * différencier, il suffit de redéfinir `delivery` ici.
 */

export const accents = {
  market: colors.primary,
  delivery: colors.primary,
};

export type AccentName = keyof typeof accents;
/** Forme d'une échelle d'accent (DEFAULT + 50…900). */
export type AccentScale = typeof colors.primary;
