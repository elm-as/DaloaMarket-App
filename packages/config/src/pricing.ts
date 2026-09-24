import { OrderFeeBreakdown } from '@daloa/types';

/**
 * Bornes du devis de livraison — la « règle de tarification unique ».
 *
 * Ces valeurs étaient jusqu'ici recopiées en dur dans `ordersService`,
 * `payments.js` et le checkout web, chacun avec ses propres nombres. Elles sont
 * la référence : toute autre implémentation (web, serveur Railway, SQL) doit
 * produire le même résultat, ce que vérifie le test de parité.
 */
export const DELIVERY_DISTANCE_RULE = {
  /** Plancher facturable : une course reste une course même à 100 m. */
  minKm: 0.5,
  /** Plafond intra-urbain de Daloa. */
  maxKm: 15,
  /** Majoration appliquée à la distance à vol d'oiseau quand aucun itinéraire
   *  routier n'est disponible (réseau coupé, quota Mapbox). */
  roadFactor: 1.3,
  /** Borne haute de vraisemblance d'une distance routière transmise par un
   *  client, exprimée en multiple du vol d'oiseau. Au-delà, la valeur est
   *  refusée et remplacée par `haversine × roadFactor`. */
  maxRoadRatio: 1.8,
};

/** Grille tarifaire officielle DaloaMarket & DaloaDelivery */
export const PRICING_CONFIG = {
  // Frais de livraison kilométriques
  delivery: {
    baseFee: 500, // FCFA
    baseKm: 1.5, // km inclus dans le tarif de base
    ratePerAdditionalKm: 85, // FCFA par km supplémentaire
    driverCommissionRate: 0.10, // 10% retenu par la plateforme sur la livraison
  },

  // Commissions sur les ventes d'articles
  marketplace: {
    /** Montant minimum d'une annonce, variantes comprises (FCFA). */
    minListingPrice: 300,
    buyerServiceFeeRate: 0.02, // 2% frais de service acheteur (sécurisation & infrastructure)
    standardSellerFeeRate: 0.035, // 3.5% commission vendeur standard
    proSellerFeeRate: 0.025, // 2.5% commission vendeur Pro
  },

  // Forfaits Pro & Monétisation
  proSubscription: {
    monthlyPrice: 2500, // FCFA / mois
    annualPrice: 25000, // FCFA / an (2 mois offerts)
  },

  // Boosts & Bumps
  boosts: {
    boost7Days: 500, // 500 FCFA pour 7 jours de mise en avant
    bumpToListTop: 200, // 200 FCFA pour remonter en tête de liste
  },

  // Packs d'annonces
  packs: [
    { id: 'bronze', name: 'Pack Bronze', credits: 5, price: 500, popular: false },
    { id: 'silver', name: 'Pack Argent', credits: 12, price: 1000, popular: true },
    { id: 'gold', name: 'Pack Or', credits: 30, price: 2000, popular: false },
  ],

  // Feature Flags de Phase 0 vs Phase 1 (Actuellement Phase 0 active — tests/lancement)
  // Phase 0 : tout gratuit et débloqué (boutique, COD, 0 commission). Repasser
  // isFreeModeActive à false pour réactiver la Phase 1 (monétisation).
  phase0: {
    isFreeModeActive: true,
    maxFreeListingsPerUser: 999999,
    disableListingPublishFees: true,
  },
};

/** Applique les bornes du devis à une distance brute (en km, 1 décimale). */
export function clampBillableDistanceKm(distanceKm: number): number {
  const { minKm, maxKm } = DELIVERY_DISTANCE_RULE;
  if (!Number.isFinite(distanceKm)) return minKm;
  return Math.min(maxKm, Math.max(minKm, Math.round(distanceKm * 10) / 10));
}

