export type MobileMoneyNetwork = 'wave' | 'orange' | 'mtn' | 'moov';

export interface PaymentIntentRequest {
  orderId: string;
  amount: number;
  customerPhone: string;
  customerName: string;
  network: MobileMoneyNetwork;
  returnUrl?: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  token?: string;
  message?: string;
}

export interface PayoutRequest {
  userId: string;
  recipientType: 'seller' | 'driver';
  amount: number;
  network: MobileMoneyNetwork;
  phone: string;
}

export interface PayoutSettings {
  network: MobileMoneyNetwork;
  phone: string;
  accountName?: string | null;
  isActive: boolean;
  lockedUntil?: string | null;
}
