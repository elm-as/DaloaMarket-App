import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent, KeyboardScreen } from '@daloa/ui';
import { ArrowLeft, Lock } from 'lucide-react-native';
import * as Location from 'expo-location';
import { calculateOrderBreakdown, PRICING_CONFIG, DALOA_CENTER, DALOA_DISTRICT_COORDINATES } from '@daloa/config';
import { Haptics, isLocationInDaloa, withTimeout, GPS_TIMEOUT_MS } from '@daloa/utils';
import { useListingDetail, analyticsService, useSystemSettings } from '@daloa/api';
import { usePhase } from '../../src/context/PhaseContext';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { DistrictPickerSheet } from '../../src/components/settings/DistrictPickerSheet';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';
import { CheckoutWizardBar } from '../../src/components/checkout/CheckoutWizardBar';
import { CheckoutStepReception } from '../../src/components/checkout/CheckoutStepReception';
import { CheckoutStepLocation } from '../../src/components/checkout/CheckoutStepLocation';
import { CheckoutStepPayment } from '../../src/components/checkout/CheckoutStepPayment';
import { PaymentMode, MobileMoneyOperator } from '../../src/components/checkout/PaymentMethodSelector';
import { useCheckoutOrder } from '../../src/components/checkout/useCheckoutOrder';
import { resolveSellerPoint, resolveBuyerPoint, resolveBillableDistanceKm } from '@daloa/utils';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

