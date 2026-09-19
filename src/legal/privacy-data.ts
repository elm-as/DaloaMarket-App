export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
}

export const PRIVACY_LAST_UPDATE = '16 septembre 2026';

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
      'Identité & Contact : nom complet, numéro de téléphone joignable, adresse email, photo de profil si vous en ajoutez une',
      'Localisation : quartier de résidence à Daloa, coordonnées GPS du point de livraison, et position de votre boutique ou de vos annonces si vous les renseignez',
      'Transactions : historique des commandes, articles publiés, évaluations et avis clients',
      'Coordonnées de versement : si vous vendez ou livrez, le réseau Mobile Money et le numéro de téléphone sur lequel vos gains doivent être versés. Ce numéro nous est indispensable pour vous payer.',
      'Adresse IP : l’adresse utilisée lors de votre inscription et la dernière adresse de connexion, afin de détecter les comptes frauduleux et les abus. Une adresse à l’origine d’abus répétés peut être bloquée.',
      'Empreinte d’identifiant : à la suppression d’un compte, nous gardons une empreinte cryptographique irréversible (SHA-256) de son adresse e-mail et de son identifiant de connexion (jamais l’adresse elle-même, et l’empreinte ne permet pas de la retrouver). Elle sert uniquement à reconnaître la réinscription d’une personne dont le compte avait été banni ou signalé.',
      'Notifications : si vous les activez, un jeton propre à votre appareil, nécessaire pour vous envoyer les alertes de commande et de message. Vous pouvez les désactiver à tout moment dans les réglages de votre téléphone.',
      'Sécurité Mobile Money : DaloaMarket ne collecte ni ne stocke AUCUN code secret ni code PIN de compte Mobile Money. La saisie s’effectue exclusivement sur l’interface de notre prestataire Money Fusion.',
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
      'Nos sous-traitants sont : Supabase (base de données, authentification, stockage des photos et e-mails transactionnels), Money Fusion (paiements et versements Mobile Money), Mapbox (cartes et calcul d’itinéraires), Expo (avec Apple et Google pour l’acheminement) pour les notifications push, Netlify et Render (hébergement du site et du service de paiement).',
      'Certains de ces prestataires hébergent des données en dehors de la Côte d’Ivoire, notamment en Europe. Les transferts sont encadrés par les engagements contractuels de ces prestataires.',
      'Aucun traceur publicitaire, aucun pixel de suivi et aucun outil de profilage commercial n’est utilisé dans l’application. Aucune donnée de navigation n’est transmise à une régie publicitaire ou à un réseau social.',
    ],
  },
  {
    id: 'retention',
    number: '6',
    title: 'Durée de conservation des données',
    summary: 'Conservation limitée à la durée d’activité de votre compte.',
    paragraphs: [
      'Les données de compte sont conservées tant que celui-ci reste actif. La suppression prend effet immédiatement : nom, téléphone, adresse e-mail, photos et documents sont effacés ou rendus anonymes sans délai, et l’accès est révoqué définitivement.',
      'Les données de commande et de transaction sont conservées jusqu’à 10 ans, conformément aux obligations comptables et fiscales ivoiriennes. Cette conservation s’impose à nous et survit à la suppression de votre compte.',
      'Les adresses IP et journaux techniques sont conservés 12 mois au plus, pour la sécurité, la prévention de la fraude et le diagnostic d’incidents.',
      'Les messages échangés sont conservés au maximum 24 mois, afin de vous donner accès à votre historique et de permettre au support d’instruire un éventuel litige. Une purge automatique hebdomadaire efface les plus anciens.',
      'Les empreintes d’identifiants de comptes supprimés sont conservées 3 ans au titre de la prévention de la fraude, puis effacées automatiquement.',
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
      'Adresse postale : RueO21,68, Yopougon, Abidjan, Côte d’Ivoire',
    ],
  },
];
