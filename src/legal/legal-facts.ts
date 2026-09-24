/**
 * Source de vérité unique pour les chiffres cités dans les écrans publics
 * (FAQ, CGU, Confidentialité, À propos, Comment ça marche).
 *
 * Règle : aucun pourcentage ni tarif ne doit être écrit en dur dans un écran.
 * Tout est dérivé de `PRICING_CONFIG`, la grille que le checkout applique
 * réellement — c'est l'absence de cette règle qui avait laissé la FAQ annoncer
 * « 0 % de commission acheteur » alors que 2 % sont bien facturés.
 */

import { PRICING_CONFIG, BOOST_CREDIT_OPTIONS } from '@daloa/config';

/** Formate un taux (0.02) en pourcentage lisible ("2 %"), virgule décimale française. */
export const pct = (rate: number): string => {
  const rounded = Math.round(rate * 100 * 100) / 100;
  return `${String(rounded).replace('.', ',')} %`;
};

/** Formate un montant en FCFA avec espaces insécables ("2 500 FCFA"). */
export const fcfa = (amount: number): string =>
  `${amount.toLocaleString('fr-FR').replace(/ | | /g, ' ')} FCFA`;

const { marketplace, delivery, proSubscription, packs } = PRICING_CONFIG;

export const FEES = {
  /** Frais de service acheteur, réellement facturés au checkout. */
  buyerPct: pct(marketplace.buyerServiceFeeRate),
  /** Grille vendeur applicable à la fin de la phase de lancement. */
  sellerStandardPct: pct(marketplace.standardSellerFeeRate),
  sellerProPct: pct(marketplace.proSellerFeeRate),
  /** Retenue plateforme sur la course, côté livreur. */
  driverPlatformPct: pct(delivery.driverCommissionRate),
  driverNetPct: pct(1 - delivery.driverCommissionRate),
} as const;

export const DELIVERY = {
  basePrice: fcfa(delivery.baseFee),
  baseKm: String(delivery.baseKm).replace('.', ','),
  perKm: fcfa(delivery.ratePerAdditionalKm),
} as const;

export const PRO_PASS = {
  monthly: fcfa(proSubscription.monthlyPrice),
  yearly: fcfa(proSubscription.annualPrice),
} as const;

/**
 * Visibilité : boost payé en crédits (RPC buy_boost_with_credits), crédits
 * achetés en packs. L'ancien « Boost 500 FCFA » et le « Bump 200 FCFA »
 * n'étaient achetables nulle part : le serveur de paiement refuse ces types.
 */
const joinFr = (items: string[]): string =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ou ${items[items.length - 1]}`;
export const VISIBILITY = {
  /** « 1 crédit (24 heures), 2 crédits (2 jours) ou 5 crédits (7 jours) » */
  boostOptions: joinFr(BOOST_CREDIT_OPTIONS.map((o) => `${o.credits} crédit${o.credits > 1 ? 's' : ''} (${o.label})`)),
  /** « 5 crédits pour 500 FCFA, 12 crédits pour 1 000 FCFA ou 30 crédits pour 2 000 FCFA » */
  creditPacks: joinFr(packs.map((p) => `${p.credits} crédits pour ${fcfa(p.price)}`)),
} as const;

/**
 * Régime en vigueur. La base de production (`system_settings.phase_config`)
 * est en phase 0 : `seller_fee_override: 0`, `max_free_listings: 999999`,
 * COD / retrait / livreurs affiliés ouverts à tous.
 */
export const LAUNCH_PHASE = {
  sellerCommissionWaived: true,
  unlimitedListings: true,
  proFeaturesOpenToAll: true,
} as const;

/** Nombre maximum d'annulations consécutives (system_settings.cancellation_settings). */
export const MAX_CONSECUTIVE_CANCELLATIONS = 3;

/** Réseaux Mobile Money acceptés via l'agrégateur Money Fusion. */
export const PAYMENT_NETWORKS = 'Wave, Orange Money, MTN MoMo et Moov Money';

/** Date de dernière révision des textes légaux. */
export const LEGAL_LAST_UPDATED = '16 septembre 2026';
