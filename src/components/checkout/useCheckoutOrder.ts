import { useState } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Haptics } from '@daloa/utils';
import { ordersService, paymentService, analyticsService } from '@daloa/api';
import { PaymentMode, MobileMoneyOperator } from './PaymentMethodSelector';

async function openPaymentGateway(paymentUrl: string) {
  if (Platform.OS === 'web') {
    window.location.href = paymentUrl;
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(paymentUrl);
  } catch (err) {
    console.warn('[Checkout] WebBrowser a échoué, repli sur Linking:', err);
    await Linking.openURL(paymentUrl);
  }
}

interface UseCheckoutOrderParams {
  user: any;
  profile: any;
  listingId?: string;
  variantId?: string;
  variant?: any;
  quantity: number;
  listing?: any;
  activePrice: number;
  breakdown: { totalAmount: number };
  isCartMode: boolean;
  cartItems: any[];
  clearCart: () => void;
  deliveryMode: 'delivery' | 'pickup';
  deliveryDistrict: string;
  deliveryCoords: { latitude: number; longitude: number } | null;
  deliveryAddress: string;
  buyerPhone: string;
  paymentMode: PaymentMode;
  operator: MobileMoneyOperator;
  onlineDisabled: boolean;
  paymentConfigNotice?: string;
}

export function useCheckoutOrder(params: UseCheckoutOrderParams) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitOrder = async () => {
    if (!params.user) {
      router.push('/auth/login' as any);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (params.onlineDisabled && params.paymentMode === 'online') {
        setErrorMsg(
          params.paymentConfigNotice ||
            'Le paiement en ligne est momentanément indisponible. Veuillez choisir le paiement à la livraison.'
        );
        setIsSubmitting(false);
        return;
      }

      const fullAddress =
        params.deliveryMode === 'delivery'
          ? params.deliveryAddress.trim()
          : 'Retrait direct en boutique';

      // ══ 1. MODE PANIER (multi-articles / multi-vendeurs) ══
      if (params.isCartMode) {
        if (params.paymentMode === 'online') {
          const orderInputs = params.cartItems.map((ci) => ({
            buyer_id: params.user.id,
            listing_id: ci.listing.id,
            variant_id: ci.variant?.id || undefined,
            quantity: ci.quantity,
            delivery_address: fullAddress,
            delivery_lat: params.deliveryCoords?.latitude ?? undefined,
            delivery_lng: params.deliveryCoords?.longitude ?? undefined,
            delivery_mode: params.deliveryMode,
          }));

          const result = await paymentService.initiatePayment({
            type: 'order',
            amount: params.breakdown.totalAmount,
            userId: params.user.id,
            customerName: params.profile?.full_name || 'Client DaloaMarket',
            customerPhone: params.buyerPhone.trim(),
            orderInput: orderInputs[0],
            orderInputs,
          } as any);

          if (!result.paymentUrl) throw new Error('Lien de paiement indisponible. Réessayez.');

          Haptics.success();
          params.clearCart();
          await openPaymentGateway(result.paymentUrl);
          if (Platform.OS === 'web') return;

          let orderId: string | null = null;
          if (result.transactionId) {
            for (let i = 0; i < 4 && !orderId; i++) {
              const check = await paymentService.checkPaymentByTransaction(result.transactionId);
              orderId = check.orderId;
              if (!orderId) await new Promise((r) => setTimeout(r, 1500));
            }
          }
          params.clearCart();
          if (orderId) {
            router.replace(`/order/${orderId}` as any);
          } else {
            Alert.alert(
              'Paiement en cours de validation',
              'Dès la confirmation, vos commandes apparaîtront dans « Mes commandes ».',
              [{ text: 'Voir mes commandes', onPress: () => router.replace('/(tabs)/orders' as any) }]
            );
          }
          return;
        }

        // COD / espèces : commandes groupées par vendeur
        const codMethod = params.paymentMode === 'cod' ? 'cod' : 'cash';
        const firstOrderId = await ordersService.createCartOrders(params.user.id, params.cartItems, {
          deliveryMode: params.deliveryMode,
          paymentMethod: codMethod,
          fullAddress,
          deliveryLat: params.deliveryCoords?.latitude,
          deliveryLng: params.deliveryCoords?.longitude,
        });
        params.clearCart();
        Haptics.success();
        if (firstOrderId) router.replace(`/order/${firstOrderId}` as any);
        else router.replace('/(tabs)/orders' as any);
        return;
      }

      // ══ 2. COMMANDE DIRECTE (un seul article) ══
      if (params.paymentMode === 'online') {
        const result = await paymentService.initiatePayment({
          type: 'order',
          amount: params.breakdown.totalAmount,
          userId: params.user.id,
          customerName: params.profile?.full_name || 'Client DaloaMarket',
          customerPhone: params.buyerPhone.trim(),
          orderInput: {
            buyer_id: params.user.id,
            listing_id: params.listingId,
            variant_id: params.variantId || undefined,
            quantity: params.quantity,
            delivery_address: fullAddress,
            delivery_lat: params.deliveryCoords?.latitude ?? undefined,
            delivery_lng: params.deliveryCoords?.longitude ?? undefined,
            delivery_mode: params.deliveryMode,
          },
        });

        if (!result.paymentUrl) throw new Error('Lien de paiement indisponible. Réessayez.');

        analyticsService.logEvent({
          eventName: 'purchase',
          userId: params.user.id,
          listingId: params.listingId,
          props: {
            category: params.listing?.category,
            amount: params.breakdown.totalAmount,
            quantity: params.quantity,
            payment_method: params.operator,
            transactionId: result.transactionId,
          },
        });

        Haptics.success();
        await openPaymentGateway(result.paymentUrl);
        if (Platform.OS === 'web') return;

        let orderId: string | null = null;
        if (result.transactionId) {
          for (let i = 0; i < 4 && !orderId; i++) {
            const check = await paymentService.checkPaymentByTransaction(result.transactionId);
            orderId = check.orderId;
            if (!orderId) await new Promise((r) => setTimeout(r, 1500));
          }
        }

        if (orderId) {
          router.replace(`/order/${orderId}` as any);
        } else {
          Alert.alert(
            'Paiement en cours de validation',
            'Dès la confirmation Mobile Money, votre commande apparaîtra dans « Mes commandes ».',
            [{ text: 'Voir mes commandes', onPress: () => router.replace('/(tabs)/orders' as any) }]
          );
        }
        return;
      }

      // ══ 3. COD / Retrait boutique (aucun paiement en ligne) ══
      const effectivePaymentMethod = params.paymentMode === 'cod' ? 'cod' : 'cash';
      const order = await ordersService.createOrder(params.user.id, {
        listing_id: params.listingId!,
        variant_id: params.variantId || null,
        variant_label: params.variant?.label || null,
        quantity: params.quantity,
        delivery_mode: params.deliveryMode,
        payment_method: effectivePaymentMethod as any,
        delivery_address: fullAddress,
        delivery_district: params.deliveryDistrict,
        delivery_lat: params.deliveryCoords?.latitude,
        delivery_lng: params.deliveryCoords?.longitude,
        buyer_phone: params.buyerPhone.trim(),
      });

      analyticsService.logEvent({
        eventName: 'purchase',
        userId: params.user.id,
        listingId: params.listingId,
        props: {
          orderId: order.id,
          category: params.listing?.category,
          amount: params.breakdown.totalAmount,
          quantity: params.quantity,
          payment_method: effectivePaymentMethod,
        },
      });

      Haptics.success();
      router.replace(`/order/${order.id}` as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    errorMsg,
    setErrorMsg,
    submitOrder,
  };
}
