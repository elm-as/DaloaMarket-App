import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  useAccent,
  KeyboardScreen,
  GroupedDeliveryBanner,
} from '@daloa/ui';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { useListingDetail, useSystemSettings } from '@daloa/api';
import { usePhase } from '../../src/context/PhaseContext';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { DistrictPickerSheet } from '../../src/components/settings/DistrictPickerSheet';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';
import { CheckoutWizardBar } from '../../src/components/checkout/CheckoutWizardBar';
import { CheckoutStepReception } from '../../src/components/checkout/CheckoutStepReception';
import { CheckoutStepLocation } from '../../src/components/checkout/CheckoutStepLocation';
import { CheckoutStepPayment } from '../../src/components/checkout/CheckoutStepPayment';
import { useCheckoutState } from '../../src/components/checkout/useCheckoutState';

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

export default function CheckoutScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { listingId, variantId, qty, quantity: qtyParam, cart } = useLocalSearchParams<{
    listingId?: string;
    variantId?: string;
    qty?: string;
    quantity?: string;
    cart?: string;
  }>();
  const quantity = Math.max(1, parseInt(qty || qtyParam || '1', 10));
  const isCartMode = cart === '1';

  const { user, profile, isAuthenticated } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const { data: listing, isLoading } = useListingDetail(isCartMode ? undefined : listingId);
  const { data: settings } = useSystemSettings();
  const phase = usePhase();

  const state = useCheckoutState({
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
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [state.step]);

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
        <AppText variant="body" color={colors.text.muted}>
          Chargement de la commande...
        </AppText>
      </View>
    );
  }

  if (isCartMode && cartItems.length === 0) {
    return (
      <View style={styles.loadingBox}>
        <AppText variant="body" color={colors.text.muted}>
          Votre panier est vide.
        </AppText>
      </View>
    );
  }

  const photoUrl = isCartMode
    ? cartItems[0]?.listing?.photos?.[0] || FALLBACK_PHOTO
    : listing?.photos?.[0] || FALLBACK_PHOTO;

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
        >
          <View style={styles.heroNav}>
            <AppPressable
              onPress={() =>
                state.step === 3 ? state.setStep(2) : state.step === 2 ? state.setStep(1) : router.back()
              }
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
          <AppText variant="overline" color={accent[100]}>
            TUNNEL SÉCURISÉ
          </AppText>
          <AppText variant="h2" color={colors.text.inverse}>
            Commander
          </AppText>
        </LinearGradient>

        <CheckoutWizardBar currentStep={state.step} totalSteps={3} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {state.errorMsg && (
            <View style={styles.errorBanner}>
              <AppText variant="caption" color={colors.status.errorDark} center>
                {state.errorMsg}
              </AppText>
            </View>
          )}

          {state.step === 1 && (
            <CheckoutStepReception
              photoUrl={photoUrl}
              title={
                isCartMode
                  ? `Votre panier · ${cartItems.length} article${cartItems.length > 1 ? 's' : ''}`
                  : listing!.title
              }
              variantLabel={
                isCartMode
                  ? state.cartSellerCount > 1
                    ? `${state.cartSellerCount} vendeurs`
                    : null
                  : state.variant?.label
              }
              activePrice={isCartMode ? state.cartProductTotal : state.activePrice}
              quantity={isCartMode ? 1 : quantity}
              deliveryMode={state.deliveryMode}
              onDeliveryModeChange={(m) => {
                state.setDeliveryMode(m);
                if (m === 'pickup' && state.paymentMode === 'cod') state.setPaymentMode('cash_at_shop');
                else if (m === 'delivery' && state.paymentMode === 'cash_at_shop') state.setPaymentMode('online');
              }}
              onNext={() => {
                state.setErrorMsg(null);
                state.setStep(2);
              }}
              isPickupAllowed={state.isPickupAllowed}
              isDigital={state.isDigital}
            />
          )}

          {state.step === 2 && (
            <CheckoutStepLocation
              deliveryMode={state.deliveryMode}
              deliveryDistrict={state.deliveryDistrict}
              onOpenDistrictPicker={() => state.setIsDistrictPickerOpen(true)}
              deliveryCoords={state.deliveryCoords}
              onDeliveryCoordsChange={state.setDeliveryCoords}
              sellerCoords={state.pricing.sellerCoords}
              deliveryAddress={state.deliveryAddress}
              onDeliveryAddressChange={state.setDeliveryAddress}
              buyerPhone={state.buyerPhone}
              onBuyerPhoneChange={state.setBuyerPhone}
              shopName={listing ? listing.seller?.shop_name || listing.seller?.full_name : undefined}
              sellerDistrict={listing?.seller?.district || listing?.district}
              onLocateGps={() => state.handleRequestGps(false)}
              isLocatingGps={state.isLocatingGps}
              onBack={() => state.setStep(1)}
              isDigital={state.isDigital}
              onNext={state.handleStep2Next}
            />
          )}

          {state.step === 3 && (
            <>
              {isCartMode && state.cartSellerCount > 1 && state.deliveryMode === 'delivery' && (
                <GroupedDeliveryBanner sellerCount={state.cartSellerCount} savings={state.pricing.groupedSavings} />
              )}
              <CheckoutStepPayment
                deliveryMode={state.deliveryMode}
                paymentMode={state.paymentMode}
                onPaymentModeChange={state.setPaymentMode}
                operator={state.operator}
                onOperatorChange={state.setOperator}
                isCodAllowed={state.isCodAllowed}
                isCodBlocked={state.isBuyerCodBlocked}
                codBlockedNotice="Le paiement à la livraison est temporairement indisponible suite à des commandes non réceptionnées. Veuillez régler par Mobile Money sécurisé."
                onlineDisabled={state.onlineDisabled}
                onlineNotice={state.paymentConfig?.notice}
                quantity={isCartMode ? 1 : quantity}
                activePrice={isCartMode ? state.cartProductTotal : state.activePrice}
                appliedPromo={state.appliedPromo}
                onApplyPromo={state.setAppliedPromo}
                promoDiscount={state.pricing.daloaCashDiscount}
                groupedDeliveryDiscount={state.pricing.groupedSavings}
                deliveryFee={state.pricing.currentDeliveryFee}
                buyerServiceFee={state.pricing.currentBuyerServiceFee}
                totalAmount={state.pricing.effectiveTotalAmount}
                distanceKm={state.pricing.serverQuote ? state.pricing.serverQuote.distanceKm : state.pricing.distanceKm}
                isSubmitting={state.isSubmitting}
                priceStatus={state.pricing.priceStatus}
                onRetryPrice={() => {
                  state.setErrorMsg(null);
                  state.pricing.refetchQuote();
                }}
                onBack={() => state.setStep(2)}
                onSubmit={state.submitOrder}
              />
            </>
          )}

          <View style={{ height: insets.bottom + spacing[6] }} />
        </ScrollView>

        <DistrictPickerSheet
          visible={state.isDistrictPickerOpen}
          onClose={() => state.setIsDistrictPickerOpen(false)}
          selectedDistrict={state.deliveryDistrict}
          onSelectDistrict={state.handleSelectDistrict}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] },
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
  scrollContent: { padding: spacing[4] },
  errorBanner: {
    backgroundColor: colors.status.errorLight,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
});
