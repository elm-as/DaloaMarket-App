import { supabase } from '../supabase';

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
        props: props ?? {},
      })
      .then(({ error }) => {
        if (error && __DEV__) {
          console.warn('[analytics] logEvent échoué:', eventName, error.message);
        }
      });
  },
};

declare const __DEV__: boolean;
