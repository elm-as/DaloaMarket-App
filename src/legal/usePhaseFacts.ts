import { useMemo } from 'react';
import { usePhase } from '../context/PhaseContext';
import { FEES, pct } from './legal-facts';

/**
 * Régime commercial en vigueur, lu dans la configuration de phase (la même que
 * celle appliquée par la base au checkout). Les textes publics (FAQ, CGU) s'en
 * servent pour ne plus rester figés sur la phase de lancement.
 */
export interface PhaseFacts {
  noSellerCommission: boolean;
  /** Commission vendeur applicable aujourd'hui, en toutes lettres. */
  sellerFeeText: string;
  /** Paiement à la livraison, retrait et livreurs affiliés ouverts à tous. */
  proFeaturesOpenToAll: boolean;
  codOpenToAll: boolean;
}

export function usePhaseFacts(): PhaseFacts {
  const { sellerFeeOverride, allowCodForAll, allowPickupForAll, allowAffiliatedDeliverers } = usePhase();
  return useMemo(
    () => ({
      noSellerCommission: sellerFeeOverride != null && Number(sellerFeeOverride) === 0,
      sellerFeeText:
        sellerFeeOverride != null
          ? pct(Number(sellerFeeOverride))
          : `${FEES.sellerStandardPct} (${FEES.sellerProPct} pour les Vendeurs Pro)`,
      proFeaturesOpenToAll: Boolean(allowCodForAll && allowPickupForAll && allowAffiliatedDeliverers),
      codOpenToAll: Boolean(allowCodForAll),
    }),
    [sellerFeeOverride, allowCodForAll, allowPickupForAll, allowAffiliatedDeliverers],
  );
}
