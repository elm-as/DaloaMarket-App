import { supabase } from '../supabase';
import { rpcOutcome } from '../lib/rpc';
import { ListingVariant, Json } from '@daloa/types';

/**
 * Service gérant le cycle de vie d'une annonce (Boost crédits, Marquage Vendu, Remise en vente)
 */
export const listingActionsService = {
  /**
   * Booste une annonce en dépensant des crédits (1 jour = 1, 2 jours = 2, 7 jours = 5)
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
      | {
          success?: boolean;
          reason?: string;
          boosted_until?: string;
          new_balance?: number;
          cost?: number;
          balance?: number;
        }
      | null;

    if (!res?.success) {
      const messages: Record<string, string> = {
        insufficient_credits: `Crédits insuffisants (${res?.balance ?? 0} disponible${
          (res?.balance ?? 0) > 1 ? 's' : ''
        }, ${res?.cost ?? '?'} nécessaires).`,
        unauthorized: "Cette annonce n'est pas la vôtre.",
        listing_not_found: 'Annonce introuvable.',
        invalid_duration: 'Durée de boost invalide.',
      };
      throw new Error(messages[res?.reason || ''] || 'Boost impossible.');
    }
    return { boostedUntil: res.boosted_until || '', newBalance: res.new_balance ?? 0 };
  },

  /**
   * Marque une annonce comme vendue via la RPC sécurisée
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
   * Remet en vente une annonce précédemment vendue avec mise à jour du stock
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
