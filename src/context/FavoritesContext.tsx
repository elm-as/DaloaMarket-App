import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoritesService, analyticsService } from '@daloa/api';
import { Haptics, SecureStorageAdapter } from '@daloa/utils';
import { useAuth } from './AuthContext';

const GUEST_FAVS_KEY = 'daloamarket_guest_favorites';

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
    setLoading(true);
    try {
      if (!user) {
        // Mode invité : lecture depuis le stockage local
        const saved = await SecureStorageAdapter.getItem(GUEST_FAVS_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setFavoriteIds(new Set(parsed));
              return;
            }
          } catch {
            // Ignorer JSON corrompu
          }
        }
        setFavoriteIds(new Set());
        return;
      }

      // Utilisateur connecté : récupérer depuis Supabase
      const serverIds = await favoritesService.getFavoriteIds(user.id);
      
      // Synchroniser d'éventuels favoris invités préalables
      const guestSaved = await SecureStorageAdapter.getItem(GUEST_FAVS_KEY);
      let merged = new Set(serverIds);
      if (guestSaved) {
        try {
          const guestIds: string[] = JSON.parse(guestSaved);
          if (Array.isArray(guestIds) && guestIds.length > 0) {
            for (const gId of guestIds) {
              if (!merged.has(gId)) {
                await favoritesService.addFavorite(user.id, gId).catch(() => {});
                merged.add(gId);
              }
            }
            await SecureStorageAdapter.removeItem(GUEST_FAVS_KEY);
          }
        } catch {
          // Ignorer
        }
      }

      setFavoriteIds(merged);
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorited = useCallback(
    (listingId: string) => favoriteIds.has(listingId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (listingId: string): Promise<boolean> => {
      const currentlyFav = favoriteIds.has(listingId);
      Haptics.lightImpact();

      // Mise à jour optimiste immédiate
      const next = new Set(favoriteIds);
      if (currentlyFav) next.delete(listingId);
      else next.add(listingId);
      setFavoriteIds(next);

      if (!user) {
        // Sauvegarde en local pour l'invité
        await SecureStorageAdapter.setItem(
          GUEST_FAVS_KEY,
          JSON.stringify(Array.from(next))
        );
        return !currentlyFav;
      }

      try {
        if (currentlyFav) {
          await favoritesService.removeFavorite(user.id, listingId);
          analyticsService.logEvent({ eventName: 'favorite_remove', userId: user.id, listingId });
          return false;
        }
        await favoritesService.addFavorite(user.id, listingId);
        analyticsService.logEvent({ eventName: 'favorite_add', userId: user.id, listingId });
        return true;
      } catch (err) {
        // Rollback en cas d'erreur réseau
        setFavoriteIds(favoriteIds);
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
