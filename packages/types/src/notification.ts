export interface PushNotificationPayload {
  to?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export type NotificationTemplateKey =
  | 'ORDER_RECEIVED'
  | 'ORDER_PAID'
  | 'ORDER_ACCEPTED'
  | 'ORDER_PICKED_UP'
  | 'ORDER_IN_TRANSIT'
  | 'ORDER_DELIVERED'
  | 'ORDER_DISPUTED'
  | 'DRIVER_RUN_AVAILABLE'
  | 'DRIVER_RUN_ASSIGNED'
  | 'NEW_CHAT_MESSAGE'
  | 'PAYOUT_PROCESSED'
  | 'PRO_EXPIRING';
