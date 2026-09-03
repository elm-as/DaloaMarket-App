import { ENV_CONFIG } from '@daloa/config';
import { PaymentIntentRequest, PaymentIntentResponse, PayoutRequest } from '@daloa/types';
import { supabase } from '../supabase';

export type PaymentType =
  | 'seller_badge'
  | 'listing_pack_10'
  | 'order'
  | 'credits_pack_5'
  | 'credits_pack_12'
  | 'credits_pack_30';

export interface InitiatePaymentInput {
  type: PaymentType;
  amount: number;
  userId: string;
  customerName: string;
  customerPhone: string;
  metadata?: Record<string, unknown>;
  orderInput?: Record<string, unknown>;
  orderInputs?: Record<string, unknown>[];
}

export interface InitiatePaymentResult {
  success: boolean;
  paymentUrl: string;
  token?: string;
  transactionId?: string;
  message?: string;
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export const paymentService = {
  /**
   * Initie un paiement Money Fusion via le serveur (badge Pro, packs, crédits…).
   * Contrat aligné sur le serveur railway : POST /create-payment.
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const token = await getAccessToken();
    const response = await fetch(`${ENV_CONFIG.PAYMENT_API_URL}/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => ({} as any));
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || 'Échec de l’initialisation du paiement.');
    }

    // Non-order renvoie paymentUrl ; order renvoie payment_url.
    const paymentUrl = data.paymentUrl || data.payment_url || '';
    return {
      success: true,
      paymentUrl,
      token: data.token,
      transactionId: data.transactionId,
    };
  },

  /**
   * Vérifie un paiement par transactionId (escrow) auprès du serveur.
   * Renvoie l'order_id une fois la commande créée côté serveur après paiement.
   */
  async checkPaymentByTransaction(
    transactionId: string
  ): Promise<{ status: string; isPaid: boolean; orderId: string | null }> {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${ENV_CONFIG.PAYMENT_API_URL}/check-payment?transactionId=${encodeURIComponent(transactionId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status || 'pending',
          isPaid: data.status === 'paid',
          orderId: data.order_id || null,
        };
      }
    } catch (err) {
      console.warn('Vérification paiement (transaction) échouée:', err);
    }
    return { status: 'pending', isPaid: false, orderId: null };
  },

  /**
   * @deprecated Ancien contrat (/payment/create) non conforme au serveur.
   * Conservé temporairement ; le tunnel commande doit migrer vers initiatePayment
   * avec type:'order' (le serveur crée alors la commande lui-même).
   */
  async createPaymentIntent(payload: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${ENV_CONFIG.PAYMENT_API_URL}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l’initialisation du paiement sécurisé');
      }

      return await response.json();
    } catch (err: any) {
      console.error('Échec création intention paiement:', err);
      throw new Error(err.message || 'Impossible d’initialiser le paiement sécurisé. Veuillez réessayer.');
    }
  },

  /**
   * Vérifie le statut d'un paiement auprès de l'API DaloaPay
   */
  async checkPaymentStatus(orderId: string): Promise<{ status: string; isPaid: boolean }> {
    try {
      const response = await fetch(`${ENV_CONFIG.PAYMENT_API_URL}/payment/check?orderId=${orderId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Vérification paiement API externe échouée:', err);
    }

    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      return {
        status: 'pending',
        isPaid: false,
      };
    }

    const confirmedPaidStatuses = ['paid', 'in_transit', 'delivered', 'completed'];
    return {
      status: data.status,
      isPaid: confirmedPaidStatuses.includes(data.status),
    };
  },

  /**
   * Demande un reversement Mobile Money (Vendeur ou Livreur)
   */
  async requestPayout(payload: PayoutRequest): Promise<{ success: boolean; message: string }> {
    const fee = 0; // Pas de frais de retrait en Phase 0
    const netAmount = payload.amount - fee;

    const { error } = await supabase.from('payouts').insert({
      user_id: payload.userId,
      recipient_type: payload.recipientType,
      amount: payload.amount,
      fee,
      net_amount: netAmount,
      network: payload.network,
      phone: payload.phone,
      status: 'pending',
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Demande de retrait transmise. Vous recevrez vos fonds sous 24 heures.',
    };
  },
};
