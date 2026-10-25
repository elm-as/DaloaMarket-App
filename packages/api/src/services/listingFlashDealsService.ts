import { supabase } from '../supabase';
import { ListingFull } from '@daloa/types';

export const listingFlashDealsService = {
  /**
   * Récupère les offres flash et annonces sponsorisées en vedette de Daloa :
   * - Annonces actives avec photos
   * - Priorité 1 : Annonces boostées payantes (`boosted_until > now()`) ou promos (`original_price > price`)
   * - Fallback gracieux si aucune promo active : annonces récentes avec photos
   */
  async getFlashDeals(limit = 6): Promise<ListingFull[]> {
    const selectCols =
      '*, users:user_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating, pro_until, created_at)';
    const nowIso = new Date().toISOString();

    try {
      // 1. Annonces boostées ou en réduction (original_price > price)
      const { data, error } = await supabase
        .from('listings')
        .select(selectCols)
        .eq('status', 'active')
        .not('photos', 'eq', '{}')
        .or(`boosted_until.gt.${nowIso},original_price.gt.0`)
        .order('boosted_until', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          seller: item.users || null,
          variants: Array.isArray(item.variants) ? item.variants : [],
        }));
      }
    } catch {
      // Fallback
    }

    // 2. Fallback gracieux : annonces actives récentes avec photos
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(selectCols)
        .eq('status', 'active')
        .not('photos', 'eq', '{}')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          seller: item.users || null,
          variants: Array.isArray(item.variants) ? item.variants : [],
        }));
      }
    } catch {
      // Échec silencieux
    }

    return [];
  },
};
