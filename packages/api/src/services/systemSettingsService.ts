import { supabase } from '../supabase';

/**
 * Réglages système globaux (table `system_settings`, lignes key/value JSON).
 * Source unique de vérité partagée web + mobile : maintenance, paiement, phase.
 */

export interface MaintenanceConfig {
  enabled: boolean;
  expected_reopening: string | null;
  message: string;
}

export interface PaymentConfig {
  status: 'normal' | 'degraded' | 'down';
  notice: string;
  disable_online_payments: boolean;
  force_cod_only: boolean;
}

export interface PhaseConfig {
  phase: 0 | 1;
  allow_cod_for_all: boolean;
  allow_pickup_for_all: boolean;
  allow_affiliated_deliverers_for_all: boolean;
  max_free_listings: number;
  enable_boost: boolean;
  enable_bump: boolean;
  enable_seller_badge: boolean;
  default_payment_method: 'cod' | 'online';
  /** Override du taux commission vendeur (null = grille par défaut). 0 = gratuit. */
  seller_fee_override: number | null;
}

export interface SystemSettings {
  maintenance: MaintenanceConfig;
  paymentConfig: PaymentConfig;
  phaseConfig: PhaseConfig;
}

// Défauts conservateurs : appliqués uniquement si la table est injoignable.
export const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  expected_reopening: null,
  message: 'DaloaMarket est actuellement en maintenance. Nous revenons très vite !',
};

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  status: 'normal',
  notice: '',
  disable_online_payments: false,
  force_cod_only: false,
};

export const DEFAULT_PHASE_CONFIG: PhaseConfig = {
  phase: 0,
  allow_cod_for_all: true,
  allow_pickup_for_all: true,
  allow_affiliated_deliverers_for_all: true,
  max_free_listings: 999999,
  enable_boost: true,
  enable_bump: true,
  enable_seller_badge: false,
  default_payment_method: 'cod',
  seller_fee_override: 0,
};

export const systemSettingsService = {
  async getSettings(): Promise<SystemSettings> {
    const result: SystemSettings = {
      maintenance: DEFAULT_MAINTENANCE,
      paymentConfig: DEFAULT_PAYMENT_CONFIG,
      phaseConfig: DEFAULT_PHASE_CONFIG,
    };

    try {
      const { data, error } = await supabase.from('system_settings').select('key, value');
      if (error || !data) return result;

      for (const row of data as { key: string; value: any }[]) {
        if (row.key === 'maintenance_mode') {
          result.maintenance = { ...DEFAULT_MAINTENANCE, ...row.value };
        } else if (row.key === 'payment_settings') {
          result.paymentConfig = { ...DEFAULT_PAYMENT_CONFIG, ...row.value };
        } else if (row.key === 'phase_config') {
          result.phaseConfig = { ...DEFAULT_PHASE_CONFIG, ...row.value };
        }
      }
    } catch {
      // silencieux : on renvoie les défauts
    }

    return result;
  },

  /**
   * Préréglages de phase. Alignés à l'identique sur l'admin web
   * (DaloaMarket-v2/src/components/admin/AdminSettingsTab.tsx) pour que les deux
   * consoles écrivent exactement la même configuration.
   */
  phasePreset(targetPhase: 0 | 1): PhaseConfig {
    return targetPhase === 0
      ? {
          phase: 0,
          allow_cod_for_all: true,
          allow_pickup_for_all: true,
          allow_affiliated_deliverers_for_all: true,
          max_free_listings: 999999,
          enable_boost: true,
          enable_bump: true,
          enable_seller_badge: true,
          default_payment_method: 'cod',
          seller_fee_override: 0,
        }
      : {
          phase: 1,
          allow_cod_for_all: false,
          allow_pickup_for_all: false,
          allow_affiliated_deliverers_for_all: false,
          max_free_listings: 20,
          enable_boost: true,
          enable_bump: true,
          enable_seller_badge: true,
          default_payment_method: 'online',
          seller_fee_override: null,
        };
  },

  /**
   * Écrit la configuration de phase via la RPC `update_system_setting`.
   *
   * Attention : cette RPC renvoie `{ success: false, reason: 'unauthorized' }`
   * dans le corps de la réponse au lieu de lever une erreur Postgres. Un test
   * sur `error` seul donnerait donc un faux succès à un non-admin — il faut
   * lire `data.success`.
   */
  async updatePhaseConfig(
    targetPhase: 0 | 1,
    customOverrides?: Partial<PhaseConfig>
  ): Promise<{ success: boolean; phaseConfig: PhaseConfig }> {
    const payload: PhaseConfig = {
      ...this.phasePreset(targetPhase),
      ...(customOverrides || {}),
    };

    return this.savePhaseConfig(payload);
  },

  /** Enregistre une configuration de phase déjà composée (réglages fins). */
  async savePhaseConfig(
    payload: PhaseConfig
  ): Promise<{ success: boolean; phaseConfig: PhaseConfig }> {
    const { data, error } = await supabase.rpc('update_system_setting', {
      p_key: 'phase_config',
      p_value: payload as any,
    });

    if (error) throw error;

    const res = data as { success?: boolean; reason?: string } | null;
    if (res && res.success === false) {
      throw new Error(
        res.reason === 'unauthorized'
          ? "Accès refusé : seul un administrateur peut changer la phase."
          : res.reason || 'Erreur lors de la mise à jour de la phase.'
      );
    }

    return { success: true, phaseConfig: payload };
  },
};
