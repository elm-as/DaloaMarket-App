import { OrderFeeBreakdown } from '@daloa/types';

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
    buyerServiceFeeRate: 0.0, // 0.0% : Annulé côté acheteur (zéro frais pour l'acheteur)
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

  // Feature Flags de Phase 0 vs Phase 1 (Actuellement Phase 1 active)
  phase0: {
    isFreeModeActive: false,
    maxFreeListingsPerUser: 20,
    disableListingPublishFees: false,
  },
};

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
