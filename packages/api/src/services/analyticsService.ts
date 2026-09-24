import { supabase } from '../supabase';
import type { Json } from '@daloa/types';

/**
 * Journalisation comportementale côté serveur (table `events`).
 *
 * C'est la fondation du ML : sans ces logs persistés, aucun modèle ne peut être
 * entraîné. Contrairement au tracking localStorage (éphémère, par-appareil), ces
 * signaux sont durables et cross-device.
 *
 * Règle d'or : l'analytics ne doit JAMAIS casser l'UX — tout est fire-and-forget
 * et n'échoue jamais visiblement.
 */

export type EventName =
  | 'listing_view'
  | 'listing_click'
  | 'search'
  | 'favorite_add'
  | 'favorite_remove'
  | 'add_to_cart'
  | 'contact_seller'
  | 'checkout_start'
  | 'purchase';

interface LogEventArgs {
  eventName: EventName;
  userId?: string | null;
  listingId?: string | null;
  props?: Record<string, unknown>;
}

export const analyticsService = {
  /**
   * Enregistre une interaction. Fire-and-forget : n'attend pas, n'échoue jamais.
   */
  logEvent({ eventName, userId, listingId, props }: LogEventArgs): void {
    void supabase
      .from('events')
      .insert({
        event_name: eventName,
        user_id: userId ?? null,
        listing_id: listingId ?? null,
        props: (props ?? {}) as Json,
      })
      .then(({ error }) => {
        if (error && typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[analytics] logEvent échoué:', eventName, error.message);
        }
      });
  },
  /**
   * Incrémente le compteur de vues d'une annonce (RPC Supabase increment_listing_views).
   * Protège contre les vues en doublon par viewer/24h et n'échoue jamais de façon bloquante.
   */
  async incrementListingViews(listingId: string, viewerId?: string | null): Promise<void> {
    try {
      const vid = viewerId || `anon_${Math.random().toString(36).substring(2, 12)}`;
      await supabase.rpc('increment_listing_views', {
        p_listing_id: listingId,
        p_viewer_id: vid,
      });
    } catch (e: unknown) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[analytics] increment_listing_views échoué:', e);
      }
    }
  },
};

declare const __DEV__: boolean | undefined;
