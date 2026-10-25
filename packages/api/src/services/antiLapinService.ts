import { supabase } from '../supabase';
import { CodRefusalReason, BuyerReliabilityInfo } from '@daloa/types';
import { computeBuyerReliability } from '@daloa/utils';

export interface ReportCodRefusalParams {
  orderId: string;
  reason: CodRefusalReason | string;
  notes?: string;
  proofPhotoUrl?: string;
}

export interface ReportCodRefusalResult {
  success: boolean;
  message: string;
  newScore?: number;
  newRefusedCount?: number;
  isBlocked?: boolean;
  blockedUntil?: string | null;
}

export const COD_REFUSAL_REASONS: { id: CodRefusalReason; label: string; icon: string }[] = [
  { id: 'buyer_unreachable', label: 'Client injoignable (injoignable après appels)', icon: 'phone-off' },
  { id: 'buyer_refused_no_money', label: 'Manque de liquidités à la livraison', icon: 'banknote' },
  { id: 'buyer_refused_changed_mind', label: 'Refus sur place (a changé d’avis)', icon: 'x-circle' },
  { id: 'buyer_fake_location', label: 'Adresse introuvable ou fausse zone', icon: 'map-pin-off' },
  { id: 'other', label: 'Autre motif de non-réception', icon: 'alert-triangle' },
];

/**
 * Service de gestion de l'Indice Anti-Lapin et des incidents COD (F02).
 */
export const antiLapinService = {
  /**
   * Signale un échec de livraison / refus au pas de la porte (lapin).
   * Appelable par le coursier assigné ou le commerçant.
   */
  async reportCodRefusal(params: ReportCodRefusalParams): Promise<ReportCodRefusalResult> {
    const { data, error } = await supabase.rpc('report_cod_delivery_refusal', {
      p_order_id: params.orderId,
      p_reason: params.reason,
      p_notes: params.notes?.trim() || null,
      p_proof_photo_url: params.proofPhotoUrl?.trim() || null,
    });

    if (error) {
      throw new Error(error.message || 'Impossible d’enregistrer le refus de livraison.');
    }

    const res = data as any;
    if (!res || res.success === false) {
      throw new Error(res?.message || res?.reason || 'Échec de l’enregistrement de l’incident.');
    }

    return {
      success: true,
      message: res.message || 'Incident Anti-Lapin enregistré.',
      newScore: res.new_score != null ? Number(res.new_score) : undefined,
      newRefusedCount: res.new_refused_count != null ? Number(res.new_refused_count) : undefined,
      isBlocked: Boolean(res.is_blocked),
      blockedUntil: res.blocked_until || null,
    };
  },

  /**
   * Récupère l'indice de fiabilité complet d'un acheteur
   */
  async getBuyerReliability(userId: string): Promise<BuyerReliabilityInfo> {
    const { data, error } = await supabase
      .from('users')
      .select('cod_orders_count, cod_delivered_count, cod_refused_count, cod_reliability_score, cod_warning_count, cod_blocked_until')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return computeBuyerReliability(data as any);
  },

  /**
   * Réinitialise les pénalités d'un acheteur réhabilité (Administration / Support).
   */
  async resetBuyerCodPenalties(userId: string): Promise<void> {
    const { data, error } = await supabase.rpc('reset_buyer_cod_penalties', {
      p_user_id: userId,
    });

    if (error) throw error;
    const res = data as any;
    if (res && res.success === false) {
      throw new Error(res.message || 'Réinitialisation impossible.');
    }
  },
};
