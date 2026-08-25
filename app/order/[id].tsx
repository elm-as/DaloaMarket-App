import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderDetail, ordersService } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Card,
  StatusPill,
  CurrencyText,
  Button,
  Avatar,
  RatingStars,
  BottomSheet,
  Input,
} from '@daloa/ui';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  PhoneCall,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  MapPin,
} from 'lucide-react-native';
import { formatDate, formatWhatsAppPhone, Haptics } from '@daloa/utils';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading, refetch } = useOrderDetail(id);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  useEffect(() => {
    if (!id) return;
    const channel = ordersService.subscribeToOrderUpdates(id, () => {
      refetch();
    });
    return () => {
      channel.unsubscribe();
    };
  }, [id, refetch]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Suivi de commande" onBack={() => router.back()} />
        <View style={{ padding: spacing[4] }}>
          <Text style={{ color: colors.dark.text }}>Chargement du suivi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const assignment = order.delivery_assignment;
  const driver = order.delivery_person;
  const seller = order.seller;
  const deliveryOtp = assignment?.delivery_otp;

  const handleCallDriver = () => {
    if (!driver?.phone) return;
    Haptics.lightImpact();
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleCallSeller = () => {
    if (!seller?.phone) return;
    Haptics.lightImpact();
    Linking.openURL(`tel:${seller.phone}`);
  };

  const handleReportDispute = async () => {
    if (!disputeReason.trim()) return;
    try {
      setIsSubmittingDispute(true);
      await ordersService.reportDispute(order.id, disputeReason.trim());
      Haptics.warning();
      setIsDisputeModalOpen(false);
      refetch();
      Alert.alert('Litige signalé', 'Votre signalement a été transmis à l’équipe de médiation DaloaMarket.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de signaler le litige.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Étapes de la timeline
  const steps = [
    { key: 'paid', label: 'Commande payée', done: order.status !== 'pending_payment' },
    { key: 'accepted', label: 'Livreur assigné', done: Boolean(assignment?.delivery_person_id) },
    { key: 'picked_up', label: 'Colis ramassé chez le vendeur', done: assignment?.status === 'picked_up' || assignment?.status === 'in_transit' || assignment?.status === 'delivered' },
    { key: 'in_transit', label: 'En cours de livraison', done: assignment?.status === 'in_transit' || assignment?.status === 'delivered' },
    { key: 'delivered', label: 'Colis livré & validé', done: order.status === 'delivered' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={`Commande #${order.id.slice(0, 8).toUpperCase()}`}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Statut Global */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusTitle}>État de la livraison</Text>
              <Text style={styles.statusDate}>{formatDate(order.created_at, true)}</Text>
            </View>
            <StatusPill status={order.status} />
          </View>

          {/* OTP Box haute sécurité */}
          {deliveryOtp && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <View style={styles.otpBox}>
              <View style={styles.otpHeader}>
                <KeyRound size={18} color="#10B981" />
                <Text style={styles.otpTitle}>Code Secret de Livraison (OTP)</Text>
              </View>
              <Text style={styles.otpCodeText}>{deliveryOtp}</Text>
              <Text style={styles.otpWarning}>
                ⚠️ Donnez ce code au livreur UNIQUEMENT après avoir reçu et inspecté votre colis.
              </Text>
            </View>
          )}
        </Card>

        {/* Timeline Interactive */}
        <Text style={styles.sectionTitle}>Progression de la livraison</Text>
        <Card style={styles.timelineCard}>
          {steps.map((s, idx) => (
            <View key={s.key} style={styles.timelineItem}>
              <View style={styles.timelineIconCol}>
                <View style={[styles.timelineDot, s.done && styles.timelineDotDone]}>
                  {s.done ? <CheckCircle2 size={14} color="#FFFFFF" /> : <Clock size={12} color={colors.dark.textDim} />}
                </View>
                {idx < steps.length - 1 && (
                  <View style={[styles.timelineLine, s.done && styles.timelineLineDone]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, s.done && styles.timelineLabelDone]}>
                  {s.label}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Livreur Assigné */}
        {driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre Livreur DaloaDelivery</Text>
            <Card style={styles.personCard}>
              <Avatar uri={driver.photo_url} name={driver.name} size={50} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{driver.name}</Text>
                <Text style={styles.personSub}>Véhicule : {driver.vehicle_type.toUpperCase()}</Text>
                <RatingStars rating={driver.rating || 5.0} totalReviews={driver.total_reviews} size={12} />
              </View>
              <TouchableOpacity onPress={handleCallDriver} style={styles.callBtn}>
                <PhoneCall size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Vendeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendeur</Text>
          <Card style={styles.personCard}>
            <Avatar uri={seller?.shop_logo_url || seller?.avatar_url} name={seller?.shop_name || seller?.full_name} size={50} />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{seller?.shop_name || seller?.full_name}</Text>
              <Text style={styles.personSub}>Quartier : {seller?.district || 'Daloa'}</Text>
            </View>
            <TouchableOpacity onPress={handleCallSeller} style={styles.callBtnOutline}>
              <PhoneCall size={18} color={colors.dark.text} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Récapitulatif Article & Montant */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Détail de la commande</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Article</Text>
            <Text style={styles.summaryValue}>{order.listing?.title}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantité</Text>
            <Text style={styles.summaryValue}>x{order.quantity || 1}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Adresse de livraison</Text>
            <Text style={styles.summaryValue}>{order.delivery_address} ({order.delivery_district})</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Montant Total</Text>
            <CurrencyText amount={order.total_amount} size="lg" weight="bold" color={colors.market.primary} />
          </View>
        </Card>

        {/* Action Litige / Signalement */}
        {order.status !== 'cancelled' && (
          <TouchableOpacity
            onPress={() => setIsDisputeModalOpen(true)}
            style={styles.disputeBtn}
          >
            <AlertTriangle size={16} color={colors.status.error} />
            <Text style={styles.disputeBtnText}>Signaler un problème / Ouvrir un litige</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modale Déclaration de Litige */}
      <BottomSheet
        visible={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="Signaler un problème"
      >
        <Text style={styles.disputeModalSub}>
          Veuillez décrire la situation (ex: colis non conforme, retard anormal, livreur injoignable). Les fonds resteront bloqués en séquestre pendant l'analyse.
        </Text>
        <Input
          label="Motif du litige *"
          placeholder="Détaillez le problème rencontré..."
          value={disputeReason}
          onChangeText={setDisputeReason}
          multiline
          numberOfLines={4}
          inputStyle={{ minHeight: 90, textAlignVertical: 'top' }}
        />
        <Button
          title="Soumettre le litige"
          variant="danger"
          loading={isSubmittingDispute}
          onPress={handleReportDispute}
          style={{ marginTop: spacing[3] }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  statusCard: {
    padding: spacing[4],
    gap: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  statusDate: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  otpBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: radii.xl,
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing[2],
  },
  otpTitle: {
    color: '#10B981',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  otpCodeText: {
    color: '#10B981',
    fontSize: 32,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 8,
    marginVertical: 4,
  },
  otpWarning: {
    color: colors.dark.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  timelineCard: {
    padding: spacing[4],
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 44,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.dark.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.status.success,
    borderColor: colors.status.success,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.dark.border,
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: colors.status.success,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing[3],
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  timelineLabel: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  timelineLabelDone: {
    color: colors.dark.text,
    fontWeight: typography.weights.semibold,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
  personName: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  personSub: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnOutline: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    padding: spacing[4],
    gap: spacing[3],
  },
  summaryTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  summaryValue: {
    color: colors.dark.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    maxWidth: 200,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: spacing[2],
  },
  totalLabel: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[3],
  },
  disputeBtnText: {
    color: colors.status.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  disputeModalSub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginBottom: spacing[3],
  },
});
