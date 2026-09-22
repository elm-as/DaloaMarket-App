import { useState } from 'react';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Haptics } from '@daloa/utils';
import { ordersService, paymentService, analyticsService } from '@daloa/api';
import { PaymentMode, MobileMoneyOperator } from './PaymentMethodSelector';
import { resolveBuyerLocation } from './checkout-location';
import { showAlert } from '@daloa/ui';

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

      const resolvedDeliveryPoint = resolveBuyerLocation(
        params.deliveryCoords,
        params.deliveryDistrict
      );
      const deliveryLat = params.deliveryMode === 'delivery' ? resolvedDeliveryPoint.latitude : undefined;
      const deliveryLng = params.deliveryMode === 'delivery' ? resolvedDeliveryPoint.longitude : undefined;

      // ══ 1. MODE PANIER (multi-articles / multi-vendeurs) ══
      if (params.isCartMode) {
        if (params.paymentMode === 'online') {
          const orderInputs = params.cartItems.map((ci) => ({
            buyer_id: params.user.id,
            listing_id: ci.listing.id,
            variant_id: ci.variant?.id || undefined,
            quantity: ci.quantity,
            delivery_address: fullAddress,
            delivery_lat: deliveryLat,
            delivery_lng: deliveryLng,
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
          if (Platform.OS === 'web') {
            await openPaymentGateway(result.paymentUrl);
            return;
          }

          // Redirection fluide vers l'écran de chargement dédié.
          // Le panier sera vidé par PaymentSuccessScreen dès confirmation du paiement.
          if (result.transactionId) {
            router.replace(`/payment/success?transactionId=${encodeURIComponent(result.transactionId)}&fromCart=1` as any);
          }
          await openPaymentGateway(result.paymentUrl);
          return;
        }

        // COD / espèces : commandes groupées par vendeur
        // Le web ecrit et lit `cash_at_shop`. Ecrire `cash` rendait la commande
        // orpheline cote vendeur web : aucune branche ne matchait, donc aucun bouton.
        const codMethod = params.paymentMode === 'cod' ? 'cod' : 'cash_at_shop';
        const firstOrderId = await ordersService.createCartOrders(params.user.id, params.cartItems, {
          deliveryMode: params.deliveryMode,
          paymentMethod: codMethod,
          fullAddress,
          deliveryLat,
          deliveryLng,
        });
        Haptics.success();
        const targetPath = firstOrderId ? `/order/${firstOrderId}` : '/(tabs)/orders';
        router.replace(targetPath as any);
        setTimeout(() => {
          params.clearCart();
        }, 400);
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
            delivery_lat: deliveryLat,
            delivery_lng: deliveryLng,
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
        if (Platform.OS === 'web') {
          await openPaymentGateway(result.paymentUrl);
          return;
        }

        if (result.transactionId) {
          router.replace(`/payment/success?transactionId=${encodeURIComponent(result.transactionId)}&fromCart=0` as any);
        }
        await openPaymentGateway(result.paymentUrl);
        return;
      }

      // ══ 3. COD / Retrait boutique (aucun paiement en ligne) ══
      const effectivePaymentMethod = params.paymentMode === 'cod' ? 'cod' : 'cash_at_shop';
      const order = await ordersService.createOrder(params.user.id, {
        listing_id: params.listingId!,
        variant_id: params.variantId || null,
        variant_label: params.variant?.label || null,
        quantity: params.quantity,
        delivery_mode: params.deliveryMode,
        payment_method: effectivePaymentMethod as any,
        delivery_address: fullAddress,
        delivery_district: params.deliveryDistrict,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
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
      let msg = err?.message || 'Échec de la commande. Veuillez réessayer.';
      if (msg.includes('insufficient_stock') || msg.includes('stock')) {
        msg = 'Le stock pour cet article est insuffisant pour valider votre commande.';
      } else if (msg.includes('network') || msg.includes('Failed to fetch')) {
        msg = 'Problème de connexion réseau. Veuillez vérifier votre connexion et réessayer.';
      }
      setErrorMsg(msg);
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
