import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useListingDetail, ordersService, paymentService } from '@daloa/api';
import { DALOA_DISTRICTS, calculateOrderBreakdown } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  Button,
  Input,
  AppText,
  AppPressable,
  KeyboardScreen,
  useAccent,
} from '@daloa/ui';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

const PAYMENT_METHODS: { id: 'wave' | 'orange' | 'mtn' | 'moov'; name: string; color: string }[] = [
  { id: 'wave', name: 'Wave', color: colors.networks.wave },
  { id: 'orange', name: 'Orange Money', color: colors.networks.orange },
  { id: 'mtn', name: 'MTN MoMo', color: colors.networks.mtn },
  { id: 'moov', name: 'Moov Money', color: colors.networks.moov },
];

export default function CheckoutScreen() {
  const { listingId, variantId, quantity: qtyParam } = useLocalSearchParams<{
    listingId: string;
    variantId?: string;
    quantity?: string;
  }>();

  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user, profile, isAuthenticated } = useAuth();
  const { data: listing, isLoading } = useListingDetail(listingId);

  const quantity = parseInt(qtyParam || '1', 10) || 1;
  const variant = listing?.variants?.find((v: any) => v.id === variantId);
  const activePrice = variant?.price ?? listing?.price ?? 0;

  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(profile?.district || 'Lobia');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(profile?.address || '');
  const [buyerPhone, setBuyerPhone] = useState<string>(profile?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPro = Boolean(listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date());
  const breakdown = calculateOrderBreakdown({
    productPrice: activePrice,
    quantity,
    distanceKm: 2.5,
    isProSeller: isPro,
    deliveryMode,
    deliveryFeeOverride: listing?.delivery_fee_override,
  });

  const handleConfirmOrder = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login' as any);
      return;
    }
    if (!buyerPhone.trim() || buyerPhone.length < 8) {
      setErrorMsg('Veuillez renseigner votre numéro de téléphone de contact.');
      return;
    }
    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Veuillez préciser votre adresse ou un repère à Daloa.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // 1. Création de la commande Escrow
      const order = await ordersService.createOrder(user.id, {
        listing_id: listingId,
        variant_id: variantId || null,
        variant_label: variant?.label || null,
        quantity,
        delivery_mode: deliveryMode,
        payment_method: paymentMethod,
        delivery_address: deliveryAddress.trim() || 'Remise en main propre',
        delivery_district: deliveryDistrict,
        buyer_phone: buyerPhone.trim(),
      });

      // 2. Intention de paiement Mobile Money
      const intent = await paymentService.createPaymentIntent({
        orderId: order.id,
        amount: breakdown.totalAmount,
        customerPhone: buyerPhone.trim(),
        customerName: profile?.full_name || 'Client DaloaMarket',
        network: paymentMethod as any,
      });

      Haptics.success();

      // 3. Redirection vers la page de paiement de l'opérateur (Wave/Orange/MTN/Moov).
      //    Le suivi de commande interroge ensuite le statut jusqu'à confirmation.
      if (intent?.paymentUrl) {
        const canOpen = await Linking.canOpenURL(intent.paymentUrl);
        if (canOpen) {
          await Linking.openURL(intent.paymentUrl);
        }
      }

      router.replace(`/order/${order.id}` as any);
    } catch (err: any) {
      console.error('Erreur commande:', err);
      setErrorMsg(err.message || 'Échec de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoUrl = listing?.photos?.[0] || FALLBACK_PHOTO;

  const HeroHeader = () => (
    <LinearGradient
      colors={[accent[400], accent[600], accent[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
    >
      <View style={styles.heroNav}>
        <AppPressable onPress={() => router.back()} rippleBorderless style={styles.heroBackBtn} accessibilityLabel="Retour">
          <ArrowLeft size={18} color={colors.text.inverse} />
        </AppPressable>
        <View style={styles.heroLockCircle}>
          <Lock size={18} color={colors.text.inverse} />
        </View>
      </View>
      <AppText variant="overline" color={accent[100]}>PAIEMENT SÉCURISÉ</AppText>
      <AppText variant="h2" color={colors.text.inverse}>Commander</AppText>
      {listing && (
        <View style={styles.heroArticleRow}>
          <Image source={{ uri: photoUrl }} style={styles.heroThumb} contentFit="cover" />
          <View style={styles.heroArticleInfo}>
            <AppText variant="bodyStrong" color={colors.text.inverse} numberOfLines={1}>
              {listing.title}
            </AppText>
            <AppText variant="caption" color={accent[100]}>
              {formatFCFA(activePrice)} × {quantity}
            </AppText>
          </View>
        </View>
      )}
    </LinearGradient>
  );

  if (isLoading || !listing) {
    return (
      <View style={styles.container}>
        <HeroHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent.DEFAULT} />
          <AppText variant="body" color={colors.text.muted}>
            Préparation du tunnel de commande...
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <HeroHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Mode de réception */}
          <View style={styles.section}>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              Mode de réception
            </AppText>
            <View style={styles.modeRow}>
              <AppPressable
                haptic="selection"
                onPress={() => setDeliveryMode('delivery')}
                style={[
                  styles.modeCard,
                  deliveryMode === 'delivery' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
                ]}
              >
                <Truck size={22} color={deliveryMode === 'delivery' ? accent.DEFAULT : colors.grey[400]} />
                <AppText variant="bodyStrong" color={deliveryMode === 'delivery' ? accent[700] : colors.text.DEFAULT} center style={styles.modeTitle}>
                  Livraison à Daloa
                </AppText>
                <AppText variant="caption" color={colors.text.muted} center>
                  Par coursier DaloaDelivery
                </AppText>
              </AppPressable>

              <AppPressable
                haptic="selection"
                onPress={() => setDeliveryMode('pickup')}
                style={[
                  styles.modeCard,
                  deliveryMode === 'pickup' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
                ]}
              >
                <MapPin size={22} color={deliveryMode === 'pickup' ? accent.DEFAULT : colors.grey[400]} />
                <AppText variant="bodyStrong" color={deliveryMode === 'pickup' ? accent[700] : colors.text.DEFAULT} center style={styles.modeTitle}>
                  Retrait sur place
                </AppText>
                <AppText variant="caption" color={colors.text.muted} center>
                  Chez le vendeur directement
                </AppText>
              </AppPressable>
            </View>
          </View>

          {/* Coordonnées */}
          <View style={styles.section}>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              Coordonnées de réception à Daloa
            </AppText>

            {deliveryMode === 'delivery' && (
              <>
                <AppText variant="label" color={colors.text.body} style={styles.inputLabel}>
                  Quartier de livraison
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {DALOA_DISTRICTS.slice(0, 15).map((d) => {
                    const isActive = deliveryDistrict === d;
                    return (
                      <AppPressable
                        key={d}
                        haptic="selection"
                        onPress={() => setDeliveryDistrict(d)}
                        style={[
                          styles.chip,
                          isActive && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                        ]}
                      >
                        <AppText variant="caption" color={isActive ? colors.text.inverse : colors.grey[600]}>
                          {d}
                        </AppText>
                      </AppPressable>
                    );
                  })}
                </ScrollView>

                <Input
                  label="Adresse précise ou point de repère *"
                  placeholder="Ex: Pharmacie Lobia, Maison portail bleu"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  containerStyle={styles.inputSpacing}
                />
              </>
            )}

            <Input
              label="Téléphone de contact (WhatsApp/Appel) *"
              placeholder="Ex: 0707000000"
              value={buyerPhone}
              onChangeText={setBuyerPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Paiement Mobile Money */}
          <View style={styles.section}>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              Paiement Mobile Money (Fonds Sécurisés)
            </AppText>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                const initials = pm.id === 'wave' ? 'W' : pm.id === 'orange' ? 'OM' : pm.id === 'mtn' ? 'MTN' : 'MV';
                return (
                  <AppPressable
                    key={pm.id}
                    haptic="selection"
                    onPress={() => setPaymentMethod(pm.id)}
                    style={[
                      styles.paymentCard,
                      { borderColor: isSelected ? pm.color : colors.border.DEFAULT },
                      isSelected && { backgroundColor: pm.color + '0D' },
                    ]}
                  >
                    <View style={[styles.paymentBadge, { backgroundColor: pm.color }]}>
                      <AppText variant="overline" color={colors.text.inverse} style={styles.paymentInitials}>
                        {initials}
                      </AppText>
                    </View>
                    <AppText variant="bodyStrong" color={isSelected ? pm.color : colors.text.DEFAULT} style={styles.paymentName}>
                      {pm.name}
                    </AppText>
                    {isSelected && <CheckCircle2 size={18} color={pm.color} />}
                  </AppPressable>
                );
              })}
            </View>
          </View>

          {/* Récapitulatif frais */}
          <View style={styles.breakdownCard}>
            <AppText variant="bodyStrong" style={styles.breakdownTitle}>
              Récapitulatif de la commande
            </AppText>

            <BreakdownRow label={`Article (${quantity}x)`} value={formatFCFA(activePrice * quantity)} />
            <BreakdownRow label="Frais de livraison Daloa" value={formatFCFA(breakdown.deliveryFee)} />
            <BreakdownRow label="Sécurisation Escrow (DaloaPay)" value={formatFCFA(breakdown.buyerServiceFee)} />

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <AppText variant="bodyStrong">Total à payer</AppText>
              <AppText variant="h2" color={accent[600]} style={styles.tnum}>
                {formatFCFA(breakdown.totalAmount)}
              </AppText>
            </View>
          </View>

          {/* Garantie OTP */}
          <View style={styles.otpNoticeCard}>
            <Lock size={20} color={colors.status.successDark} />
            <View style={styles.flex1}>
              <AppText variant="bodyStrong" color={colors.status.successDark}>
                Protection par Double Code OTP
              </AppText>
              <AppText variant="caption" color={colors.status.successDark} style={styles.otpDesc}>
                Votre argent reste bloqué en sécurité. Il ne sera transféré au vendeur qu'après réception
                du colis et validation de votre code secret de livraison.
              </AppText>
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorBanner}>
              <AppText variant="caption" color={colors.status.errorDark} center>
                {errorMsg}
              </AppText>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Barre de confirmation */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
          <Button
            title={`Payer ${formatFCFA(breakdown.totalAmount)} (Escrow)`}
            variant="market"
            size="lg"
            onPress={handleConfirmOrder}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </View>
    </KeyboardScreen>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.breakdownRow}>
      <AppText variant="body" color={colors.text.muted}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.tnum}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  // ─── Hero ───
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: spacing[2],
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBackBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroLockCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArticleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.xl,
    padding: spacing[2],
    marginTop: spacing[1],
  },
  heroThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroArticleInfo: {
    flex: 1,
    gap: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  scrollContent: {
    padding: spacing[3],
    paddingTop: spacing[4],
  },
  section: {
    marginTop: spacing[5],
  },
  sectionTitle: {
    marginBottom: spacing[2],
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    padding: spacing[3],
    alignItems: 'center',
    overflow: 'hidden',
  },
  modeTitle: {
    marginTop: 6,
  },
  inputLabel: {
    marginTop: spacing[2],
    marginBottom: 6,
  },
  inputSpacing: {
    marginTop: spacing[3],
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginRight: 6,
    overflow: 'hidden',
  },
  paymentGrid: {
    gap: spacing[2],
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
    gap: spacing[3],
  },
  paymentBadge: {
    width: 42,
    height: 42,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paymentInitials: {
    fontFamily: 'System',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  paymentName: {
    flex: 1,
  },
  breakdownCard: {
    marginTop: spacing[5],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
  },
  breakdownTitle: {
    marginBottom: spacing[3],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  tnum: {
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[2],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  otpNoticeCard: {
    marginTop: spacing[3],
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
    padding: spacing[3],
    borderRadius: radii.xl,
  },
  otpDesc: {
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
  errorBanner: {
    marginTop: spacing[3],
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    padding: spacing[3],
    borderRadius: radii.md,
  },
  bottomSpacer: {
    height: 90,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    padding: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
});
