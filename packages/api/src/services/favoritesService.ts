import { ListingFull } from '@daloa/types';
import { supabase } from '../supabase';

/**
 * Favoris acheteur — table `favorites (user_id, listing_id)`.
 * Aligné sur l'implémentation web DaloaMarket.
 */
export const favoritesService = {
  /** Renvoie l'ensemble des ids d'annonces mises en favori par l'utilisateur. */
  async getFavoriteIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((row: any) => row.listing_id);
  },

  /** Renvoie les annonces complètes mises en favori (pour l'écran Favoris). */
  async getFavoriteListings(userId: string): Promise<ListingFull[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select(
        'listing:listing_id(*, users:user_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, pro_until, created_at))'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || [])
      .map((row: any) => row.listing)
      .filter(Boolean)
      .map((item: any) => ({
        ...item,
        seller: item.users || null,
        variants: Array.isArray(item.variants) ? item.variants : [],
      }));
  },

  async addFavorite(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: userId, listing_id: listingId }, { onConflict: 'user_id,listing_id' });
    if (error) throw error;
  },

  async removeFavorite(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    if (error) throw error;
  },

  /** Récupère les annonces complètes pour une liste d'identifiants (utilisé pour les favoris invités) */
  async getListingsByIds(ids: string[]): Promise<ListingFull[]> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('listings')
      .select('*, users:user_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, pro_until, created_at)')
      .in('id', ids);

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      seller: item.users || null,
      variants: Array.isArray(item.variants) ? item.variants : [],
    }));
  },
};
