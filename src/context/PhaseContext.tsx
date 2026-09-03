import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, systemSettingsService, PhaseConfig, DEFAULT_PHASE_CONFIG } from '@daloa/api';
import { useQueryClient } from '@tanstack/react-query';

export interface PhaseContextValue {
  phaseConfig: PhaseConfig;
  phase: 0 | 1;
  isPhase0: boolean;
  showMonetisation: boolean;
  maxFreeListings: number;
  allowCodForAll: boolean;
  allowPickupForAll: boolean;
  allowAffiliatedDeliverers: boolean;
  sellerFeeOverride: number | null;
  enableSellerBadge: boolean;
  /** Bascule sur un préréglage complet de phase (console admin). */
  switchPhase: (targetPhase: 0 | 1) => Promise<void>;
  /** Enregistre une configuration composée à la main (réglages fins). */
  savePhaseConfig: (config: PhaseConfig) => Promise<void>;
  /** Relit la configuration depuis la base. */
  refreshPhase: () => Promise<void>;
  isLoading: boolean;
}

const PhaseContext = createContext<PhaseContextValue | null>(null);

export function PhaseProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [phaseConfig, setPhaseConfig] = useState<PhaseConfig>(DEFAULT_PHASE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadPhase = async () => {
    try {
      const settings = await systemSettingsService.getSettings();
      if (mountedRef.current && settings.phaseConfig) {
        setPhaseConfig(settings.phaseConfig);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadPhase();

    // Un identifiant de canal unique par montage évite les collisions de
    // souscription lors d'un fast refresh ou d'un remontage de l'arbre.
    const channelId = `mob_phase_${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload: any) => {
          if (payload?.new?.key === 'phase_config' && payload?.new?.value) {
            setPhaseConfig((prev) => ({ ...prev, ...payload.new.value }));
            queryClient.invalidateQueries({ queryKey: ['system_settings'] });
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const applyResult = (config: PhaseConfig) => {
    setPhaseConfig(config);
    queryClient.invalidateQueries({ queryKey: ['system_settings'] });
  };

  const switchPhase = async (targetPhase: 0 | 1) => {
    const res = await systemSettingsService.updatePhaseConfig(targetPhase);
    applyResult(res.phaseConfig);
  };

  const savePhaseConfig = async (config: PhaseConfig) => {
    const res = await systemSettingsService.savePhaseConfig(config);
    applyResult(res.phaseConfig);
  };

  const value = useMemo<PhaseContextValue>(() => {
    const isPhase0 = phaseConfig.phase === 0;
    const hasAnyMonetisation =
      phaseConfig.enable_boost ||
      phaseConfig.enable_bump ||
      phaseConfig.enable_seller_badge;

    return {
      phaseConfig,
      phase: phaseConfig.phase,
      isPhase0,
      showMonetisation: !isPhase0 || hasAnyMonetisation,
      maxFreeListings:
        isPhase0 && phaseConfig.max_free_listings >= 999999
          ? Number.POSITIVE_INFINITY
          : phaseConfig.max_free_listings,
      allowCodForAll: phaseConfig.allow_cod_for_all,
      allowPickupForAll: phaseConfig.allow_pickup_for_all,
      allowAffiliatedDeliverers: phaseConfig.allow_affiliated_deliverers_for_all,
      sellerFeeOverride: phaseConfig.seller_fee_override ?? (isPhase0 ? 0 : null),
      enableSellerBadge: phaseConfig.enable_seller_badge,
      switchPhase,
      savePhaseConfig,
      refreshPhase: loadPhase,
      isLoading,
    };
  }, [phaseConfig, isLoading]);

  return <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>;
}

export function usePhase(): PhaseContextValue {
  const ctx = useContext(PhaseContext);
  if (!ctx) {
    throw new Error('usePhase doit être utilisé au sein d’un <PhaseProvider>');
  }
  return ctx;
}