export default function CheckoutScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { listingId, variantId, qty, quantity: qtyParam, cart } = useLocalSearchParams<{
    listingId?: string; variantId?: string; qty?: string; quantity?: string; cart?: string;
  }>();
  const quantity = Math.max(1, parseInt(qty || qtyParam || '1', 10));
  const isCartMode = cart === '1';

  const { user, profile, isAuthenticated } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const { data: listing, isLoading } = useListingDetail(isCartMode ? undefined : listingId);
  const { data: settings } = useSystemSettings();

  // Agrégats panier
  const cartProductTotal = cartItems.reduce((s, ci) => s + (ci.variant?.price ?? ci.listing.price) * ci.quantity, 0);
  const cartQtyTotal = cartItems.reduce((s, ci) => s + ci.quantity, 0);
  const cartSellerCount = new Set(cartItems.map((ci) => ci.listing.user_id || ci.listing.seller?.id)).size;

  const paymentConfig = settings?.paymentConfig;
  const onlineDisabled = Boolean(paymentConfig?.disable_online_payments || paymentConfig?.force_cod_only);

  const variant = listing?.variants?.find((v: any) => v.id === variantId);
  const activePrice = variant?.price ?? listing?.price ?? 0;

  // État du Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(profile?.district || 'Tazibouo');
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(2.5);
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>(profile?.phone || '');
  const { isPhase0, phaseConfig, allowCodForAll, allowPickupForAll } = usePhase();
  // Même règle que create_cod_order : hors phase 0, paiement à la livraison et
  // retrait réservés aux vendeurs Pro. En panier multi-vendeurs, on reste
  // prudent (la base vérifie chaque vendeur).
  const isSellerPro = Boolean(
    !isCartMode && listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date()
  );
  const isCodAllowed = allowCodForAll || isSellerPro;
  const isPickupAllowed = allowPickupForAll || isSellerPro;
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    (phaseConfig?.default_payment_method === 'cod' || isPhase0) && isCodAllowed ? 'cod' : 'online'
  );

  // L'annonce arrive après le premier rendu : si le mode choisi n'est plus
  // autorisé pour ce vendeur, on bascule sur un mode permis.
  useEffect(() => {
    if (!isPickupAllowed && deliveryMode === 'pickup') setDeliveryMode('delivery');
    if (!isCodAllowed && paymentMode === 'cod') setPaymentMode('online');
    if (!isPickupAllowed && paymentMode === 'cash_at_shop') setPaymentMode('online');
  }, [isCodAllowed, isPickupAllowed, deliveryMode, paymentMode]);
  const [operator, setOperator] = useState<MobileMoneyOperator>('wave');

  // Coordonnées résolues du vendeur (en mode panier, prend le premier article du panier)
  const sellerCoords = useMemo(() => {
    if (isCartMode && cartItems.length > 0) {
      return resolveSellerPoint(cartItems[0]?.listing);
    }
    return resolveSellerPoint(listing);
  }, [isCartMode, cartItems, listing]);

  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const handleRequestGps = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLocatingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!isSilent) setErrorMsg('Veuillez autoriser l’accès GPS pour que le coursier puisse vous livrer.');
        return;
      }
      // Sans garde-temps, `getCurrentPositionAsync` ne rend jamais la main
      // quand l'appareil n'obtient pas de fix : le bouton restait figé sur
      // « Localisation… » indéfiniment.
      const loc = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        GPS_TIMEOUT_MS,
        () => Location.getLastKnownPositionAsync()
      );
      if (!loc?.coords && !isSilent) {
        setErrorMsg('Position GPS introuvable. Vérifiez que la localisation de votre appareil est activée.');
      }
      if (loc?.coords) {
        const { latitude, longitude } = loc.coords;
        if (isLocationInDaloa(latitude, longitude)) {
          setDeliveryCoords({ latitude, longitude });
          setErrorMsg(null);
          Haptics.success();
        } else {
          const fallback = (deliveryDistrict && DALOA_DISTRICT_COORDINATES[deliveryDistrict]) || DALOA_CENTER;
          const fbLat = (fallback as any).latitude ?? (fallback as any).lat;
          const fbLng = (fallback as any).longitude ?? (fallback as any).lng;
          setDeliveryCoords({ latitude: fbLat, longitude: fbLng });
          if (!isSilent) setErrorMsg(`Position calée sur ${deliveryDistrict || 'Daloa'} (GPS hors zone).`);
          Haptics.selection();
        }
      }
    } catch {
      if (!isSilent) setErrorMsg('Position GPS introuvable. Vérifiez que la localisation de votre appareil est activée.');
    } finally {
      if (!isSilent) setIsLocatingGps(false);
    }
  }, [deliveryDistrict]);

  useEffect(() => {
    if (deliveryMode === 'delivery' && !deliveryCoords) {
      handleRequestGps(true);
    }
  }, [deliveryMode, handleRequestGps]);

  // Calcul dynamique de la distance via Mapbox dès que les positions vendeur ou acheteur changent
  useEffect(() => {
    let active = true;
    const buyerPoint = resolveBuyerPoint(deliveryCoords, deliveryDistrict);

    resolveBillableDistanceKm(sellerCoords, buyerPoint).then((calculatedDistance) => {
      if (active && calculatedDistance > 0) {
        setDistanceKm(calculatedDistance);
      }
    });

    return () => {
      active = false;
    };
  }, [sellerCoords, deliveryCoords, deliveryDistrict]);

  const estimatedCartDelivery = deliveryMode === 'pickup' ? 0 : PRICING_CONFIG.delivery.baseFee * Math.max(1, cartSellerCount);
  const cartBuyerServiceFee = Math.round(cartProductTotal * PRICING_CONFIG.marketplace.buyerServiceFeeRate);

  const breakdown = isCartMode
    ? {
        productPrice: cartProductTotal, quantity: cartQtyTotal, productSubtotal: cartProductTotal,
        deliveryFee: estimatedCartDelivery, buyerServiceFee: cartBuyerServiceFee,
        totalAmount: cartProductTotal + estimatedCartDelivery + cartBuyerServiceFee,
        sellerCommission: 0, sellerNetPayout: cartProductTotal, driverFee: 0, driverNetPayout: estimatedCartDelivery,
      }
    : calculateOrderBreakdown({
        productPrice: activePrice, quantity, distanceKm, deliveryMode,
        isProSeller: Boolean(listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date()),
        // Même règle que la base : commission imposée par la phase si elle existe.
        sellerFeeOverride: phaseConfig?.seller_fee_override ?? null,
      });

  const { isSubmitting, errorMsg, setErrorMsg, submitOrder } = useCheckoutOrder({
    user, profile, listingId, variantId, variant, quantity, listing, activePrice, breakdown,
    distanceKm,
    isCartMode, cartItems, clearCart, deliveryMode, deliveryDistrict, deliveryCoords,
    deliveryAddress, buyerPhone, paymentMode, operator, onlineDisabled,
    paymentConfigNotice: paymentConfig?.notice,
  });

  useEffect(() => {
    if (!onlineDisabled) return;
    if (paymentMode === 'online') {
      setPaymentMode(deliveryMode === 'pickup' ? 'cash_at_shop' : 'cod');
    }
  }, [onlineDisabled, paymentMode, deliveryMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  useEffect(() => {
    if (!listing?.id) return;
    analyticsService.logEvent({
      eventName: 'checkout_start',
      userId: user?.id ?? null,
      listingId: listing.id,
      props: { category: listing.category, price: activePrice, quantity },
    });
  }, [listing?.id, user?.id]);

  if (!isAuthenticated || !user) {
    return (
      <AuthGuardView
        title="Connexion requise pour commander"
        description="Connectez-vous à votre compte DaloaMarket pour finaliser votre commande et sécuriser votre achat."
        fallbackRoute="/(tabs)/cart"
      />
    );
  }

  if (!isCartMode && (isLoading || !listing)) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={accent.DEFAULT} />
        <AppText variant="body" color={colors.text.muted}>Chargement de la commande...</AppText>
      </View>
    );
  }

  if (isCartMode && cartItems.length === 0) {
    return (
      <View style={styles.loadingBox}>
        <AppText variant="body" color={colors.text.muted}>Votre panier est vide.</AppText>
      </View>
    );
  }

  const handleSelectDistrict = (d: string) => {
    setDeliveryDistrict(d);
    if (d && DALOA_DISTRICT_COORDINATES[d]) {
      setDeliveryCoords(DALOA_DISTRICT_COORDINATES[d]);
    }
    setIsDistrictPickerOpen(false);
  };

  const photoUrl = isCartMode ? cartItems[0]?.listing?.photos?.[0] || FALLBACK_PHOTO : listing?.photos?.[0] || FALLBACK_PHOTO;

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
        >
          <View style={styles.heroNav}>
            <AppPressable
              onPress={() => (step === 3 ? setStep(2) : step === 2 ? setStep(1) : router.back())}
              rippleBorderless
              style={styles.heroBackBtn}
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={18} color={colors.text.inverse} />
            </AppPressable>
            <View style={styles.heroLockCircle}>
              <Lock size={16} color={colors.text.inverse} />
            </View>
          </View>
          <AppText variant="overline" color={accent[100]}>TUNNEL SÉCURISÉ</AppText>
          <AppText variant="h2" color={colors.text.inverse}>Commander</AppText>
        </LinearGradient>

        <CheckoutWizardBar currentStep={step} totalSteps={3} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AppText variant="caption" color={colors.status.errorDark} center>{errorMsg}</AppText>
            </View>
          )}

          {step === 1 && (
            <CheckoutStepReception
              photoUrl={photoUrl}
              title={isCartMode ? `Votre panier · ${cartItems.length} article${cartItems.length > 1 ? 's' : ''}` : listing!.title}
              variantLabel={isCartMode ? (cartSellerCount > 1 ? `${cartSellerCount} vendeurs` : null) : variant?.label}
              activePrice={isCartMode ? cartProductTotal : activePrice}
              quantity={isCartMode ? 1 : quantity}
              deliveryMode={deliveryMode}
              onDeliveryModeChange={(m) => {
                setDeliveryMode(m);
                if (m === 'pickup' && paymentMode === 'cod') setPaymentMode('cash_at_shop');
                else if (m === 'delivery' && paymentMode === 'cash_at_shop') setPaymentMode('online');
              }}
              onNext={() => { setErrorMsg(null); setStep(2); }}
              isPickupAllowed={isPickupAllowed}
            />
          )}

          {step === 2 && (
            <CheckoutStepLocation
              deliveryMode={deliveryMode}
              deliveryDistrict={deliveryDistrict}
              onOpenDistrictPicker={() => setIsDistrictPickerOpen(true)}
              deliveryCoords={deliveryCoords}
              onDeliveryCoordsChange={setDeliveryCoords}
              sellerCoords={sellerCoords}
              deliveryAddress={deliveryAddress}
              onDeliveryAddressChange={setDeliveryAddress}
              buyerPhone={buyerPhone}
              onBuyerPhoneChange={setBuyerPhone}
              shopName={listing ? (listing.seller?.shop_name || listing.seller?.full_name) : undefined}
              sellerDistrict={listing?.seller?.district || listing?.district}
              onLocateGps={() => handleRequestGps(false)}
              isLocatingGps={isLocatingGps}
              onBack={() => setStep(1)}
              onNext={() => {
                if (deliveryMode === 'delivery') {
                  if (!deliveryCoords?.latitude || !deliveryCoords?.longitude) {
                    setErrorMsg('La position GPS est obligatoire pour la livraison. Veuillez activer votre GPS.');
                    return;
                  }
                  if (!deliveryAddress.trim()) {
                    setErrorMsg('Veuillez préciser votre repère ou adresse de livraison.');
                    return;
                  }
                }
                if (!buyerPhone.trim() || buyerPhone.length < 8) {
                  setErrorMsg('Veuillez renseigner un numéro de téléphone de contact valide.');
                  return;
                }
                setErrorMsg(null);
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <CheckoutStepPayment
              deliveryMode={deliveryMode}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
              operator={operator}
              onOperatorChange={setOperator}
              isCodAllowed={isCodAllowed}
              quantity={quantity}
              activePrice={activePrice}
              deliveryFee={breakdown.deliveryFee}
              buyerServiceFee={breakdown.buyerServiceFee}
              totalAmount={breakdown.totalAmount}
              distanceKm={distanceKm}
              isSubmitting={isSubmitting}
              onBack={() => setStep(2)}
              onSubmit={submitOrder}
            />
          )}

          <View style={{ height: insets.bottom + spacing[6] }} />
        </ScrollView>

        <DistrictPickerSheet
          visible={isDistrictPickerOpen}
          onClose={() => setIsDistrictPickerOpen(false)}
          selectedDistrict={deliveryDistrict}
          onSelectDistrict={handleSelectDistrict}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
  hero: { paddingHorizontal: spacing[4], paddingBottom: spacing[4], borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] },
  heroBackBtn: { width: 36, height: 36, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroLockCircle: { width: 36, height: 36, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }, scrollContent: { padding: spacing[4] },
  errorBanner: { backgroundColor: colors.status.errorLight, padding: spacing[3], borderRadius: radii.lg, marginBottom: spacing[3] },
});
