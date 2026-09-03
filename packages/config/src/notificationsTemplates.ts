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
};
