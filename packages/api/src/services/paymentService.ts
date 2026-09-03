import { ENV_CONFIG } from '@daloa/config';
import { PaymentIntentRequest, PaymentIntentResponse, PayoutRequest } from '@daloa/types';
import { supabase } from '../supabase';

export const paymentService = {
  /**
   * Crée une intention de paiement Money Fusion (Wave, Orange, MTN, Moov)
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
