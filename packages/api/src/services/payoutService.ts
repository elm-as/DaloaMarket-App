import { supabase } from '../supabase';
import { PayoutSettings } from '@daloa/types';

export const payoutService = {
  /**
   * Récupère la configuration Mobile Money de l'utilisateur
   */
  async getPayoutSettings(userId: string): Promise<PayoutSettings | null> {
    const { data, error } = await supabase
      .from('payout_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      network: data.network as any,
      phone: data.phone,
      accountName: data.account_name,
      isActive: data.is_active,
      lockedUntil: data.locked_until,
    };
  },

  /**
   * Sauvegarde la configuration Mobile Money
   */
  async savePayoutSettings(userId: string, settings: PayoutSettings): Promise<void> {
    const { error } = await supabase.from('payout_settings').upsert({
      user_id: userId,
      network: settings.network,
      phone: settings.phone,
      account_name: settings.accountName || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },

  /**
   * Récupère l'historique des reversements d'un utilisateur
   */
  async getPayoutHistory(userId: string) {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Calcule le solde disponible et le montant en séquestre d'un vendeur
   */
  async getSellerBalance(userId: string): Promise<{ available: number; escrow: number }> {
    const [deliveredRes, escrowRes, confirmedPayoutsRes, pendingPayoutsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('product_amount, seller_fee')
        .eq('seller_id', userId)
        .eq('status', 'delivered'),
      supabase
        .from('orders')
        .select('product_amount, seller_fee')
        .eq('seller_id', userId)
        .in('status', ['awaiting_pickup', 'picked_up', 'in_transit', 'pending_payment']),
      supabase
        .from('payouts')
        .select('net_amount')
        .eq('user_id', userId)
        .eq('status', 'confirmed'),
      supabase
        .from('payouts')
        .select('net_amount')
        .eq('user_id', userId)
        .eq('status', 'pending'),
    ]);

    const totalEarned = (deliveredRes.data || []).reduce(
      (s, o) => s + Math.max(0, (o.product_amount || 0) - (o.seller_fee || 0)),
      0
    );
    const totalPaidOut = (confirmedPayoutsRes.data || []).reduce((s, p) => s + (p.net_amount || 0), 0);
    const totalPendingPayout = (pendingPayoutsRes.data || []).reduce((s, p) => s + (p.net_amount || 0), 0);
    const escrow = (escrowRes.data || []).reduce(
      (s, o) => s + Math.max(0, (o.product_amount || 0) - (o.seller_fee || 0)),
      0
    );

    const available = Math.max(0, totalEarned - totalPaidOut - totalPendingPayout);
    return { available, escrow };
  },
};
