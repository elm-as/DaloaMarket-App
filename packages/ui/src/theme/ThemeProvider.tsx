import React, { createContext, useContext, useMemo } from 'react';
import { accents, AccentName, AccentScale } from '../tokens';

/**
 * Thème par application — injecte l'accent (orange Market / cyan Delivery)
 * à tout l'arbre. Les composants @daloa/ui appellent `useAccent()` au lieu de
 * coder `colors.primary` en dur, ce qui leur donne automatiquement la bonne DA.
 *
 * Chaque app pose UNE fois, à la racine :
 *   <ThemeProvider app="market"> … </ThemeProvider>   (DaloaMarket)
 *   <ThemeProvider app="delivery"> … </ThemeProvider>  (DaloaDelivery)
 */

export interface Theme {
  accent: AccentScale;
  accentName: AccentName;
}

const ThemeContext = createContext<Theme>({
  accent: accents.market,
  accentName: 'market',
});

export interface ThemeProviderProps {
  app: AccentName;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ app, children }) => {
  const value = useMemo<Theme>(
    () => ({ accent: accents[app], accentName: app }),
    [app]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Accès au thème complet ({ accent, accentName }). */
export const useTheme = (): Theme => useContext(ThemeContext);

/** Raccourci : l'échelle d'accent de l'app courante. */
export const useAccent = (): AccentScale => useContext(ThemeContext).accent;
