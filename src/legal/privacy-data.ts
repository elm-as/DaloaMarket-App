export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
}

export const PRIVACY_LAST_UPDATE = '2 juillet 2026';

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'intro',
    number: '1',
    title: 'Introduction et principes généraux',
    summary: 'Protection rigoureuse et traitement éthique des données personnelles.',
    paragraphs: [
      'La protection de vos données personnelles est une priorité absolue pour DaloaMarket.',
      'La présente politique s’applique à l’ensemble des services fournis via l’application mobile et le site web daloamarket.com.',
      'Nous traitons vos données conformément à la législation ivoirienne régissant les données à caractère personnel (Loi n° 2013-450) et aux standards stricts de sécurité applicables.',
    ],
  },
  {
    id: 'data-collected',
    number: '2',
    title: 'Données collectées',
    summary: 'Informations d’identification, géolocalisation et transactions.',
    paragraphs: [
      'Nous collectons uniquement les informations indispensables au bon fonctionnement de la mise en relation et de la livraison de vos colis à Daloa.',
    ],
    bullets: [
      'Identité & Contact : nom complet, numéro de téléphone joignable, adresse email',
      'Localisation : quartier de résidence à Daloa et coordonnées GPS lors d’une livraison active',
      'Transactions : historique des commandes, articles publiés, évaluations et avis clients',
      'Sécurité Mobile Money : DaloaMarket ne stocke AUCUN code secret de compte Mobile Money. Les paiements sont chiffrés de bout en bout via Money Fusion.',
    ],
  },
  {
    id: 'purpose',
    number: '3',
    title: 'Utilisation des données',
    summary: 'Finalités du traitement de vos données.',
    paragraphs: [
      'Vos données ne sont ni revendues, ni cédées à des tiers publicitaires. Elles servent exclusivement à :',
    ],
    bullets: [
      'Gérer votre compte, vos annonces et votre boutique en ligne',
      'Permettre la mise en relation et la messagerie sécurisée entre acheteurs et vendeurs',
      'Calculer la distance kilométrique et coordonner les coursiers DaloaDelivery',
      'Détecter et bloquer les tentatives de fraude, usurpation d’identité ou faux profils',
      'Vous envoyer les notifications de commande, validation OTP et messages urgents',
    ],
  },
  {
    id: 'geolocation',
    number: '4',
    title: 'Géolocalisation & Respect de la vie privée',
    summary: 'Utilisation limitée de la position GPS aux commandes en cours.',
    paragraphs: [
      'La localisation précise n’est sollicitée que lorsque vous passez une commande ou activez la livraison en direct.',
      'La position du livreur est retransmise à l’acheteur et au vendeur uniquement pendant la course active.',
      'Dès que la livraison est validée par le code secret OTP, l’enregistrement du flux GPS en continu est immédiatement interrompu.',
    ],
  },
  {
    id: 'security',
    number: '5',
    title: 'Sécurité et hébergement des données',
    summary: 'PostgreSQL chiffré, sessions sécurisées et protocoles SSL/TLS.',
    paragraphs: [
      'Vos données sont hébergées sur une infrastructure Supabase hautement sécurisée avec chiffrement au repos (AES-256) et en transit (TLS 1.3).',
      'Les mots de passe sont hachés de manière irréversible et les identifiants d’accès sont protégés par des clés d’API restreintes avec Row Level Security (RLS).',
    ],
  },
  {
    id: 'retention',
    number: '6',
    title: 'Durée de conservation des données',
    summary: 'Conservation limitée à la durée d’activité de votre compte.',
    paragraphs: [
      'Les données de compte sont conservées tant que celui-ci reste actif.',
      'Les traces de commandes et transactions sont conservées pour une durée légale de 2 ans afin de permettre l’arbitrage des litiges et les obligations comptables.',
      'Les coordonnées GPS temporaires des trajets sont purgées périodiquement.',
    ],
  },
  {
    id: 'user-rights',
    number: '7',
    title: 'Vos droits (Accès, Rectification, Suppression)',
    summary: 'Maîtrise totale sur vos données personnelles.',
    paragraphs: [
      'Conformément à la réglementation ivoirienne, vous disposez d’un droit d’accès, de rectification et d’effacement de toutes vos données.',
      'Vous pouvez demander la suppression définitive de votre compte et de toutes vos annonces directement depuis les réglages de l’application ou en écrivant à support@daloamarket.com.',
    ],
  },
  {
    id: 'contact-dpo',
    number: '8',
    title: 'Délégué à la Protection des Données & Contact',
    summary: 'Canal dédié aux requêtes de confidentialité.',
    paragraphs: [
      'Pour toute question relative à vos données personnelles ou pour exercer vos droits, vous pouvez contacter notre référent DPO :',
      'Email dédié : privacy@daloamarket.com / support@daloamarket.com',
      'Adresse : Direction DaloaMarket, Ville de Daloa, Côte d’Ivoire',
    ],
  },
];
