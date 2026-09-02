import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoritesService } from '@daloa/api';
import { Haptics } from '@daloa/utils';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  loading: boolean;
  refetchFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const ids = await favoritesService.getFavoriteIds(user.id);
      setFavoriteIds(new Set(ids));
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorited = useCallback((listingId: string) => favoriteIds.has(listingId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!user) return false;
      const currentlyFav = favoriteIds.has(listingId);
      Haptics.lightImpact();

      // MAJ optimiste
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (currentlyFav) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      try {
        if (currentlyFav) {
          await favoritesService.removeFavorite(user.id, listingId);
          return false;
        }
        await favoritesService.addFavorite(user.id, listingId);
        return true;
      } catch (err) {
        // Rollback en cas d'échec
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (currentlyFav) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        console.error('Erreur mise à jour favori:', err);
        return currentlyFav;
      }
    },
    [user, favoriteIds]
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isFavorited, toggleFavorite, loading, refetchFavorites: fetchFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites doit être utilisé dans un FavoritesProvider');
  }
  return context;
}
