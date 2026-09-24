import { supabase } from '../supabase';
import { attachContactPhones } from '../lib/contacts';
import { rpcOutcome } from '../lib/rpc';
import { decodeBase64ToArrayBuffer } from '../lib/base64';
import { ListingFull, ListingFilters, ListingCreateInput, ListingVariant, Json } from '@daloa/types';
import { generateUuidV4 } from '@daloa/utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Champs d'annonce communs à la création et à la modification, alignés sur le
 * web (`ListingCreatePage`) :
 *  - chaque variante a un `id` UUID (conservé s'il existe) : le panier, le
 *    paiement et le stock retrouvent la variante par cet `id`. L'app créait des
 *    variantes sans `id`, impossibles à acheter ;
 *  - avec des variantes, le stock de l'annonce est la somme de leurs stocks.
 */
function listingContentFields(input: ListingCreateInput) {
  const variants = (input.variants || []).map((v) => ({
    id: v.id || generateUuidV4(),
    label: v.label,
    price: v.price ?? null,
    stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
    active: v.active !== false,
  }));
  const stock = variants.length > 0
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : Math.max(1, Math.floor(input.stock || 1));

  return {
    title: input.title,
    description: input.description,
    price: input.price,
    original_price: input.original_price || null,
    category: input.category,
    condition: input.condition,
    district: input.district,
    photos: input.photos,
    stock,
    variants: variants as unknown as Json,
  };
}

export const listingsService = {
  /**
   * Récupère la liste des annonces avec pagination et filtres
   */
  async getListings(
    filters: ListingFilters = {},
    page = 0,
    pageSize = 30
  ): Promise<{ data: ListingFull[]; hasMore: boolean; totalCount?: number }> {
    let query = supabase
      .from('listings')
      .select('*, users:user_id(id, full_name, avatar_url, shop_name, shop_slug, district, rating, pro_until, created_at)', { count: 'exact' })
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
    // `acceptsDeliveryOnly` est ignoré : la colonne `accepts_delivery`
    // n'existe pas (le filtre faisait échouer toute la requête).
    if (filters.sellerId) {
      query = query.eq('user_id', filters.sellerId);
    }
    if (filters.boostedOnly) {
      query = query.not('boosted_until', 'is', null).gt('boosted_until', new Date().toISOString());
    }
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const term = filters.searchQuery.trim();
      if (term.length <= 3) {
        // Pour les termes courts (ex: TV, PC), on privilégie le titre pour éliminer le bruit en description
        query = query.or(`title.ilike.%${term}%,district.ilike.%${term}%`);
      } else {
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,district.ilike.%${term}%`);
      }
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
      // sort_at = COALESCE(bumped_at, created_at) : une annonce bumpee remonte
      // sans que sa date de publication reelle soit reecrite.
      query = query.order('sort_at', { ascending: false });
    }

    const from = page * pageSize;
    const to = from + pageSize;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let data: any[] | null = null;
    let error: any = null;
    let totalCount: number | undefined = undefined;

    try {
      const res = await query.range(from, to).abortSignal(controller.signal);
      data = res.data;
      error = res.error;
      if (typeof res.count === 'number') {
        totalCount = res.count;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (error) throw error;

    const rawList = data || [];
    const hasMore = rawList.length > pageSize;
    const pageItems = hasMore ? rawList.slice(0, pageSize) : rawList;

    const formattedData: ListingFull[] = pageItems.map((item: any) => ({
      ...item,
      seller: item.users || null,
      variants: Array.isArray(item.variants) ? item.variants : [],
    }));

    return { data: formattedData, hasMore, totalCount };
  },

  /**
   * Récupère une annonce complète par son ID (supporte UUID complet ou préfixe court /l/c14e460e)
   */
  async getListingById(id: string): Promise<ListingFull> {
    const selectCols =
      '*, users:user_id(id, full_name, avatar_url, shop_name, shop_description, shop_logo_url, shop_banner_url, shop_slug, district, shop_latitude, shop_longitude, rating, pro_until, created_at)';

    let data: any = null;

    if (UUID_REGEX.test(id)) {
      const res = await supabase.from('listings').select(selectCols).eq('id', id).maybeSingle();
      if (res.error) throw res.error;
      data = res.data;
    } else {
      const cleanHex = (id.split('-').pop() || id).toLowerCase().replace(/[^a-f0-9]/g, '');
      if (cleanHex.length >= 4 && cleanHex.length < 32) {
        const minRaw = cleanHex.padEnd(32, '0');
        const maxRaw = cleanHex.padEnd(32, 'f');
        const minUuid = `${minRaw.slice(0, 8)}-${minRaw.slice(8, 12)}-${minRaw.slice(12, 16)}-${minRaw.slice(16, 20)}-${minRaw.slice(20, 32)}`;
        const maxUuid = `${maxRaw.slice(0, 8)}-${maxRaw.slice(8, 12)}-${maxRaw.slice(12, 16)}-${maxRaw.slice(16, 20)}-${maxRaw.slice(20, 32)}`;

        const res = await supabase
          .from('listings')
          .select(selectCols)
          .gte('id', minUuid)
          .lte('id', maxUuid)
          .neq('status', 'deleted')
          .limit(1)
          .maybeSingle();

        if (res.data) data = res.data;
      }
    }

    if (!data) throw new Error('Annonce introuvable');

    // Téléphone du vendeur (bouton WhatsApp) : public tant qu'il a une annonce en ligne.
    await attachContactPhones([data.users]);

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
      .select('*, users:user_id(id, full_name, avatar_url, shop_name, rating, pro_until)')
      .eq('category', category)
      .eq('status', 'active')
      .neq('id', currentId)
      .order('sort_at', { ascending: false })
      .limit(limit);

    if (error) return [];

    return (data || []).map((item: any) => ({
      ...item,
      seller: item.users || null,
    }));
  },

  /**
   * Modifie une annonce existante (mêmes champs que la création).
   *
   * Le statut, les vues et le boost ne sont pas touchés : ils sont protégés par
   * `protect_listings_columns` et gérés par leurs propres RPC.
   */
  async updateListing(listingId: string, input: ListingCreateInput): Promise<ListingFull> {
    const { error } = await supabase
      .from('listings')
      .update(listingContentFields(input))
      .eq('id', listingId);

    if (error) throw error;
    return this.getListingById(listingId);
  },

  /**
   * Crée une nouvelle annonce avec variantes optionnelles
   */
  async createListing(userId: string, input: ListingCreateInput): Promise<ListingFull> {
    const listingPayload = {
      user_id: userId,
      ...listingContentFields(input),
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
   * Supprime une annonce de façon sécurisée
   */
  async deleteListing(listingId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('delete_listing_secure', {
        p_listing_id: listingId,
      });
      if (!error && rpcOutcome(data)?.success) return;
    } catch {
      // Fallback si RPC non disponible
    }

    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) throw error;
  },

  /**
   * Téléverse une photo d'annonce vers Supabase Storage (bucket `listings`).
   *
   * `fetch(uri).blob()` ne fonctionne pas de façon fiable en React Native : sur une
   * URI locale (`file://`, `content://`) le corps remonte vide ou tronqué, et rien
   * n'atterrit dans le bucket. `authService.uploadAvatar` avait déjà été migré vers
   * un ArrayBuffer pour cette raison ; on fait de même ici. Le `base64` fourni par
   * `expo-image-picker` (`base64: true`) est le chemin nominal sur mobile ; le repli
   * `fetch().blob()` ne sert plus qu'au web, où il est correct.
   */
  async uploadImage(
    input: string | { uri: string; base64?: string | null; mimeType?: string | null },
    folder = 'general'
  ): Promise<string> {
    const photo = typeof input === 'string' ? { uri: input } : input;
    const uri = photo.uri;
    const base64 = 'base64' in photo ? photo.base64 : null;

    let contentType = ('mimeType' in photo && photo.mimeType) || '';
    let body: ArrayBuffer | Blob;

    if (base64) {
      body = decodeBase64ToArrayBuffer(base64);
      if (!contentType) {
        contentType = uri.toLowerCase().endsWith('.png')
          ? 'image/png'
          : uri.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
      }
    } else {
      const response = await fetch(uri);
      const blob = await response.blob();
      if (!blob.size) {
        throw new Error(
          "La photo n'a pas pu être lue sur l'appareil. Reprenez-la puis réessayez."
        );
      }
      body = blob;
      contentType = contentType || blob.type || 'image/jpeg';
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage.from('listings').upload(filename, body, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('Erreur upload image:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from('listings').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },

  /**
   * Booste une annonce en dépensant des crédits (1 jour = 1, 2 jours = 2,
   * 7 jours = 5), via la RPC qui débite le solde et prolonge `boosted_until`.
   *
   * Remplace `boostListing`, jamais appelé, dont le repli écrivait
   * `boosted_until` directement : colonne protégée, écriture annulée en silence.
   */
  async boostWithCredits(
    listingId: string,
    durationDays: 1 | 2 | 7
  ): Promise<{ boostedUntil: string; newBalance: number }> {
    const { data, error } = await supabase.rpc('buy_boost_with_credits', {
      p_listing_id: listingId,
      p_duration_days: durationDays,
    });
    if (error) throw error;

    const res = data as
      | { success?: boolean; reason?: string; boosted_until?: string; new_balance?: number; cost?: number; balance?: number }
      | null;
    if (!res?.success) {
      const messages: Record<string, string> = {
        insufficient_credits: `Crédits insuffisants (${res?.balance ?? 0} disponible${(res?.balance ?? 0) > 1 ? 's' : ''}, ${res?.cost ?? '?'} nécessaires).`,
        unauthorized: "Cette annonce n'est pas la vôtre.",
        listing_not_found: 'Annonce introuvable.',
        invalid_duration: 'Durée de boost invalide.',
      };
      throw new Error(messages[res?.reason || ''] || 'Boost impossible.');
    }
    return { boostedUntil: res.boosted_until || '', newBalance: res.new_balance ?? 0 };
  },

  /**
   * Marque une annonce comme vendue.
   *
   * Passe par la RPC : `listings.status` est protégé contre les écritures directes
   * des clients (`protect_listings_columns`), un `.update()` ne changeait rien tout
   * en ne renvoyant aucune erreur.
   */
  async markListingAsSold(listingId: string): Promise<void> {
    const { data, error } = await supabase.rpc('mark_listing_as_sold', {
      p_listing_id: listingId,
    });

    if (error) throw error;
    const sold = rpcOutcome(data);
    if (sold && sold.success === false) {
      throw new Error(sold.reason || 'Impossible de marquer cette annonce comme vendue.');
    }
  },

  /**
   * Remet en vente une annonce précédemment vendue
   */
  /**
   * Remet une annonce en vente.
   *
   * Le stock est obligatoire : le trigger `manage_listing_stock_on_order` met
   * `stock` à 0 en même temps qu'il passe l'annonce en `sold`. Repasser le seul
   * `status` à `active` laissait l'annonce visible dans le fil, ajoutable au panier,
   * puis éjectée en « rupture de stock » à l'ouverture du panier.
   *
   * Passe par une RPC pour la même raison que `markListingAsSold` : `status` est
   * protégé côté base. Le serveur recalcule le stock total depuis les variantes.
   *
   * `variantStocks` est indexé par `variant.id`, ou par la position de la variante
   * quand l'id est absent — la feuille de restock construit sa clé de la même façon.
   */
  async markListingAsActive(
    listingId: string,
    stock: number,
    variantStocks?: Record<string, number>
  ): Promise<void> {
    let variants: ListingVariant[] | null = null;

    if (variantStocks && Object.keys(variantStocks).length > 0) {
      const { data: current, error: readErr } = await supabase
        .from('listings')
        .select('variants')
        .eq('id', listingId)
        .single();

      if (readErr) throw readErr;

      variants = ((current?.variants as unknown as ListingVariant[]) || []).map((v, i) => ({
        ...v,
        stock: variantStocks[v.id ?? String(i)] ?? v.stock ?? 0,
      }));
    }

    const { data, error } = await supabase.rpc('relist_listing', {
      p_listing_id: listingId,
      p_stock: Math.max(1, Math.floor(stock || 0)),
      p_variants: (variants ?? null) as unknown as Json,
    });

    if (error) throw error;
    const relisted = rpcOutcome(data);
    if (relisted && relisted.success === false) {
      throw new Error(
        relisted.reason === 'stock_required'
          ? 'Indiquez au moins une unité en stock.'
          : relisted.reason || 'Remise en vente impossible.'
      );
    }
  },
};
