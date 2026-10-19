import { BuyerReliabilityInfo, BuyerReliabilityTier } from '@daloa/types';

interface BuyerCodData {
  cod_orders_count?: number | null;
  cod_delivered_count?: number | null;
  cod_refused_count?: number | null;
  cod_reliability_score?: number | null;
  cod_warning_count?: number | null;
  cod_blocked_until?: string | null;
}

/**
 * Calcule l'indice de fiabilité Anti-Lapin d'un acheteur (F02).
 *
 * Fonction pure : déterministe, zéro mutation, zéro requête réseau.
 * Protège livreurs et commerçants contre les refus au pas de la porte et
 * les commandes fantômes sur Daloa.
 */
export function computeBuyerReliability(buyer?: BuyerCodData | null): BuyerReliabilityInfo {
  const deliveredCount = Math.max(0, buyer?.cod_delivered_count ?? 0);
  const refusedCount = Math.max(0, buyer?.cod_refused_count ?? 0);
  const warningCount = Math.max(0, buyer?.cod_warning_count ?? 0);
  const blockedUntil = buyer?.cod_blocked_until || null;

  const isCodBlocked = Boolean(
    blockedUntil && new Date(blockedUntil).getTime() > Date.now()
  );

  const totalRuns = deliveredCount + refusedCount;
  const score = totalRuns === 0
    ? 100
    : Math.max(0, Math.min(100, Math.round((deliveredCount / totalRuns) * 100)));

  let tier: BuyerReliabilityTier = 'verified';
  let label = 'Client fiable';
  let badgeText = `${score}% (${deliveredCount} livr.)`;
  let advice: string | null = null;

  if (isCodBlocked || refusedCount >= 2 || (totalRuns >= 3 && score < 70)) {
    tier = 'at_risk';
    label = 'Profil à risque';
    badgeText = isCodBlocked ? 'COD Suspendu' : `${score}% (Risque)`;
    advice =
      'Plusieurs livraisons non réceptionnées. En paiement à la livraison, confirmez impérativement par téléphone avant de préparer le colis.';
  } else if (refusedCount === 1) {
    tier = 'warning';
    label = 'Vigilance modérée';
    badgeText = `${score}% (1 refus)`;
    advice =
      '1 livraison précédente non réceptionnée. Appelez l’acheteur pour vérifier sa présence à l’adresse indiquée.';
  } else if (deliveredCount === 0) {
    tier = 'new_client';
    label = 'Nouveau client';
    badgeText = 'Nouveau client';
    advice = 'Première commande. Un rapide appel de confirmation sécurise le point de livraison.';
  }

  return {
    score,
    tier,
    deliveredCount,
    refusedCount,
    warningCount,
    isCodBlocked,
    blockedUntil,
    label,
    badgeText,
    advice,
  };
}
