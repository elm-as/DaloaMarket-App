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
};
