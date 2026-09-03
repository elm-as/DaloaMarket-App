import { supabase } from '../supabase';
import { ListingFull, ListingFilters, ListingCreateInput, ListingVariant } from '@daloa/types';

export const listingsService = {
  /**
   * Récupère la liste des annonces avec pagination et filtres
   */
  async getListings(
    filters: ListingFilters = {},
    page = 0,
    pageSize = 20
  ): Promise<{ data: ListingFull[]; hasMore: boolean }> {
    let query = supabase
      .from('listings')
      .select('*, users:user_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, pro_until, created_at)', { count: 'exact' })
      .eq('status', filters.status || 'active');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.district) {
      query = query.eq('district', filters.district);
    }
    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters.minPrice != null) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice != null) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.acceptsDeliveryOnly) {
      query = query.eq('accepts_delivery', true);
    }
    if (filters.sellerId) {
      query = query.eq('user_id', filters.sellerId);
    }
    if (filters.boostedOnly) {
      query = query.not('boosted_until', 'is', null).gt('boosted_until', new Date().toISOString());
    }
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const term = filters.searchQuery.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,district.ilike.%${term}%`);
    }

    // Tri
    if (filters.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (filters.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (filters.sortBy === 'popularity') {
      query = query.order('view_count', { ascending: false });
    } else {
      // Par défaut : tri chronologique inversé (nouveautés en premier)
      query = query.order('created_at', { ascending: false });
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    const formattedData: ListingFull[] = (data || []).map((item: any) => ({
      ...item,
      seller: item.users || null,
      variants: Array.isArray(item.variants) ? item.variants : [],
    }));

    const hasMore = count != null ? from + formattedData.length < count : formattedData.length === pageSize;

    return { data: formattedData, hasMore };
  },

  /**
   * Récupère une annonce complète par son ID
   */
  async getListingById(id: string): Promise<ListingFull> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, users:user_id(id, full_name, phone, avatar_url, shop_name, shop_description, shop_logo_url, shop_banner_url, shop_slug, district, rating, pro_until, created_at)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Annonce introuvable');

    return {
      ...data,
      seller: data.users || null,
      variants: Array.isArray(data.variants) ? data.variants : [],
    };
  },

  /**
   * Récupère des annonces similaires basées sur la catégorie
   */
  /**
   * Récupère un pool de candidats de la même catégorie pour l'algorithme de
   * similarité (scoré et diversifié côté client via findSimilar). Le pool est
   * volontairement large (limit ~30) pour donner de la matière au re-ranking.
   */
  async getSimilarListings(category: string, currentId: string, limit = 30): Promise<ListingFull[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, users:user_id(id, full_name, phone, avatar_url, shop_name, rating, pro_until)')
      .eq('category', category)
      .eq('status', 'active')
      .neq('id', currentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];

    return (data || []).map((item: any) => ({
      ...item,
      seller: item.users || null,
    }));
  },

  /**
   * Crée une nouvelle annonce avec variantes optionnelles
   */
  async createListing(userId: string, input: ListingCreateInput): Promise<ListingFull> {
    const listingPayload = {
      user_id: userId,
      title: input.title,
      description: input.description,
      price: input.price,
      original_price: input.original_price || null,
      category: input.category,
      condition: input.condition,
      district: input.district,
      photos: input.photos,
      stock: input.stock,
      variants: input.variants || [],
      status: 'active',
      view_count: 0,
    };

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(listingPayload)
      .select()
      .single();

    if (error) throw error;

    return this.getListingById(listing.id);
  },

  /**
   * Met à jour une annonce
   */
  async updateListing(
    listingId: string,
    updates: Partial<ListingCreateInput>
  ): Promise<ListingFull> {
    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId);

    if (error) throw error;

    return this.getListingById(listingId);
  },

  /**
   * Supprime une annonce de façon sécurisée
   */
  async deleteListing(listingId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('delete_listing_secure', {
        p_listing_id: listingId,
      });
      if (!error && data?.success) return;
    } catch {
      // Fallback si RPC non disponible
    }

    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) throw error;
  },

  /**
   * Téléverse une photo vers Supabase Storage
   */
  async uploadImage(uri: string, folder = 'listings'): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      const { data, error } = await supabase.storage.from('listings').upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('listings').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Erreur upload image:', err);
      throw err;
    }
  },

  /**
   * Booster une annonce (tente d'abord le slot gratuit Pro ou applique l'expiration)
   */
  async boostListing(listingId: string, durationDays = 7): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('free_boost_listing', {
        p_listing_id: listingId,
      });
      if (!error && data?.success) return;
    } catch {
      // Poursuivre avec fallback si RPC non disponible
    }

    const boostedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('listings')
      .update({ boosted_until: boostedUntil })
      .eq('id', listingId);

    if (error) throw error;
  },

  /**
   * Bump une annonce en tête de liste
   */
  async bumpListing(listingId: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .update({ created_at: new Date().toISOString() })
      .eq('id', listingId);

    if (error) throw error;
  },
};
