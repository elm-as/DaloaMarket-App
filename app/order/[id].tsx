import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderDetail, ordersService, paymentService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import {
  colors,
  radii,
  spacing,
  Button,
  Avatar,
  RatingStars,
  DeliveryCodeCard,
  BottomSheet,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  PhoneCall,
  AlertTriangle,
  CreditCard,
  Bike,
  Package,
  Truck,
  PartyPopper,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import { formatDate, formatFCFA, Haptics } from '@daloa/utils';

/* ─── helpers ─────────────────────────────────────────────────────── */

function getStatusMeta(status: string, accent: any) {
  switch (status) {
    case 'pending_payment':
      return {
        label: 'En attente de paiement',
        bg: colors.status.warningLight,
        text: colors.status.warningDark,
        border: colors.status.warningBorder,
      };
    case 'paid_escrow':
    case 'awaiting_pickup':
      return {
        label: 'Séquestre payé',
        bg: colors.status.infoLight,
        text: colors.status.infoDark,
        border: colors.status.infoBorder,
      };
    case 'in_transit':
    case 'picked_up':
      return {
        label: 'En livraison',
        bg: accent[50],
        text: accent[700],
        border: accent[200],
      };
    case 'delivered':
      return {
        label: 'Livré',
        bg: colors.status.successLight,
        text: colors.status.successDark,
        border: colors.status.successBorder,
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        bg: colors.status.errorLight,
        text: colors.status.errorDark,
        border: colors.status.errorBorder,
      };
    default:
      return { label: status, bg: colors.bg.subtle, text: colors.text.body, border: colors.border.DEFAULT };
  }
}

/* ─── SummaryRow ──────────────────────────────────────────────────── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText variant="body" color={colors.text.muted} style={styles.summaryLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" numberOfLines={2} style={styles.summaryValue}>
        {value}
      </AppText>
    </View>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */
export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user } = useAuth();

  const { data: order, isLoading, refetch } = useOrderDetail(id);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    const channel = ordersService.subscribeToOrderUpdates(id, () => refetch());
    return () => { channel.unsubscribe(); };
  }, [id, refetch]);

  // Vérifie activement le paiement auprès de l'API (le simple refetch DB ne suffit
  // pas : le statut ne change que si le paiement est confirmé côté serveur).
  const verifyPayment = useCallback(async () => {
    if (!id) return null;
    try {
      const res = await paymentService.checkPaymentStatus(id);
      await refetch();
      return res;
    } catch {
      return null;
    }
  }, [id, refetch]);

  useEffect(() => {
    if (!order || order.status !== 'pending_payment') return;
    const timer = setInterval(() => { verifyPayment(); }, 5000);
    return () => clearInterval(timer);
  }, [order?.status, verifyPayment]);

  const handleManualVerify = async () => {
    setIsVerifying(true);
    Haptics.lightImpact();
    const res = await verifyPayment();
    setIsVerifying(false);
    if (res?.isPaid) {
      Haptics.success();
    } else {
      Alert.alert(
        'Paiement en attente',
        "Nous n'avons pas encore reçu la confirmation. Si vous venez de payer, patientez quelques instants puis réessayez."
      );
    }
  };

  const handleReportDispute = async () => {
    if (!disputeReason.trim()) return;
    try {
      setIsSubmitting(true);
      await ordersService.reportDispute(order!.id, disputeReason.trim());
      Haptics.warning();
      setIsDisputeOpen(false);
      refetch();
      Alert.alert(
        'Litige signalé',
        "Votre signalement a été transmis à l'équipe de médiation DaloaMarket."
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de signaler le litige.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Loading skeleton */
  if (isLoading || !order) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
        >
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.inverse} />
          </AppPressable>
          <AppText variant="overline" color={accent[100]}>COMMANDE</AppText>
          <AppText variant="h2" color={colors.text.inverse}>Suivi en direct</AppText>
        </LinearGradient>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={accent.DEFAULT} />
          <AppText variant="caption" color={colors.text.muted}>
            Chargement du suivi...
          </AppText>
        </View>
      </View>
    );
  }

  const assignment = order.delivery_assignment;
  const driver = order.delivery_person;
  const seller = order.seller;
  const deliveryOtp = assignment?.delivery_otp;
  const pickupOtp = assignment?.pickup_otp;
  const isSeller = Boolean(user && seller && user.id === seller.id);
  const statusMeta = getStatusMeta(order.status, accent);

  const listing = order.listing;
  const photoUrl = listing?.photos?.[0];

  /* Timeline steps */
  const steps = [
    {
      key: 'paid',
      label: 'Commande payée',
      sub: 'Montant mis en séquestre sécurisé',
      icon: CreditCard,
      done: order.status !== 'pending_payment',
    },
    {
      key: 'assigned',
      label: 'Livreur assigné',
      sub: 'DaloaDelivery prend en charge la commande',
      icon: Bike,
      done: Boolean(assignment?.delivery_person_id),
    },
    {
      key: 'picked_up',
      label: 'Colis récupéré',
      sub: 'Le livreur a pris le colis chez le vendeur',
      icon: Package,
      done: ['picked_up', 'in_transit', 'delivered'].includes(assignment?.status ?? ''),
    },
    {
      key: 'in_transit',
      label: 'En acheminement',
      sub: 'En route vers votre adresse de livraison',
      icon: Truck,
      done: ['in_transit', 'delivered'].includes(assignment?.status ?? ''),
    },
    {
      key: 'delivered',
      label: 'Livré & validé',
      sub: 'Fonds débloqués vers le vendeur',
      icon: PartyPopper,
      done: order.status === 'delivered',
    },
  ];

  const firstPendingIdx = steps.findIndex((s) => !s.done);

  return (
    <View style={styles.container}>
      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
      >
        <View style={styles.heroTop}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.inverse} />
          </AppPressable>
          <View style={[styles.statusPill, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
            <AppText variant="overline" color={statusMeta.text}>
              {statusMeta.label}
            </AppText>
          </View>
        </View>

        <View style={styles.heroBody}>
          <View style={styles.heroInfo}>
            <AppText variant="overline" color={accent[100]}>
              COMMANDE #{order.id.slice(0, 8).toUpperCase()}
            </AppText>
            <AppText variant="h2" color={colors.text.inverse} numberOfLines={2}>
              {listing?.title || 'Commande DaloaMarket'}
            </AppText>
            <AppText variant="caption" color={accent[100]}>
              {formatDate(order.created_at, true)}
            </AppText>
          </View>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.heroThumb}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.heroThumb, styles.heroThumbFallback]}>
              <Package size={22} color={accent[300]} />
            </View>
          )}
        </View>

        {/* Total */}
        <View style={styles.heroTotal}>
          <AppText variant="caption" color={accent[100]}>Montant total séquestré</AppText>
          <AppText variant="h2" color={colors.text.inverse} style={styles.tnum}>
            {formatFCFA(order.total_amount)}
          </AppText>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Vérification de paiement (acheteur, commande non réglée) ── */}
        {!isSeller && order.status === 'pending_payment' && (
          <View style={styles.paymentPendingCard}>
            <View style={styles.paymentPendingHeader}>
              <CreditCard size={18} color={colors.status.warningDark} />
              <AppText variant="bodyStrong" color={colors.status.warningDark}>
                En attente de paiement
              </AppText>
            </View>
            <AppText variant="caption" color={colors.text.muted}>
              Si vous venez de payer via Mobile Money, la confirmation peut prendre
              quelques instants. Vérifiez maintenant.
            </AppText>
            <Button
              title="J'ai payé — Vérifier"
              variant="market"
              size="md"
              loading={isVerifying}
              onPress={handleManualVerify}
              leftIcon={<CreditCard size={16} color={colors.text.inverse} />}
              fullWidth
              style={styles.verifyBtn}
            />
          </View>
        )}

        {/* ── Code OTP vendeur : ramassage ── */}
        {isSeller &&
          pickupOtp &&
          (assignment?.status === 'accepted' ||
            order.status === 'awaiting_pickup' ||
            order.status === 'paid_escrow') && (
            <DeliveryCodeCard
              code={pickupOtp}
              type="pickup"
              orderRef={order.id}
              title="Code de ramassage (Vendeur)"
              subtitle="Le livreur scanne ce QR code pour confirmer qu'il prend en charge votre colis."
              style={styles.codeCard}
            />
          )}

        {/* ── Code OTP acheteur : remise ── */}
        {!isSeller &&
          deliveryOtp &&
          order.status !== 'delivered' &&
          order.status !== 'cancelled' && (
            <DeliveryCodeCard
              code={deliveryOtp}
              type="delivery"
              orderRef={order.id}
              title="Votre code de remise"
              subtitle="Donnez ce code au livreur UNIQUEMENT après avoir inspecté votre colis."
              style={styles.codeCard}
            />
          )}

        {/* ── Timeline ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Truck size={15} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Progression de la livraison</AppText>
          </View>

          <View style={styles.timeline}>
            {steps.map((step, idx) => {
              const isCurrent = !step.done && idx === firstPendingIdx;
              const Icon = step.icon;
              const isLast = idx === steps.length - 1;

              return (
                <View key={step.key} style={styles.timelineRow}>
                  {/* Left column: dot + line */}
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        step.done && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                        isCurrent && {
                          backgroundColor: colors.bg.surface,
                          borderColor: accent.DEFAULT,
                          borderWidth: 2.5,
                        },
                        !step.done && !isCurrent && {
                          backgroundColor: colors.bg.subtle,
                          borderColor: colors.border.strong,
                        },
                      ]}
                    >
                      {step.done ? (
                        <CheckCircle2 size={14} color={colors.text.inverse} strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <Icon size={13} color={accent.DEFAULT} strokeWidth={2} />
                      ) : (
                        <Clock size={11} color={colors.grey[400]} />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          step.done && { backgroundColor: accent.DEFAULT },
                          isCurrent && { backgroundColor: accent[200] },
                        ]}
                      />
                    )}
                  </View>

                  {/* Right column: text */}
                  <View style={[styles.timelineText, isLast && { paddingBottom: 0 }]}>
                    <AppText
                      variant={step.done || isCurrent ? 'bodyStrong' : 'body'}
                      color={
                        step.done
                          ? colors.text.DEFAULT
                          : isCurrent
                          ? accent[700]
                          : colors.text.subtle
                      }
                    >
                      {step.label}
                    </AppText>
                    <AppText variant="caption" color={colors.text.subtle}>
                      {step.sub}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Livreur ── */}
        {driver && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Bike size={15} color={colors.status.successDark} />
              <AppText variant="bodyStrong">Livreur DaloaDelivery</AppText>
            </View>
            <View style={styles.personRow}>
              <Avatar uri={driver.photo_url} name={driver.name} size={50} isOnline />
              <View style={styles.personInfo}>
                <AppText variant="bodyStrong">{driver.name}</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  {driver.vehicle_type?.toUpperCase() || 'MOTO'}
                </AppText>
                <RatingStars
                  rating={driver.rating || 5.0}
                  totalReviews={driver.total_reviews}
                  size={11}
                />
              </View>
              <AppPressable
                onPress={() => {
                  if (!driver.phone) return;
                  Haptics.lightImpact();
                  Linking.openURL(`tel:${driver.phone}`);
                }}
                style={[styles.callBtn, { backgroundColor: colors.status.success }]}
                accessibilityLabel="Appeler le livreur"
              >
                <PhoneCall size={16} color={colors.text.inverse} />
              </AppPressable>
            </View>
          </View>
        )}

        {/* ── Vendeur ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <ShieldCheck size={15} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Vendeur partenaire</AppText>
          </View>
          <View style={styles.personRow}>
            <Avatar
              uri={seller?.shop_logo_url || seller?.avatar_url}
              name={seller?.shop_name || seller?.full_name}
              size={50}
            />
            <View style={styles.personInfo}>
              <AppText variant="bodyStrong">
                {seller?.shop_name || seller?.full_name || 'Boutique Daloa'}
              </AppText>
              <View style={styles.districtRow}>
                <MapPin size={11} color={colors.text.subtle} />
                <AppText variant="caption" color={colors.text.muted}>
                  {seller?.district || 'Daloa'}
                </AppText>
              </View>
            </View>
            <AppPressable
              onPress={() => {
                if (!seller?.phone) return;
                Haptics.lightImpact();
                Linking.openURL(`tel:${seller.phone}`);
              }}
              style={styles.callBtnOutline}
              accessibilityLabel="Appeler le vendeur"
            >
              <PhoneCall size={16} color={colors.grey[700]} />
            </AppPressable>
          </View>
        </View>

        {/* ── Détail commande ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Package size={15} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Récapitulatif</AppText>
          </View>
          <SummaryRow label="Article" value={listing?.title || 'Article DaloaMarket'} />
          <SummaryRow label="Quantité" value={`×${order.quantity || 1}`} />
          <SummaryRow
            label="Livraison à"
            value={`${order.delivery_address || '—'} (${order.delivery_district || 'Daloa'})`}
          />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <AppText variant="bodyStrong">Total séquestré</AppText>
            <AppText variant="h2" color={accent[600]} style={styles.tnum}>
              {formatFCFA(order.total_amount)}
            </AppText>
          </View>
        </View>

        {/* ── Litige ── */}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <AppPressable
            onPress={() => setIsDisputeOpen(true)}
            style={styles.disputeBtn}
          >
            <AlertTriangle size={15} color={colors.status.error} />
            <AppText variant="caption" color={colors.status.error}>
              Signaler un incident ou ouvrir une médiation
            </AppText>
          </AppPressable>
        )}

        <View style={{ height: Math.max(insets.bottom, spacing[6]) }} />
      </ScrollView>

      {/* ── Bottom sheet litige ── */}
      <BottomSheet
        visible={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        title="Signaler un problème"
      >
        <View style={styles.disputeBody}>
          <AppText variant="body" color={colors.text.muted} style={styles.disputeIntro}>
            Décrivez le motif de votre réclamation : produit non conforme, livreur injoignable, retard anormal…
          </AppText>
          <TextInput
            style={styles.disputeInput}
            multiline
            numberOfLines={4}
            placeholder="Décrivez votre problème ici..."
            placeholderTextColor={colors.text.subtle}
            value={disputeReason}
            onChangeText={setDisputeReason}
            textAlignVertical="top"
          />
          <Button
            title="Envoyer la réclamation"
            variant="danger"
            onPress={handleReportDispute}
            loading={isSubmitting}
            fullWidth
            style={styles.disputeSubmit}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  // ── Hero ──
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: spacing[3],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  heroThumb: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexShrink: 0,
  },
  heroThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTotal: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    alignItems: 'flex-start',
  },
  // ── Scroll content ──
  scrollContent: {
    padding: spacing[3],
  },
  codeCard: {
    marginBottom: spacing[3],
  },
  paymentPendingCard: {
    backgroundColor: colors.status.warningLight,
    borderColor: colors.status.warningBorder,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  paymentPendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  verifyBtn: {
    marginTop: spacing[2],
  },
  // ── Cards ──
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  // ── Timeline ──
  timeline: {
    paddingLeft: spacing[1],
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexShrink: 0,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.border.DEFAULT,
    marginVertical: 3,
  },
  timelineText: {
    flex: 1,
    paddingBottom: spacing[4],
    paddingTop: 4,
    gap: 2,
  },
  // ── Person cards ──
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  personInfo: {
    flex: 1,
    gap: 3,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  callBtnOutline: {
    width: 42,
    height: 42,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  // ── Summary ──
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  summaryLabel: {
    flexShrink: 0,
  },
  summaryValue: {
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
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
  tnum: {
    fontVariant: ['tabular-nums'],
  },
  // ── Litige ──
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.xl,
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    overflow: 'hidden',
  },
  disputeBody: {
    padding: spacing[4],
    gap: spacing[3],
  },
  disputeIntro: {
    lineHeight: 20,
  },
  disputeInput: {
    backgroundColor: colors.grey[50],
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    borderRadius: radii.xl,
    padding: spacing[3],
    fontSize: 13,
    color: colors.text.DEFAULT,
    minHeight: 100,
  },
  disputeSubmit: {
    marginTop: spacing[1],
  },
  // ── Loading ──
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
});
