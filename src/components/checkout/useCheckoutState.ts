import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { DALOA_CENTER, DALOA_DISTRICT_COORDINATES } from '@daloa/config';
import { Haptics, isLocationInDaloa, withTimeout, GPS_TIMEOUT_MS, resolveBuyerPoint } from '@daloa/utils';
import { analyticsService } from '@daloa/api';
import type { AppliedMobilePromo } from './PromoCodeBox';
import type { PaymentMode, MobileMoneyOperator } from './PaymentMethodSelector';
import { useCheckoutOrder } from './useCheckoutOrder';
import { useCheckoutQuoteAndPricing } from './useCheckoutQuoteAndPricing';

interface UseCheckoutStateParams {
  user: any;
  profile: any;
  isAuthenticated: boolean;
  listingId?: string;
  variantId?: string;
  quantity: number;
  isCartMode: boolean;
  cartItems: any[];
  clearCart: () => void;
  listing: any;
  settings: any;
  phase: {
    isPhase0: boolean;
    phaseConfig: any;
    allowCodForAll: boolean;
    allowPickupForAll: boolean;
  };
}

export function useCheckoutState(params: UseCheckoutStateParams) {
  const {
    user,
    profile,
    isAuthenticated,
    listingId,
    variantId,
    quantity,
    isCartMode,
    cartItems,
    clearCart,
    listing,
    settings,
    phase,
  } = params;

  const cartProductTotal = cartItems.reduce(
    (s, ci) => s + (ci.variant?.price ?? ci.listing.price) * ci.quantity,
    0
  );
  const cartQtyTotal = cartItems.reduce((s, ci) => s + ci.quantity, 0);
  const cartSellerCount = new Set(cartItems.map((ci) => ci.listing.user_id || ci.listing.seller?.id)).size;

  const paymentConfig = settings?.paymentConfig;
  const onlineDisabled = Boolean(paymentConfig?.disable_online_payments || paymentConfig?.force_cod_only);
  const variant = listing?.variants?.find((v: any) => v.id === variantId);
  const activePrice = variant?.price ?? listing?.price ?? 0;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(profile?.district || 'Tazibouo');
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>(profile?.phone || '');
  const [operator, setOperator] = useState<MobileMoneyOperator>('wave');
  const [appliedPromo, setAppliedPromo] = useState<AppliedMobilePromo | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const isDigital = !isCartMode && listing?.category === 'digital';
  const isSellerPro = Boolean(
    !isCartMode && listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date()
  );
  const isBuyerCodBlocked = Boolean(
    profile?.cod_blocked_until && new Date(profile.cod_blocked_until).getTime() > Date.now()
  );
  const isCodAllowed = (phase.allowCodForAll || isSellerPro) && !isBuyerCodBlocked;
  const isPickupAllowed = phase.allowPickupForAll || isSellerPro || isDigital;

  const [paymentMode, setPaymentMode] = useState<PaymentMode>(() => {
    if (onlineDisabled) {
      return (deliveryMode === 'pickup' || isDigital) && isPickupAllowed ? 'cash_at_shop' : 'cod';
    }
    return (phase.phaseConfig?.default_payment_method === 'cod' || phase.isPhase0) && isCodAllowed ? 'cod' : 'online';
  });

  useEffect(() => {
    if (isDigital) {
      if (deliveryMode !== 'pickup') setDeliveryMode('pickup');
      return;
    }
    if (!isPickupAllowed && deliveryMode === 'pickup') setDeliveryMode('delivery');
    if (onlineDisabled) {
      if (paymentMode === 'online') {
        setPaymentMode(deliveryMode === 'pickup' && isPickupAllowed ? 'cash_at_shop' : 'cod');
      }
      return;
    }
    if (!isCodAllowed && paymentMode === 'cod') setPaymentMode('online');
    if (!isPickupAllowed && paymentMode === 'cash_at_shop') setPaymentMode('online');
  }, [isDigital, isCodAllowed, isPickupAllowed, deliveryMode, paymentMode, onlineDisabled]);

  const pricing = useCheckoutQuoteAndPricing({
    isCartMode,
    cartItems,
    listing,
    listingId,
    variantId,
    activePrice,
    quantity,
    cartProductTotal,
    cartQtyTotal,
    cartSellerCount,
    deliveryMode,
    paymentMode,
    deliveryDistrict,
    deliveryCoords,
    deliveryAddress,
    step,
    isAuthenticated,
    sellerFeeOverride: phase.phaseConfig?.seller_fee_override ?? null,
    appliedPromo,
  });

  const { isSubmitting, errorMsg, setErrorMsg, submitOrder } = useCheckoutOrder({
    user,
    profile,
    listingId,
    variantId,
    variant,
    quantity,
    listing,
    activePrice,
    breakdown: pricing.breakdown,
    daloaCashDiscount: pricing.daloaCashDiscount,
    distanceKm: pricing.distanceKm,
    isCartMode,
    cartItems,
    clearCart,
    deliveryMode,
    deliveryDistrict,
    deliveryCoords,
    deliveryAddress,
    buyerPhone,
    paymentMode,
    operator,
    onlineDisabled,
    paymentConfigNotice: paymentConfig?.notice,
    quote: pricing.priceStatus === 'ready' && pricing.serverQuote ? pricing.serverQuote : null,
    onQuoteInvalid: () => {
      pricing.refetchQuote();
    },
  });

  useEffect(() => {
    if (step === 3 && pricing.isQuoteError && pricing.quoteError && (pricing.quoteError as any).reason) {
      setErrorMsg((pricing.quoteError as any).message || null);
    }
  }, [step, pricing.isQuoteError, pricing.quoteError, setErrorMsg]);

  useEffect(() => {
    if (!listing?.id) return;
    analyticsService.logEvent({
      eventName: 'checkout_start',
      userId: user?.id ?? null,
      listingId: listing.id,
      props: { category: listing.category, price: activePrice, quantity },
    });
  }, [listing?.id, user?.id, listing?.category, activePrice, quantity]);

  const handleRequestGps = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setIsLocatingGps(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!isSilent) setErrorMsg('Veuillez autoriser l’accès GPS pour que le coursier puisse vous livrer.');
          return;
        }
        const loc = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          GPS_TIMEOUT_MS,
          () => Location.getLastKnownPositionAsync()
        );
        if (!loc?.coords && !isSilent) {
          setErrorMsg('Position GPS introuvable. Vérifiez que la localisation de votre appareil est activée.');
          return;
        }
        if (loc?.coords) {
          const { latitude, longitude } = loc.coords;
          if (isLocationInDaloa(latitude, longitude)) {
            setDeliveryCoords({ latitude, longitude });
            setErrorMsg(null);
            Haptics.success();
          } else {
            const fallback = (deliveryDistrict && DALOA_DISTRICT_COORDINATES[deliveryDistrict]) || DALOA_CENTER;
            setDeliveryCoords({
              latitude: (fallback as any).latitude ?? (fallback as any).lat,
              longitude: (fallback as any).longitude ?? (fallback as any).lng,
            });
            if (!isSilent) setErrorMsg(`Position calée sur ${deliveryDistrict || 'Daloa'} (GPS hors zone).`);
            Haptics.selection();
          }
        }
      } catch (err) {
        console.warn('[Checkout GPS] Erreur géolocalisation:', err);
        if (!isSilent) setErrorMsg('Position GPS introuvable. Vérifiez que la localisation de votre appareil est activée.');
      } finally {
        if (!isSilent) setIsLocatingGps(false);
      }
    },
    [deliveryDistrict, setErrorMsg]
  );

  useEffect(() => {
    if (deliveryMode === 'delivery' && !deliveryCoords) {
      handleRequestGps(true);
    }
  }, [deliveryMode, deliveryCoords, handleRequestGps]);

  const handleSelectDistrict = (d: string) => {
    setDeliveryDistrict(d);
    if (d && DALOA_DISTRICT_COORDINATES[d]) setDeliveryCoords(DALOA_DISTRICT_COORDINATES[d]);
    setIsDistrictPickerOpen(false);
  };

  const handleStep2Next = () => {
    if (deliveryMode === 'delivery' && !isDigital) {
      if (!deliveryDistrict.trim()) {
        setErrorMsg('Veuillez sélectionner votre quartier à Daloa.');
        return;
      }
      if (!deliveryAddress.trim()) {
        setErrorMsg('Veuillez préciser votre repère ou adresse de livraison.');
        return;
      }
      if (!deliveryCoords?.latitude || !deliveryCoords?.longitude) {
        setDeliveryCoords(resolveBuyerPoint(null, deliveryDistrict));
      }
    }
    if (!buyerPhone.trim() || buyerPhone.length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone de contact valide.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  return {
    step,
    setStep,
    deliveryMode,
    setDeliveryMode,
    deliveryDistrict,
    deliveryCoords,
    setDeliveryCoords,
    isDistrictPickerOpen,
    setIsDistrictPickerOpen,
    deliveryAddress,
    setDeliveryAddress,
    buyerPhone,
    setBuyerPhone,
    paymentMode,
    setPaymentMode,
    operator,
    setOperator,
    appliedPromo,
    setAppliedPromo,
    isLocatingGps,
    handleRequestGps,
    handleSelectDistrict,
    handleStep2Next,
    isDigital,
    isBuyerCodBlocked,
    isCodAllowed,
    isPickupAllowed,
    onlineDisabled,
    paymentConfig,
    variant,
    activePrice,
    cartProductTotal,
    cartSellerCount,
    isSubmitting,
    errorMsg,
    setErrorMsg,
    submitOrder,
    pricing,
  };
}
