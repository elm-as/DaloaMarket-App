import { supabase } from '../supabase';
import { PayoutSettings, TablesUpdate } from '@daloa/types';
import { normalizePayoutNetwork } from '@daloa/config';

/**
 * Convertit un identifiant canonique de base ('wave-ci', 'orange-money-ci'...)
 * vers l'identifiant court utilisé par l'interface ('wave', 'orange'...).
 */
export const denormalizePayoutNetwork = (network?: string | null): string => {
  if (!network) return 'wave';
  const clean = network.replace(/-ci$/, '').toLowerCase().trim();
  if (clean === 'orange' || clean === 'orange-money' || clean === 'orangemoney') return 'orange';
  if (clean === 'mtn' || clean === 'mtn-momo' || clean === 'momo') return 'mtn';
  if (clean === 'moov' || clean === 'moov-money' || clean === 'moovmoney') return 'moov';
  if (clean === 'wave') return 'wave';
  return 'wave';
};

export const payoutService = {
  /**
   * Récupère la configuration Mobile Money de l'utilisateur.
   * Cherche en priorité dans `delivery_persons` (pour un livreur),
   * puis dans `users` (pour un vendeur ou acheteur).
   */
  async getPayoutSettings(userId: string): Promise<PayoutSettings | null> {
    const { data: dpData } = await supabase
      .from('delivery_persons')
      .select('payout_network, payout_number, phone, name')
      .eq('user_id', userId)
      .maybeSingle();

    if (dpData && (dpData.payout_number || dpData.payout_network)) {
      return {
        network: denormalizePayoutNetwork(dpData.payout_network) as any,
        phone: dpData.payout_number || dpData.phone || '',
        accountName: dpData.name || '',
        isActive: true,
      };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('payout_network, payout_number, phone, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!userData || (!userData.payout_number && !userData.payout_network)) {
      return null;
    }

    return {
      network: denormalizePayoutNetwork(userData.payout_network) as any,
      phone: userData.payout_number || userData.phone || '',
      accountName: userData.full_name || '',
      isActive: true,
    };
  },

  /**
   * Sauvegarde la configuration Mobile Money dans `delivery_persons` et `users`.
   * Normalise le réseau vers le format SQL attendu ('wave-ci', 'orange-money-ci'...).
   */
  async savePayoutSettings(userId: string, settings: PayoutSettings): Promise<void> {
    const cleanedPhone = (settings.phone || '').replace(/\D/g, '');
    const canonicalNetwork = normalizePayoutNetwork(settings.network);

    const dpUpdates: TablesUpdate<'delivery_persons'> = {
      payout_network: canonicalNetwork,
      payout_number: cleanedPhone,
      updated_at: new Date().toISOString(),
    };
    if (settings.accountName?.trim()) {
      dpUpdates.name = settings.accountName.trim();
    }

    const { error: dpError } = await supabase
      .from('delivery_persons')
      .update(dpUpdates)
      .eq('user_id', userId);

    if (dpError) {
      console.error('Erreur mise à jour delivery_persons payout:', dpError);
      throw dpError;
    }

    const userUpdates: TablesUpdate<'users'> = {
      payout_network: canonicalNetwork,
      payout_number: cleanedPhone,
    };
    if (settings.accountName?.trim()) {
      userUpdates.full_name = settings.accountName.trim();
    }

    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId);

    if (userError) {
      console.warn('Avertissement mise à jour users payout:', userError);
    }
  },

  /**
   * Récupère l'historique des reversements d'un utilisateur
   */
  async getPayoutHistory(userId: string, type?: string) {
    let query = supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      amount: p.amount ?? 0,
      net_amount: p.amount ?? 0,
      phone: p.recipient_phone || '',
      recipient_phone: p.recipient_phone || '',
      network: p.withdraw_mode || 'mobile_money',
      withdraw_mode: p.withdraw_mode || 'mobile_money',
    }));
  },

  /**
   * Calcule le solde disponible et le montant en séquestre d'un vendeur
   */
  async getSellerBalance(userId: string): Promise<{ available: number; escrow: number }> {
    const [deliveredRes, escrowRes, confirmedPayoutsRes, pendingPayoutsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('product_amount, platform_commission')
        .eq('seller_id', userId)
        // Seul l'argent passé par le séquestre est versé par DaloaMarket : en
        // espèces, le vendeur l'a déjà encaissé lui-même.
        .eq('payment_method', 'online')
        .in('status', ['delivered', 'completed']),
      supabase
        .from('orders')
        .select('product_amount, platform_commission')
        .eq('seller_id', userId)
        // Statuts réels de `orders` : payé en ligne mais pas encore remis.
        .eq('payment_method', 'online')
        .in('status', ['paid', 'in_transit']),
      supabase
        .from('payouts')
        .select('amount')
        .eq('user_id', userId)
        // `confirmed` n'existe pas pour `payouts` : l'argent déjà versé n'était
        // jamais déduit et le « disponible » restait gonflé.
        .in('status', ['paid', 'completed']),
      supabase
        .from('payouts')
        .select('amount')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing']),
    ]);

    const totalEarned = (deliveredRes.data || []).reduce(
      (s: number, o: any) => s + Math.max(0, (o.product_amount || 0) - (o.platform_commission || 0)),
      0
    );
    const totalPaidOut = (confirmedPayoutsRes.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalPendingPayout = (pendingPayoutsRes.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const escrow = (escrowRes.data || []).reduce(
      (s: number, o: any) => s + Math.max(0, (o.product_amount || 0) - (o.platform_commission || 0)),
      0
    );

    const available = Math.max(0, totalEarned - totalPaidOut - totalPendingPayout);
    return { available, escrow };
  },
};
