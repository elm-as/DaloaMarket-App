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
      .select('*, users:user_id(id, full_name, phone, avatar_url, shop_name, shop_slug, district, rating, review_count, pro_until, cash_on_delivery_enabled, created_at), listing_variants(*)', { count: 'exact' })
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
      query = query.order('views_count', { ascending: false });
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
      variants: item.listing_variants || [],
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
      .select('*, users:user_id(id, full_name, phone, avatar_url, shop_name, shop_description, shop_logo_url, shop_banner_url, shop_slug, district, rating, review_count, pro_until, cash_on_delivery_enabled, created_at), listing_variants(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Annonce introuvable');

    // Incrémenter le compteur de vues silencieusement
    supabase
      .from('listings')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', id)
      .then();

    return {
      ...data,
      seller: data.users || null,
      variants: data.listing_variants || [],
    };
  },

  /**
   * Récupère des annonces similaires basées sur la catégorie
   */
  async getSimilarListings(category: string, currentId: string, limit = 6): Promise<ListingFull[]> {
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
      accepts_delivery: input.accepts_delivery,
      delivery_fee_override: input.delivery_fee_override || null,
      status: 'active',
      views_count: 0,
      favorites_count: 0,
    };

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(listingPayload)
      .select()
      .single();

    if (error) throw error;

    // Insertion des variants si existants
    if (input.variants && input.variants.length > 0) {
      const variantsToInsert = input.variants.map((v) => ({
        listing_id: listing.id,
        label: v.label,
        color: v.color || null,
        color_code: v.color_code || null,
        size: v.size || null,
        price: v.price || null,
        stock: v.stock || 1,
        active: true,
      }));

      await supabase.from('listing_variants').insert(variantsToInsert);
    }

    return this.getListingById(listing.id);
  },

  /**
   * Met à jour une annonce
   */
  async updateListing(
    listingId: string,
    updates: Partial<ListingCreateInput>
  ): Promise<ListingFull> {
    const { variants, ...listingUpdates } = updates;

    const { error } = await supabase
      .from('listings')
      .update(listingUpdates)
      .eq('id', listingId);

    if (error) throw error;

    // Mettre à jour les variants si fournis
    if (variants) {
      await supabase.from('listing_variants').delete().eq('listing_id', listingId);
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v) => ({
          listing_id: listingId,
          label: v.label,
          color: v.color || null,
          color_code: v.color_code || null,
          size: v.size || null,
          price: v.price || null,
          stock: v.stock || 1,
          active: true,
        }));
        await supabase.from('listing_variants').insert(variantsToInsert);
      }
    }

    return this.getListingById(listingId);
  },

  /**
   * Supprime une annonce
   */
  async deleteListing(listingId: string): Promise<void> {
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
   * Booster une annonce pendant 7 jours
   */
  async boostListing(listingId: string): Promise<void> {
    const boostedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
