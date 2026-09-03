import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent, KeyboardScreen } from '@daloa/ui';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { calculateOrderBreakdown, PRICING_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';
import { ordersService, paymentService, useListingDetail, analyticsService, useSystemSettings } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
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
  const { listingId, variantId, qty, cart } = useLocalSearchParams<{ listingId?: string; variantId?: string; qty?: string; cart?: string }>();
  const quantity = Math.max(1, parseInt(qty || '1', 10));
  const isCartMode = cart === '1';

  const { user, profile, isAuthenticated } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const { data: listing, isLoading } = useListingDetail(isCartMode ? undefined : listingId);
  const { data: settings } = useSystemSettings();

  // Agrégats panier (mode panier uniquement)
  const cartProductTotal = cartItems.reduce((s, ci) => s + (ci.variant?.price ?? ci.listing.price) * ci.quantity, 0);
  const cartQtyTotal = cartItems.reduce((s, ci) => s + ci.quantity, 0);
  const cartSellerCount = new Set(cartItems.map((ci) => ci.listing.user_id || ci.listing.seller?.id)).size;

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

  // Estimation de livraison panier : tarif de base × nombre de vendeurs distincts.
  // (Le montant réel par vendeur est calculé côté serveur/COD à la validation.)
  const estimatedCartDelivery =
    deliveryMode === 'pickup' ? 0 : PRICING_CONFIG.delivery.baseFee * Math.max(1, cartSellerCount);

  const breakdown = isCartMode
    ? {
        productPrice: cartProductTotal,
        quantity: cartQtyTotal,
        productSubtotal: cartProductTotal,
        deliveryFee: estimatedCartDelivery,
        buyerServiceFee: 0,
        totalAmount: cartProductTotal + estimatedCartDelivery,
        sellerCommission: 0,
        sellerNetPayout: cartProductTotal,
        driverFee: 0,
        driverNetPayout: estimatedCartDelivery,
      }
    : calculateOrderBreakdown({
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

      const fullAddress =
        deliveryMode === 'delivery' ? deliveryAddress.trim() : 'Retrait direct en boutique';

      // ══ MODE PANIER (plusieurs articles / vendeurs) ══
      if (isCartMode) {
        if (paymentMode === 'online') {
          // Le serveur groupe par vendeur et crée les commandes après paiement.
          const orderInputs = cartItems.map((ci) => ({
            buyer_id: user.id,
            listing_id: ci.listing.id,
            variant_id: ci.variant?.id || undefined,
            quantity: ci.quantity,
            delivery_address: fullAddress,
            delivery_lat: deliveryCoords?.latitude ?? undefined,
            delivery_lng: deliveryCoords?.longitude ?? undefined,
            delivery_mode: deliveryMode,
          }));

          const result = await paymentService.initiatePayment({
            type: 'order',
            amount: breakdown.totalAmount,
            userId: user.id,
            customerName: profile?.full_name || 'Client DaloaMarket',
            customerPhone: buyerPhone.trim(),
            orderInput: orderInputs[0],
            orderInputs,
          } as any);

          if (!result.paymentUrl) throw new Error('Lien de paiement indisponible. Réessayez.');

          Haptics.success();
          await WebBrowser.openBrowserAsync(result.paymentUrl);

          let orderId: string | null = null;
          if (result.transactionId) {
            for (let i = 0; i < 4 && !orderId; i++) {
              const check = await paymentService.checkPaymentByTransaction(result.transactionId);
              orderId = check.orderId;
              if (!orderId) await new Promise((r) => setTimeout(r, 1500));
            }
          }
          clearCart();
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

        // COD / espèces : commandes groupées par vendeur, créées directement.
        const codMethod = paymentMode === 'cod' ? 'cod' : 'cash';
        const firstOrderId = await ordersService.createCartOrders(user.id, cartItems, {
          deliveryMode,
          paymentMethod: codMethod,
          fullAddress,
          deliveryLat: deliveryCoords?.latitude,
          deliveryLng: deliveryCoords?.longitude,
        });
        clearCart();
        Haptics.success();
        if (firstOrderId) router.replace(`/order/${firstOrderId}` as any);
        else router.replace('/(tabs)/orders' as any);
        return;
      }

      // ── Paiement en ligne : le SERVEUR crée la commande après confirmation ──
      // (évite les commandes orphelines/dupliquées créées côté client).
      if (paymentMode === 'online') {
        const result = await paymentService.initiatePayment({
          type: 'order',
          amount: breakdown.totalAmount,
          userId: user.id,
          customerName: profile?.full_name || 'Client DaloaMarket',
          customerPhone: buyerPhone.trim(),
          orderInput: {
            buyer_id: user.id,
            listing_id: listingId,
            variant_id: variantId || undefined,
            quantity,
            delivery_address: fullAddress,
            delivery_lat: deliveryCoords?.latitude ?? undefined,
            delivery_lng: deliveryCoords?.longitude ?? undefined,
            delivery_mode: deliveryMode,
          },
        });

        if (!result.paymentUrl) throw new Error('Lien de paiement indisponible. Réessayez.');

        analyticsService.logEvent({
          eventName: 'purchase',
          userId: user.id,
          listingId,
          props: {
            category: listing?.category,
            amount: breakdown.totalAmount,
            quantity,
            payment_method: operator,
            transactionId: result.transactionId,
          },
        });

        Haptics.success();
        await WebBrowser.openBrowserAsync(result.paymentUrl);

        // Résout la commande créée côté serveur après paiement (quelques essais).
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

      // ── COD / espèces : création directe (aucun paiement en ligne) ──
      const effectivePaymentMethod = paymentMode === 'cod' ? 'cod' : 'cash';
      const order = await ordersService.createOrder(user.id, {
        listing_id: listingId!,
        variant_id: variantId || null,
        variant_label: variant?.label || null,
        quantity,
        delivery_mode: deliveryMode,
        payment_method: effectivePaymentMethod as any,
        delivery_address: fullAddress,
        delivery_district: deliveryDistrict,
        delivery_lat: deliveryCoords?.latitude,
        delivery_lng: deliveryCoords?.longitude,
        buyer_phone: buyerPhone.trim(),
      });

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

  const photoUrl = isCartMode
    ? cartItems[0]?.listing?.photos?.[0] || FALLBACK_PHOTO
    : listing?.photos?.[0] || FALLBACK_PHOTO;

  // Chargement (mode article seul) ou panier vide
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

          {/* Étape 1 : Réception & Article(s) */}
          {step === 1 && (
            <CheckoutStepReception
              photoUrl={photoUrl}
              title={
                isCartMode
                  ? `Votre panier · ${cartItems.length} article${cartItems.length > 1 ? 's' : ''}`
                  : listing!.title
              }
              variantLabel={
                isCartMode
                  ? cartSellerCount > 1
                    ? `${cartSellerCount} vendeurs`
                    : null
                  : variant?.label
              }
              activePrice={isCartMode ? cartProductTotal : activePrice}
              quantity={isCartMode ? 1 : quantity}
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
              shopName={listing ? (listing.seller?.shop_name || listing.seller?.full_name) : undefined}
              sellerDistrict={listing?.seller?.district}
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
