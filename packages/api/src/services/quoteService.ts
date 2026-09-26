import { ENV_CONFIG } from '@daloa/config';
import { supabase } from '../supabase';

/**
 * Devis de commande calculé par le serveur (Railway, `POST /quote`).
 *
 * C'est le seul prix qui fait foi : l'écran l'affiche tel quel, puis le
 * paiement en ligne (`quoteId` → `/create-payment`) ou à la livraison
 * (`p_quote_id` → `create_cod_order`) facture exactement ce devis. Le calcul
 * local (`calculateOrderBreakdown`) ne sert plus qu'à estimer pendant que
 * l'acheteur choisit sa position.
 */

export interface QuoteLineInput {
  listing_id: string;
  variant_id?: string | null;
  quantity: number;
}

export interface QuoteRequest {
  items: QuoteLineInput[];
  deliveryMode: 'delivery' | 'pickup';
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryDistrict?: string | null;
  deliveryAddress?: string | null;
}

export interface ServerQuoteSeller {
  seller_id: string;
  distance_km: number;
  delivery_fee: number;
  buyer_fee: number;
  product_amount: number;
}

export interface ServerQuote {
  id: string;
  expiresAt: string;
  deliveryMode: 'delivery' | 'pickup_point';
  sellers: ServerQuoteSeller[];
  productTotal: number;
  deliveryTotal: number;
  buyerFeeTotal: number;
  totalAmount: number;
  /** La plus longue course du panier. */
  distanceKm: number;
}

/** Raisons pour lesquelles un devis doit être redemandé avant de payer. */
export const QUOTE_RETRY_REASONS = ['quote_expired', 'quote_used', 'quote_stale', 'quote_not_found', 'quote_mismatch'];

export class QuoteRequestError extends Error {
  reason?: string;
  constructor(message: string, reason?: string) {
    super(message);
    this.reason = reason;
  }
}

export const quoteService = {
  async getQuote(req: QuoteRequest): Promise<ServerQuote> {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new QuoteRequestError('Session expirée. Reconnectez-vous pour commander.', 'unauthenticated');

    const response = await fetch(`${ENV_CONFIG.PAYMENT_API_URL}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: req.items.map((it) => ({
          listing_id: it.listing_id,
          variant_id: it.variant_id || undefined,
          quantity: it.quantity,
          delivery_mode: req.deliveryMode,
          delivery_lat: req.deliveryMode === 'delivery' ? req.deliveryLat ?? undefined : undefined,
          delivery_lng: req.deliveryMode === 'delivery' ? req.deliveryLng ?? undefined : undefined,
          delivery_district: req.deliveryDistrict || undefined,
          delivery_address: req.deliveryAddress || undefined,
        })),
      }),
    });

    const data = await response.json().catch(() => ({} as any));
    if (!response.ok || data?.success === false || !data?.quote) {
      throw new QuoteRequestError(data?.message || 'Impossible de calculer le prix. Réessayez.', data?.reason);
    }
    return data.quote as ServerQuote;
  },
};