/**
 * Retient une distance routière seulement si elle est plausible au regard de la
 * distance à vol d'oiseau, sinon retombe sur l'estimation `× roadFactor`.
 *
 * C'est la règle qu'applique aussi la RPC `create_cod_order` : une fonction SQL
 * ne peut pas appeler Mapbox, elle reçoit donc la distance routière du client et
 * la borne ici plutôt que de lui faire confiance.
 */
export function reconcileRoadDistanceKm(
  roadKm: number | null | undefined,
  straightKm: number
): number {
  const { roadFactor, maxRoadRatio } = DELIVERY_DISTANCE_RULE;
  const estimated = clampBillableDistanceKm(straightKm * roadFactor);

  if (roadKm == null || !Number.isFinite(roadKm) || roadKm <= 0) return estimated;

  const bounded = clampBillableDistanceKm(roadKm);
  // Une route est toujours au moins aussi longue que le vol d'oiseau, et jamais
  // démesurément plus longue à l'échelle de Daloa.
  if (bounded + 0.05 < clampBillableDistanceKm(straightKm)) return estimated;
  if (straightKm > 0 && bounded > straightKm * maxRoadRatio) return estimated;

  return bounded;
}

/** Calcule le tarif de livraison en FCFA en fonction de la distance en kilomètres */
export function calculateDeliveryFee(distanceKm: number, customFeeOverride?: number | null): number {
  if (customFeeOverride != null && customFeeOverride >= 0) {
    return Math.round(customFeeOverride);
  }

  const { baseFee, baseKm, ratePerAdditionalKm } = PRICING_CONFIG.delivery;
  if (distanceKm <= baseKm) {
    return baseFee;
  }

  const extraKm = distanceKm - baseKm;
  const extraFee = Math.round(extraKm * ratePerAdditionalKm);
  return baseFee + extraFee;
}

/** Calcule la ventilation complète d'une commande Escrow */
export function calculateOrderBreakdown(params: {
  productPrice: number;
  quantity?: number;
  distanceKm: number;
  isProSeller?: boolean;
  deliveryMode?: 'delivery' | 'pickup';
  deliveryFeeOverride?: number | null;
  /**
   * Override du taux de commission vendeur issu de la config de phase
   * (system_settings → phase_config.seller_fee_override). Ex : 0 = gratuit en
   * Phase 0. `null`/`undefined` = utiliser la grille standard/Pro.
   */
  sellerFeeOverride?: number | null;
}): OrderFeeBreakdown {
  const quantity = params.quantity && params.quantity > 0 ? params.quantity : 1;
  const productSubtotal = params.productPrice * quantity;

  const deliveryFee =
    params.deliveryMode === 'pickup'
      ? 0
      : calculateDeliveryFee(params.distanceKm, params.deliveryFeeOverride);

  const buyerServiceFee = Math.round(
    productSubtotal * PRICING_CONFIG.marketplace.buyerServiceFeeRate
  );

  const sellerFeeRate = params.isProSeller
    ? PRICING_CONFIG.marketplace.proSellerFeeRate
    : PRICING_CONFIG.marketplace.standardSellerFeeRate;

  // Priorité à l'override de phase (0 = gratuit), puis flag Phase 0, sinon grille.
  const sellerCommission =
    params.sellerFeeOverride != null
      ? Math.round(productSubtotal * params.sellerFeeOverride)
      : PRICING_CONFIG.phase0.isFreeModeActive
      ? 0
      : Math.round(productSubtotal * sellerFeeRate);

  const sellerNetPayout = productSubtotal - sellerCommission;

  const driverPlatformFee = Math.round(
    deliveryFee * PRICING_CONFIG.delivery.driverCommissionRate
  );
  const driverNetPayout = deliveryFee - driverPlatformFee;

  const totalAmount = productSubtotal + deliveryFee + buyerServiceFee;

  return {
    productPrice: params.productPrice,
    quantity,
    productSubtotal,
    deliveryFee,
    buyerServiceFee,
    totalAmount,
    sellerCommission,
    sellerNetPayout,
    driverFee: driverPlatformFee,
    driverNetPayout,
  };
}
