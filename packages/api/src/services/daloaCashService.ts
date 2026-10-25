import { supabase } from '../supabase';
import {
  ReferralSummary,
  ApplyReferralResult,
  DaloaCashReferral,
  DaloaCashTransaction,
} from '@daloa/types';

/**
 * Service de gestion du Parrainage & Daloa Cash (F10).
 *
 * Permet aux utilisateurs d'inviter des proches, d'obtenir des crédits
 * de livraison (500 FCFA par filleul livré) et de déduire ces gains
 * lors de la commande.
 */
export const daloaCashService = {
  /**
   * Récupère le bilan complet de parrainage et de crédits Daloa Cash d'un utilisateur.
   */
  async getReferralSummary(userId: string): Promise<ReferralSummary> {
    if (!userId) {
      throw new Error('Identifiant utilisateur manquant pour le parrainage.');
    }

    // 1. Profil utilisateur (code et solde)
    const { data: userProfile, error: profileErr } = await supabase
      .from('users')
      .select('referral_code, daloa_cash_balance, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const referralCode = userProfile?.referral_code || 'DALOA';
    const balance = userProfile?.daloa_cash_balance || 0;

    // 2. Filleuls parrainés
    const { data: referralsData, error: refErr } = await supabase
      .from('daloa_cash_referrals' as any)
      .select(`
        id,
        referrer_id,
        referee_id,
        referral_code,
        status,
        referee_reward_amount,
        referrer_reward_amount,
        first_order_id,
        rewarded_at,
        created_at,
        referee:users!daloa_cash_referrals_referee_id_fkey(
          full_name,
          avatar_url
        )
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (refErr) throw refErr;

    const referrals: DaloaCashReferral[] = (referralsData || []).map((r: any) => ({
      id: r.id,
      referrer_id: r.referrer_id,
      referee_id: r.referee_id,
      referral_code: r.referral_code,
      status: r.status,
      referee_reward_amount: r.referee_reward_amount,
      referrer_reward_amount: r.referrer_reward_amount,
      first_order_id: r.first_order_id,
      rewarded_at: r.rewarded_at,
      created_at: r.created_at,
      referee: r.referee
        ? {
            full_name: r.referee.full_name || null,
            avatar_url: r.referee.avatar_url || null,
          }
        : null,
    }));

    // 3. Transactions Daloa Cash (historique comptable)
    const { data: txData, error: txErr } = await supabase
      .from('daloa_cash_transactions' as any)
      .select('id, user_id, amount, type, order_id, referral_id, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (txErr) throw txErr;

    const transactions: DaloaCashTransaction[] = (txData || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      amount: t.amount,
      type: t.type,
      order_id: t.order_id,
      referral_id: t.referral_id,
      notes: t.notes,
      created_at: t.created_at,
    }));

    const invitedCount = referrals.length;
    const rewardedCount = referrals.filter((r) => r.status === 'completed').length;
    const pendingCount = referrals.filter((r) => r.status === 'pending').length;

    const totalEarned = transactions
      .filter((t) => t.amount > 0 && t.type === 'referral_bonus_referrer')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      referralCode,
      balance,
      totalEarned,
      invitedCount,
      rewardedCount,
      pendingCount,
      referrals,
      transactions,
    };
  },

  /**
   * Applique un code de parrainage pour un nouvel acheteur (500 FCFA offerts).
   */
  async applyReferralCode(code: string): Promise<ApplyReferralResult> {
    const cleanCode = code?.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('Veuillez saisir un code de parrainage.');
    }

    const { data, error } = await (supabase.rpc as any)('apply_referral_code', {
      p_code: cleanCode,
    });

    if (error) {
      throw new Error(error.message || 'Impossible d’appliquer ce code de parrainage.');
    }

    const res = data as any;
    if (!res || res.success === false) {
      throw new Error(res?.message || 'Ce code de parrainage n’a pas pu être appliqué.');
    }

    return {
      success: true,
      message: res.message || '500 FCFA ont été ajoutés à votre compte Daloa Cash.',
      bonusAmount: res.bonus_amount || 500,
      referrerName: res.referrer_name,
    };
  },

  /**
   * Lien public court de parrainage.
   */
  getShareUrl(referralCode: string): string {
    return `https://daloamarket.com/r/${encodeURIComponent(referralCode)}`;
  },

  /**
   * Message préformaté optimisé pour le partage WhatsApp ou SMS.
   */
  getShareMessage(referralCode: string): string {
    const url = this.getShareUrl(referralCode);
    return `Salut ! Utilise mon code parrainage *${referralCode}* sur DaloaMarket pour recevoir 500 FCFA offerts sur ta première livraison à Daloa : ${url}`;
  },

  /**
   * Applique une déduction atomique Daloa Cash sur une commande créée.
   */
  async applyDaloaCashToOrder(
    orderId: string,
    discount: number
  ): Promise<{ success: boolean; discountApplied: number; newBalance?: number }> {
    if (!orderId || discount <= 0) return { success: false, discountApplied: 0 };

    const { data, error } = await (supabase.rpc as any)('apply_daloa_cash_to_order', {
      p_order_id: orderId,
      p_discount: discount,
    });

    if (error) {
      console.warn('Erreur déduction Daloa Cash:', error);
      return { success: false, discountApplied: 0 };
    }

    const res = data as any;
    return {
      success: Boolean(res?.success),
      discountApplied: Number(res?.discount_applied || 0),
      newBalance: res?.new_balance != null ? Number(res.new_balance) : undefined,
    };
  },
};
