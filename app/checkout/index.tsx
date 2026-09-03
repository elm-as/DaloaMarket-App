import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent, KeyboardScreen } from '@daloa/ui';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { calculateOrderBreakdown } from '@daloa/config';
import { Haptics } from '@daloa/utils';
import { ordersService, paymentService, useListingDetail, analyticsService, useSystemSettings } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { DistrictPickerSheet } from '../../src/components/settings/DistrictPickerSheet';
import { CheckoutWizardBar } from '../../src/components/checkout/CheckoutWizardBar';
import { CheckoutStepReception } from '../../src/components/checkout/CheckoutStepReception';
import { CheckoutStepLocation } from '../../src/components/checkout/CheckoutStepLocation';
import { CheckoutStepPayment } from '../../src/components/checkout/CheckoutStepPayment';
import { PaymentMode, MobileMoneyOperator } from '../../src/components/checkout/PaymentMethodSelector';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

export default function CheckoutScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { listingId, variantId, qty } = useLocalSearchParams<{ listingId: string; variantId?: string; qty?: string }>();
  const quantity = Math.max(1, parseInt(qty || '1', 10));

  const { user, profile, isAuthenticated } = useAuth();
  const { data: listing, isLoading } = useListingDetail(listingId);
  const { data: settings } = useSystemSettings();

  // Config paiement serveur : bloque le paiement en ligne si désactivé/COD forcé.
  const paymentConfig = settings?.paymentConfig;
  const onlineDisabled = Boolean(
    paymentConfig?.disable_online_payments || paymentConfig?.force_cod_only
  );

  const variant = listing?.variants?.find((v: any) => v.id === variantId);
  const activePrice = variant?.price ?? listing?.price ?? 0;

  // Log comportemental — entrée en tunnel d'achat
  useEffect(() => {
    if (!listing?.id) return;
    analyticsService.logEvent({
      eventName: 'checkout_start',
      userId: user?.id ?? null,
      listingId: listing.id,
      props: { category: listing.category, price: activePrice, quantity },
    });
  }, [listing?.id, user?.id]);

  // État du Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(profile?.district || 'Tazibouo');
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(2.5);
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>(profile?.phone || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('online');
  const [operator, setOperator] = useState<MobileMoneyOperator>('wave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sellerCoords = listing?.seller
    ? { latitude: (listing.seller as any).shop_latitude, longitude: (listing.seller as any).shop_longitude }
    : null;

  const isPro = Boolean(listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date());
  const breakdown = calculateOrderBreakdown({
    productPrice: activePrice,
    quantity,
    distanceKm,
    isProSeller: isPro,
    deliveryMode,
    deliveryFeeOverride: listing?.delivery_fee_override,
  });

  // Si le paiement en ligne est désactivé côté serveur, replier sur COD / espèces.
  useEffect(() => {
    if (!onlineDisabled) return;
    if (paymentMode === 'online') {
      setPaymentMode(deliveryMode === 'pickup' ? 'cash_at_shop' : 'cod');
    }
  }, [onlineDisabled, paymentMode, deliveryMode]);

  const handleDeliveryModeChange = (mode: 'delivery' | 'pickup') => {
    setDeliveryMode(mode);
    if (mode === 'pickup') {
      if (paymentMode === 'cod') setPaymentMode('cash_at_shop');
    } else if (paymentMode === 'cash_at_shop') {
      setPaymentMode('online');
    }
  };

  const handleGoToStep2 = () => {
    setErrorMsg(null);
    setStep(2);
  };

  const handleGoToStep3 = () => {
    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Veuillez préciser votre repère ou adresse de livraison.');
      return;
    }
    if (!buyerPhone.trim() || buyerPhone.length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone de contact valide.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleHeroBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.back();
  };

  const handleConfirmOrder = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login' as any);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (onlineDisabled && paymentMode === 'online') {
        setErrorMsg(
          paymentConfig?.notice ||
            'Le paiement en ligne est momentanément indisponible. Veuillez choisir le paiement à la livraison.'
        );
        setIsSubmitting(false);
        return;
      }

      const effectivePaymentMethod =
        paymentMode === 'online' ? operator : paymentMode === 'cod' ? 'cod' : 'cash';

      const order = await ordersService.createOrder(user.id, {
        listing_id: listingId,
        variant_id: variantId || null,
        variant_label: variant?.label || null,
        quantity,
        delivery_mode: deliveryMode,
        payment_method: effectivePaymentMethod as any,
        delivery_address: deliveryMode === 'delivery' ? deliveryAddress.trim() : 'Retrait direct en boutique',
        delivery_district: deliveryDistrict,
        delivery_lat: deliveryCoords?.latitude,
        delivery_lng: deliveryCoords?.longitude,
        buyer_phone: buyerPhone.trim(),
      });

      if (paymentMode === 'online') {
        const intent = await paymentService.createPaymentIntent({
          orderId: order.id,
          amount: breakdown.totalAmount,
          customerPhone: buyerPhone.trim(),
          customerName: profile?.full_name || 'Client DaloaMarket',
          network: operator as any,
        });
        if (intent?.paymentUrl) {
          const canOpen = await Linking.canOpenURL(intent.paymentUrl);
          if (canOpen) await Linking.openURL(intent.paymentUrl);
        }
      }

      analyticsService.logEvent({
        eventName: 'purchase',
        userId: user.id,
        listingId,
        props: {
          orderId: order.id,
          category: listing?.category,
          amount: breakdown.totalAmount,
          quantity,
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

  const photoUrl = listing?.photos?.[0] || FALLBACK_PHOTO;

  if (isLoading || !listing) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={accent.DEFAULT} />
        <AppText variant="body" color={colors.text.muted}>Chargement de la commande...</AppText>
      </View>
    );
  }

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        {/* En-tête Hero */}
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
        >
          <View style={styles.heroNav}>
            <AppPressable
              onPress={handleHeroBack}
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

        {/* Barre de progression du Wizard (3 étapes) */}
        <CheckoutWizardBar currentStep={step} totalSteps={3} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AppText variant="caption" color={colors.status.errorDark} center>
                {errorMsg}
              </AppText>
            </View>
          )}

          {onlineDisabled && step === 3 && (
            <View style={styles.noticeBanner}>
              <AppText variant="caption" color={colors.status.warningDark} center>
                {paymentConfig?.notice ||
                  'Paiement en ligne momentanément indisponible — réglez à la livraison.'}
              </AppText>
            </View>
          )}

          {/* Étape 1 : Réception & Article */}
          {step === 1 && (
            <CheckoutStepReception
              photoUrl={photoUrl}
              title={listing.title}
              variantLabel={variant?.label}
              activePrice={activePrice}
              quantity={quantity}
              deliveryMode={deliveryMode}
              onDeliveryModeChange={handleDeliveryModeChange}
              onNext={handleGoToStep2}
            />
          )}

          {/* Étape 2 : Adresse, Carte interactive & Contact */}
          {step === 2 && (
            <CheckoutStepLocation
              deliveryMode={deliveryMode}
              deliveryDistrict={deliveryDistrict}
              onOpenDistrictPicker={() => setIsDistrictPickerOpen(true)}
              deliveryCoords={deliveryCoords}
              onDeliveryCoordsChange={setDeliveryCoords}
              sellerCoords={sellerCoords}
              onDistanceChange={setDistanceKm}
              deliveryAddress={deliveryAddress}
              onDeliveryAddressChange={setDeliveryAddress}
              buyerPhone={buyerPhone}
              onBuyerPhoneChange={setBuyerPhone}
              shopName={listing.seller?.shop_name || listing.seller?.full_name}
              sellerDistrict={listing.seller?.district}
              onBack={() => setStep(1)}
              onNext={handleGoToStep3}
            />
          )}

          {/* Étape 3 : Mode de règlement & Récapitulatif final */}
          {step === 3 && (
            <CheckoutStepPayment
              deliveryMode={deliveryMode}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
              operator={operator}
              onOperatorChange={setOperator}
              isCodAllowed={Boolean((listing as any)?.accepts_cod ?? true)}
              quantity={quantity}
              activePrice={activePrice}
              deliveryFee={breakdown.deliveryFee}
              totalAmount={breakdown.totalAmount}
              distanceKm={distanceKm}
              isSubmitting={isSubmitting}
              onBack={() => setStep(2)}
              onSubmit={handleConfirmOrder}
            />
          )}

          <View style={{ height: insets.bottom + spacing[6] }} />
        </ScrollView>

        <DistrictPickerSheet
          visible={isDistrictPickerOpen}
          onClose={() => setIsDistrictPickerOpen(false)}
          selectedDistrict={deliveryDistrict}
          onSelectDistrict={(d) => {
            setDeliveryDistrict(d);
            setIsDistrictPickerOpen(false);
          }}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  heroBackBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLockCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing[4],
  },
  errorBanner: {
    backgroundColor: colors.status.errorLight,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  noticeBanner: {
    backgroundColor: colors.status.warningLight,
    borderWidth: 1,
    borderColor: colors.status.warningBorder,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
});
