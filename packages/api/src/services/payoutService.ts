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
};
