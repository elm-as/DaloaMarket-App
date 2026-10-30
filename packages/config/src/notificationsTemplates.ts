export interface NotificationTemplate {
  key: string;
  target: 'buyer' | 'seller' | 'driver' | 'all';
  title: string;
  body: string;
  defaultRoute: string;
  tag: string;
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // Commandes Acheteurs / Vendeurs
  ORDER_RECEIVED: {
    key: 'ORDER_RECEIVED',
    target: 'seller',
    title: '📦 Nouvelle commande reçue !',
    body: 'Un acheteur a payé sa commande en séquestre sécurisé. Prépare le colis dès maintenant.',
    defaultRoute: '/(tabs)/orders',
    tag: 'order-received',
  },
  ORDER_PAID: {
    key: 'ORDER_PAID',
    target: 'buyer',
    title: '💳 Paiement sécurisé validé !',
    body: 'Ton argent est placé en séquestre sécurisé. Le vendeur prépare ta commande.',
    defaultRoute: '/(tabs)/orders',
    tag: 'order-paid',
  },
  ORDER_ACCEPTED: {
    key: 'ORDER_ACCEPTED',
    target: 'buyer',
    title: '🚚 Livreur assigné !',
    body: 'Un livreur partenaire a accepté de prendre en charge ta livraison.',
    defaultRoute: '/(tabs)/orders',
    tag: 'order-driver-assigned',
  },
  ORDER_PICKED_UP: {
    key: 'ORDER_PICKED_UP',
    target: 'buyer',
    title: '🛵 Colis ramassé chez le vendeur !',
    body: 'Le livreur a récupéré ton colis et est en route vers ton adresse.',
    defaultRoute: '/(tabs)/orders',
    tag: 'order-picked-up',
  },
  ORDER_DELIVERED: {
    key: 'ORDER_DELIVERED',
    target: 'buyer',
    title: '🎉 Commande livrée avec succès !',
    body: 'Donne ton code OTP de livraison au livreur pour confirmer la bonne réception.',
    defaultRoute: '/(tabs)/orders',
    tag: 'order-delivered',
  },
  ORDER_FUNDS_RELEASED: {
    key: 'ORDER_FUNDS_RELEASED',
    target: 'seller',
    title: '💰 Fonds débloqués sur ton compte !',
    body: 'La livraison a été validée. Ton argent est prêt pour le retrait Mobile Money.',
    defaultRoute: '/pro/revenue',
    tag: 'funds-released',
  },
  ORDER_DISPUTED: {
    key: 'ORDER_DISPUTED',
    target: 'all',
    title: '⚠️ Litige ouvert sur une commande',
    body: 'Un problème a été signalé sur la commande. L’équipe DaloaMarket examine le dossier.',
    defaultRoute: '/(tabs)/orders',
    tag: 'order-dispute',
  },

  // Courses Livreurs (DaloaDelivery)
  DRIVER_RUN_AVAILABLE: {
    key: 'DRIVER_RUN_AVAILABLE',
    target: 'driver',
    title: '⚡ Nouvelle course disponible à Daloa !',
    body: 'Une livraison attend un coursier dans ton secteur. Ouvre l’app pour l’accepter !',
    defaultRoute: '/(tabs)/available',
    tag: 'run-available',
  },
  DRIVER_RUN_ASSIGNED: {
    key: 'DRIVER_RUN_ASSIGNED',
    target: 'driver',
    title: '🛵 Course confirmée !',
    body: 'Rends-toi chez le vendeur pour effectuer le ramassage avec le code OTP.',
    defaultRoute: '/(tabs)/index',
    tag: 'run-assigned',
  },

  // Marketing & WhatsApp Viralité Vendeurs
  WHATSAPP_STATUS_MORNING: {
    key: 'WHATSAPP_STATUS_MORNING',
    target: 'seller',
    title: '📲 Fini d’envoyer 30 photos floues sur WhatsApp !',
    body: 'Partage le lien de ta boutique DaloaMarket sur ton statut. Tes clients voient tout en 1 clic.',
    defaultRoute: '/(tabs)/profile',
    tag: 'whatsapp-status-no-blur',
  },
  WHATSAPP_STATUS_NEW_STOCK: {
    key: 'WHATSAPP_STATUS_NEW_STOCK',
    target: 'seller',
    title: '🚀 Nouvel arrivage en stock ?',
    body: 'Publie tes nouveautés sur DaloaMarket et partage le lien pour booster tes ventes du jour !',
    defaultRoute: '/listing/create',
    tag: 'whatsapp-status-new-stock',
  },

  // Sondages WhatsApp & Avis de la communauté
  SURVEY_WHAT_TO_BUY: {
    key: 'SURVEY_WHAT_TO_BUY',
    target: 'all',
    title: '📊 Sondage : Que veux-tu acheter sur DaloaMarket ?',
    body: "Dis-nous en 1 clic ce qui t'intéresse sur notre chaîne WhatsApp. On sélectionne les meilleurs articles pour toi !",
    defaultRoute: 'https://whatsapp.com/channel/0029Vb94o2vJENy5kkADR42U',
    tag: 'survey-what-to-buy',
  },
  SURVEY_CANT_FIND: {
    key: 'SURVEY_CANT_FIND',
    target: 'all',
    title: '💡 Tu ne trouves pas ton bonheur à Daloa ?',
    body: 'Participe au sondage du jour sur la chaîne WhatsApp ! Dis-nous les produits et les prix que tu attends.',
    defaultRoute: 'https://whatsapp.com/channel/0029Vb94o2vJENy5kkADR42U',
    tag: 'survey-cant-find',
  },
  SURVEY_CUSTOM_REQUEST: {
    key: 'SURVEY_CUSTOM_REQUEST',
    target: 'all',
    title: '🎯 Dis-nous ce que tu cherches, on te le trouve !',
    body: 'Un téléphone, des baskets, des mèches ou un meuble ? Donne-nous tes envies dans le sondage WhatsApp !',
    defaultRoute: 'https://whatsapp.com/channel/0029Vb94o2vJENy5kkADR42U',
    tag: 'survey-custom-request',
  },

  // Diversité d'articles & Ventes rapides (Vendeurs)
  DIVERSITY_SELLERS_DEMAND: {
    key: 'DIVERSITY_SELLERS_DEMAND',
    target: 'seller',
    title: '👕 Vendeurs : les acheteurs demandent de la variété !',
    body: 'Mode, friperie, beauté, accessoires : nos +130 membres cherchent des articles du quotidien. Publie en 1 minute !',
    defaultRoute: '/listing/create',
    tag: 'diversity-sellers-demand',
  },
  DIVERSITY_LOW_PRICES: {
    key: 'DIVERSITY_LOW_PRICES',
    target: 'seller',
    title: '🏷️ Les articles à petits prix partent le plus vite !',
    body: 'Des articles entre 1 000 F et 10 000 F séduisent immédiatement les acheteurs. Dépose ton offre maintenant !',
    defaultRoute: '/listing/create',
    tag: 'diversity-low-prices',
  },

  // Activation premier achat (Acheteurs)
  FIRST_ORDER_SECURE: {
    key: 'FIRST_ORDER_SECURE',
    target: 'buyer',
    title: '🔥 Prêt pour ta première commande sur DaloaMarket ?',
    body: 'Commande en toute sérénité : paiement sécurisé Mobile Money avec remise par code OTP à la livraison.',
    defaultRoute: '/(tabs)',
    tag: 'first-order-secure',
  },
};
