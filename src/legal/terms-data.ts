import { FEES, VISIBILITY } from './legal-facts';
import type { PhaseFacts } from './usePhaseFacts';

export interface LegalArticle {
  id: string;
  number: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: {
    subtitle: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
}

export const TERMS_LAST_UPDATE = '16 septembre 2026';

/** Articles des CGU, rédigés d'après le régime en vigueur (lu en base). */
export const buildTermsArticles = (phase: PhaseFacts): LegalArticle[] => [
  {
    id: 'acceptance',
    number: '1',
    title: 'Acceptation des conditions',
    summary: "Contrat légalement contraignant entre l'utilisateur et DaloaMarket.",
    paragraphs: [
      "En accédant, en naviguant ou en utilisant la plateforme DaloaMarket, vous reconnaissez avoir lu, compris et accepté d'être lié par les présentes Conditions Générales d'Utilisation (CGU).",
      "Si vous n'acceptez pas l'intégralité de ces conditions, vous ne devez pas utiliser la Plateforme. L'utilisation est conditionnée à votre acceptation pleine et entière.",
      "Ces CGU constituent un contrat légalement contraignant entre vous et DaloaMarket, édité par ELMAS. En créant un compte, vous confirmez votre accord.",
      "DaloaMarket se réserve le droit de modifier ces CGU à tout moment avec notification. Votre utilisation continuée vaut acceptation des nouvelles dispositions.",
    ],
  },
  {
    id: 'service-desc',
    number: '2',
    title: 'Description du service',
    summary: 'Mise en relation directe entre vendeurs et acheteurs à Daloa.',
    paragraphs: [
      "DaloaMarket est une plateforme de commerce et de petites annonces hyper-locales mettant en relation vendeurs et acheteurs à Daloa (Côte d'Ivoire).",
      "Le contrat de vente est conclu exclusivement entre l'acheteur et le vendeur. DaloaMarket n'est ni propriétaire ni revendeur des articles.",
      "Dans le cadre du paiement sécurisé (escrow), DaloaMarket agit uniquement en qualité de tiers technique de confiance et mandataire à l'encaissement via Money Fusion.",
    ],
    bullets: [
      'Publication et consultation d’annonces géolocalisées par quartier',
      'Messagerie instantanée directe et négociation intégrée',
      'Paiement sécurisé Mobile Money (Wave, Orange, MTN, Moov) avec séquestre',
      'Livraison à la demande avec géolocalisation et validation par code OTP',
      'Création et personnalisation de boutiques professionnelles',
    ],
  },
  {
    id: 'account',
    number: '3',
    title: 'Compte utilisateur & Sécurité',
    summary: 'Exactitude des données, responsabilité des identifiants et suppression.',
    paragraphs: [
      "La Plateforme est réservée aux personnes âgées d’au moins 16 ans. Un utilisateur mineur agit sous la responsabilité de son représentant légal, qui doit avoir donné son accord.",
      "Pour publier ou commander, vous devez créer un compte avec des informations exactes, complètes et à jour (nom, téléphone joignable, quartier à Daloa).",
      "Vous êtes entièrement responsable de la confidentialité de vos identifiants et de votre code OTP de validation de commande.",
      "DaloaMarket se réserve le droit de suspendre ou supprimer tout compte en cas de fraude, d'usurpation ou de violation des CGU.",
    ],
  },
  {
    id: 'listing-rules',
    number: '4',
    title: 'Règles de publication des annonces',
    summary: 'Contenu autorisé, interdictions formelles et limites de publication.',
    paragraphs: [
      'Les annonces doivent porter sur des biens licites en Côte d’Ivoire dont l’utilisateur est le propriétaire légitime.',
      'Chaque annonce doit afficher un prix réel en FCFA, des photos authentiques et récentes, et une description sincère de son état.',
      'La publication d’annonces est gratuite et sans plafond, pour tous les comptes. Aucune limite d’annonces actives simultanées n’est appliquée.',
    ],
    bullets: [
      'Interdiction absolue : contrefaçons, objets volés ou sans facture',
      'Interdiction absolue : armes, munitions, explosifs et produits dangereux',
      'Interdiction absolue : stupéfiants, drogues et médicaments sous ordonnance',
      'Interdiction absolue : contenus pornographiques, haineux ou diffamatoires',
      'Interdiction absolue : usurpation d’identité ou publication de données de tiers',
    ],
  },
  {
    id: 'payments-escrow',
    number: '5',
    title: 'Paiement Sécurisé Escrow & Livraisons',
    summary: 'Blocage des fonds, validation OTP et reversement Mobile Money.',
    paragraphs: [
      'DaloaMarket propose un paiement sécurisé tiers de confiance (escrow) : l’acheteur règle par Mobile Money (Wave, Orange, MTN, Moov). Les fonds sont bloqués jusqu’à la livraison effective.',
      'Pour être parfaitement clair : DaloaMarket n’est pas un établissement de paiement et ne détient pas de compte de cantonnement bancaire. Les sommes sont détenues par Money Fusion, prestataire agréé, jusqu’au déblocage. Le mot « séquestre » décrit ce blocage technique, et non un compte séparé ouvert par DaloaMarket.',
      'Frais de service acheteur : 2% du montant des articles. Ces frais couvrent la sécurisation du paiement, la garantie anti-fraude et le fonctionnement de l’infrastructure locale. Le détail est affiché ligne par ligne avant validation de la commande ; aucun frais n’est ajouté ensuite.',
      phase.noSellerCommission
        ? `Commission vendeur : pendant la phase de lancement, aucune commission n’est prélevée sur les ventes : le vendeur reçoit l’intégralité du prix de son article. À l’issue de cette phase, la commission sera de ${FEES.sellerStandardPct} en compte standard et de ${FEES.sellerProPct} pour les membres Pass Vendeur Pro. Ce changement sera annoncé avant son entrée en vigueur.`
        : `Commission vendeur : ${phase.sellerFeeText} du prix des articles vendus. Elle est déduite du montant versé au vendeur pour un paiement en ligne ; pour une vente encaissée en espèces, elle est due à DaloaMarket et doit lui être reversée.`,
      'La libération des fonds au vendeur est conditionnée à la saisie du code secret OTP remis par l’acheteur lors de la remise physique du colis.',
    ],
  },
  {
    id: 'delivery-service',
    number: '6',
    title: 'Réseau de livraison DaloaDelivery',
    summary: 'Tarifs officiels, coursiers indépendants et contrôle GPS.',
    paragraphs: [
      'La livraison est assurée par le réseau de coursiers indépendants partenaires DaloaDelivery.',
      'Tarifs officiels : forfait de base 500 FCFA pour les premiers 1,5 km, puis 85 FCFA par km supplémentaire, calculés par géolocalisation précise.',
      'Le coursier perçoit 90% des frais de livraison. Une validation de proximité GPS (moins de 100 mètres) est exigée pour garantir la livraison au bon endroit.',
    ],
  },
  {
    id: 'seller-pro',
    number: '7',
    title: 'Pass Vendeur Pro & Visibilité',
    summary: 'Avantages Pro, badge certifié, livreurs affiliés et options Boost.',
    paragraphs: [
      'Le Pass Vendeur Pro est proposé à 2 500 FCFA / mois ou 25 000 FCFA / an (2 mois offerts).',
      `Il confère le badge Vendeur Pro vérifié, une priorité de classement et la commission réduite à ${FEES.sellerProPct}${phase.noSellerCommission ? ' lorsque la grille de commission entrera en vigueur' : ''}.`,
      phase.proFeaturesOpenToAll
        ? 'Pendant la phase de lancement, le paiement à la livraison, le retrait sur place et l’affiliation de coursiers sont ouverts à tous les vendeurs, Pro ou non. Ces fonctionnalités redeviendront des avantages réservés au Pass Vendeur Pro à l’issue de cette phase.'
        : 'Le paiement à la livraison, le retrait sur place et l’affiliation de coursiers sont réservés aux titulaires du Pass Vendeur Pro.',
      `Options de visibilité : Boost payé en crédits (${VISIBILITY.boostOptions}), crédits achetés en packs (${VISIBILITY.creditPacks}).`,
    ],
  },
  {
    id: 'reviews',
    number: '8',
    title: 'Avis, Notations et Modération',
    summary: 'Transparence des évaluations et lutte contre les faux avis.',
    paragraphs: [
      'Seuls les utilisateurs ayant finalisé une transaction ou commande peuvent déposer un avis et une note.',
      'Tout avis diffamatoire, insultant ou constituant une tentative de déstabilisation commerciale est supprimé après signalement.',
    ],
  },
  {
    id: 'liability',
    number: '9',
    title: 'Responsabilité, Transactions hors plateforme & Litiges',
    summary: 'Exonération totale hors plateforme, droit applicable ivoirien et arbitrage.',
    paragraphs: [
      'DaloaMarket agit en qualité d’hébergeur technique et de tiers de confiance exclusivement pour les transactions conclues et payées via la plateforme.',
      'Mise en garde formelle : DaloaMarket n’encourage aucune opération en dehors de la plateforme. Tout accord financier, paiement direct ou livraison convenu hors de l’application relève de la responsabilité exclusive des parties. DaloaMarket décline formellement toute responsabilité civile, commerciale ou pénale et ne mènera aucune action, médiation, enquête ni remboursement pour tout litige survenu hors plateforme.',
      'En cas de contestation relative à une commande sous séquestre menée sur la plateforme, le service client bloque le paiement et procède à un arbitrage impartial sous 48 heures.',
      'Les présentes CGU sont régies par le droit de la République de Côte d’Ivoire. Tout différend non résolu à l’amiable relève des tribunaux compétents de Daloa.',
    ],
  },
  {
    id: 'contact',
    number: '10',
    title: 'Contact & Service d’Assistance',
    summary: 'Canaux officiels pour joindre l’équipe support.',
    paragraphs: [
      'Pour toute question, réclamation ou signalement, notre équipe locale est joignable :',
      'Email officiel : support@daloamarket.com',
      'Assistance WhatsApp & Téléphone : via le bouton dédié dans l’application',
      'Siège opérationnel : Daloa, République de Côte d’Ivoire',
    ],
  },
];
