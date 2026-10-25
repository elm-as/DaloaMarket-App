import { supabase } from '../supabase';
import {
  ExpressDeliveryInput,
  ExpressDeliveryResult,
  Coordinates,
} from '@daloa/types';
import { haversineDistance } from '@daloa/utils';
import {
  DALOA_CENTER,
  DALOA_DISTRICT_COORDINATES,
  calculateDeliveryFee,
  reconcileRoadDistanceKm,
} from '@daloa/config';

/** Part de commission retenue par la plateforme (10%) */
const PLATFORM_COMMISSION_RATE = 0.1;

export const expressDeliveryService = {
  /**
   * Calcule un devis kilométrique officiel instantané en direct pour une course express
   */
  estimateExpressDelivery(params: {
    pickupDistrict: string;
    dropoffDistrict: string;
    pickupCoords?: Coordinates | null;
    dropoffCoords?: Coordinates | null;
    roadKm?: number | null;
  }): {
    distanceKm: number;
    deliveryFee: number;
    driverNetGain: number;
    platformCommission: number;
  } {
    const pCoord =
      params.pickupCoords ||
      (DALOA_DISTRICT_COORDINATES as any)[params.pickupDistrict] ||
      DALOA_CENTER;
    const dCoord =
      params.dropoffCoords ||
      (DALOA_DISTRICT_COORDINATES as any)[params.dropoffDistrict] ||
      DALOA_CENTER;

    const straightKm = haversineDistance(
      { lat: pCoord.lat ?? pCoord.latitude, lng: pCoord.lng ?? pCoord.longitude },
      { lat: dCoord.lat ?? dCoord.latitude, lng: dCoord.lng ?? dCoord.longitude }
    );

    const distanceKm = reconcileRoadDistanceKm(params.roadKm, straightKm);
    const deliveryFee = calculateDeliveryFee(distanceKm);
    const platformCommission = Math.round(deliveryFee * PLATFORM_COMMISSION_RATE);
    const driverNetGain = deliveryFee - platformCommission;

    return {
      distanceKm,
      deliveryFee,
      driverNetGain,
      platformCommission,
    };
  },

  /**
   * Crée une course express directe à Daloa via la RPC certifiée `create_express_delivery_run`
   */
  async createExpressRun(input: ExpressDeliveryInput): Promise<ExpressDeliveryResult> {
    const { data, error } = await supabase.rpc('create_express_delivery_run' as any, {
      p_pickup_district: input.pickupDistrict,
      p_pickup_address: input.pickupAddress,
      p_pickup_lat: input.pickupLat ?? null,
      p_pickup_lng: input.pickupLng ?? null,
      p_dropoff_district: input.dropoffDistrict,
      p_dropoff_address: input.dropoffAddress,
      p_dropoff_lat: input.dropoffLat ?? null,
      p_dropoff_lng: input.dropoffLng ?? null,
      p_package_type: input.packageType || 'parcel',
      p_package_description: input.packageDescription || 'Colis Express Hors-Market',
      p_sender_name: input.senderName,
      p_sender_phone: input.senderPhone,
      p_recipient_name: input.recipientName,
      p_recipient_phone: input.recipientPhone,
      p_payer_role: input.payerRole || 'sender',
      p_payment_method: input.paymentMethod || 'cash',
      p_road_km: input.roadKm ?? null,
    } as any);

    if (error) {
      return {
        success: false,
        error: error.message || 'Impossible de créer la course express.',
      };
    }

    const res = data as any;
    if (!res || !res.success) {
      return {
        success: false,
        reason: res?.reason,
        error: res?.reason || 'Erreur lors de la validation de la course express.',
      };
    }

    return {
      success: true,
      orderId: res.order_id,
      assignmentId: res.assignment_id,
      deliveryFee: Number(res.delivery_fee) || 500,
      distanceKm: Number(res.distance_km) || 1,
      driverNetGain: Number(res.driver_net_gain) || 450,
      pickupOtp: res.pickup_otp,
      deliveryOtp: res.delivery_otp,
    };
  },

  /**
   * Génère l'URL WhatsApp avec message pré-rempli pour envoyer le code OTP au destinataire
   */
  generateRecipientWhatsAppUrl(params: {
    recipientPhone?: string | null;
    recipientName: string;
    deliveryOtp: string;
    orderId: string;
    senderName?: string;
    packageTypeLabel?: string;
    payerRole?: 'sender' | 'recipient';
    deliveryFee?: number;
  }): string {
    const cleanPhone = (params.recipientPhone || '').replace(/\D/g, '');
    const internationalPhone =
      cleanPhone.length === 10 ? `225${cleanPhone}` : cleanPhone;

    const paymentLine =
      params.payerRole === 'recipient'
        ? `💰 Frais de livraison : ${params.deliveryFee ? `${params.deliveryFee} FCFA` : 'à régler'} au livreur.`
        : `💰 Frais de livraison : 0 FCFA (Déjà réglé par l'expéditeur).`;

    const message = [
      `Bonjour ${params.recipientName || ''},`,
      `${params.senderName || "L'expéditeur"} vous envoie un colis via DaloaDelivery Express 🛵📦.`,
      params.packageTypeLabel ? `Format : ${params.packageTypeLabel}` : null,
      paymentLine,
      ``,
      `🔐 Votre code secret de remise est : ${params.deliveryOtp}`,
      `Communiquez ce code au coursier uniquement quand vous recevez le colis en main propre.`,
      ``,
      `Suivez l'arrivée de votre coursier en direct :`,
      `https://daloamarket.com/order/${params.orderId}`,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const encoded = encodeURIComponent(message);
    return internationalPhone
      ? `https://wa.me/${internationalPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  },
};
