import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { colors, radii, spacing, Button, AppText, useAccent, typography } from '@daloa/ui';
import { ArrowLeft, ShieldCheck, Gift } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';
import {
  PaymentMethodSelector,
  PaymentMode,
  MobileMoneyOperator,
} from './PaymentMethodSelector';

interface CheckoutStepPaymentProps {
  deliveryMode: 'delivery' | 'pickup';
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  operator: MobileMoneyOperator;
  onOperatorChange: (op: MobileMoneyOperator) => void;
  isCodAllowed: boolean;
  isCodBlocked?: boolean;
  codBlockedNotice?: string;
  onlineDisabled?: boolean;
  onlineNotice?: string;
  quantity: number;
  activePrice: number;
  deliveryFee: number;
  buyerServiceFee: number;
  daloaCashBalance?: number;
  useDaloaCash?: boolean;
  onToggleDaloaCash?: (use: boolean) => void;
  daloaCashDiscount?: number;
  groupedDeliveryDiscount?: number;
  totalAmount: number;
  distanceKm: number;
  isSubmitting: boolean;
  /** Prix serveur : en calcul, indisponible (bouton = réessayer) ou prêt. */
  priceStatus?: 'loading' | 'error' | 'ready';
  onRetryPrice?: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function CheckoutStepPayment({
  deliveryMode,
  paymentMode,
  onPaymentModeChange,
  operator,
  onOperatorChange,
  isCodAllowed,
  isCodBlocked,
  codBlockedNotice,
  onlineDisabled = false,
  onlineNotice,
  quantity,
  activePrice,
  deliveryFee,
  buyerServiceFee,
  daloaCashBalance = 0,
  useDaloaCash = false,
  onToggleDaloaCash,
  daloaCashDiscount = 0,
  groupedDeliveryDiscount = 0,
  totalAmount,
  distanceKm,
  isSubmitting,
  priceStatus = 'ready',
  onRetryPrice,
  onBack,
  onSubmit,
}: CheckoutStepPaymentProps) {
  const accent = useAccent();

  const actionLabel =
    paymentMode === 'cod'
      ? `Confirmer la commande (${formatFCFA(totalAmount)})`
      : paymentMode === 'cash_at_shop'
      ? `Valider le retrait (${formatFCFA(totalAmount)})`
      : onlineDisabled
      ? 'Paiement en ligne temporairement indisponible'
      : `Payer avec ${operator.toUpperCase()} · ${formatFCFA(totalAmount)}`;

  return (
    <View style={styles.container}>
      {/* 1. Sélecteur de méthode de règlement */}
      <PaymentMethodSelector
        deliveryMode={deliveryMode}
        paymentMode={paymentMode}
        onPaymentModeChange={onPaymentModeChange}
        operator={operator}
        onOperatorChange={onOperatorChange}
        isCodAllowed={isCodAllowed}
        isCodBlocked={isCodBlocked}
        codBlockedNotice={codBlockedNotice}
        onlineDisabled={onlineDisabled}
        onlineNotice={onlineNotice}
      />

      {/* Option Daloa Cash : Réduction sur la livraison */}
      {daloaCashBalance > 0 && deliveryMode === 'delivery' && deliveryFee > 0 && (
        <View style={styles.daloaCashCard}>
          <View style={styles.daloaCashLeft}>
            <View style={styles.daloaCashIconCircle}>
              <Gift size={18} color={colors.status.successDark} />
            </View>
            <View style={styles.flex1}>
              <View style={styles.daloaCashTitleRow}>
                <AppText variant="bodyStrong">Utiliser mon Daloa Cash</AppText>
                <AppText variant="caption" color={colors.status.successDark} style={styles.cashAvailableText}>
                  {formatFCFA(daloaCashBalance)} dispo
                </AppText>
              </View>
              <AppText variant="caption" color={colors.text.muted}>
                Déduire {formatFCFA(Math.min(daloaCashBalance, deliveryFee))} sur la livraison
              </AppText>
            </View>
          </View>
          <Switch
            value={useDaloaCash}
            onValueChange={onToggleDaloaCash}
            trackColor={{ false: colors.border.DEFAULT, true: colors.status.successLight }}
            thumbColor={useDaloaCash ? colors.status.successDark : colors.grey[300]}
          />
        </View>
      )}

      {/* 2. Récapitulatif transparent de la commande */}
      <View style={styles.breakdownCard}>
        <AppText variant="bodyStrong" style={styles.breakdownTitle}>
          Récapitulatif de la commande
        </AppText>

        <View style={styles.breakRow}>
          <AppText variant="caption" color={colors.text.muted} style={styles.breakLabel}>
            Article ({quantity}x)
          </AppText>
          <AppText variant="body" style={[styles.boldNum, styles.breakAmount]} numberOfLines={1}>
            {formatFCFA(activePrice * quantity)}
          </AppText>
        </View>

        <View style={styles.breakRow}>
          <AppText variant="caption" color={colors.text.muted} style={styles.breakLabel}>
            {deliveryMode === 'pickup'
              ? 'Retrait en boutique'
              : `Livraison DaloaDelivery (${distanceKm.toFixed(1)} km)`}
          </AppText>
          <AppText
            variant="body"
            color={deliveryMode === 'pickup' ? colors.status.successDark : colors.text.DEFAULT}
            style={[styles.boldNum, styles.breakAmount]}
            numberOfLines={1}
          >
            {deliveryMode === 'pickup' ? '0 FCFA' : formatFCFA(deliveryFee)}
          </AppText>
        </View>

        {buyerServiceFee > 0 && (
          <View style={styles.breakRow}>
            <AppText variant="caption" color={colors.text.muted} style={styles.breakLabel}>
              Frais de service plateforme (2%)
            </AppText>
            <AppText variant="body" style={[styles.boldNum, styles.breakAmount]} numberOfLines={1}>
              {formatFCFA(buyerServiceFee)}
            </AppText>
          </View>
        )}

        {daloaCashDiscount > 0 && (
          <View style={styles.breakRow}>
            <AppText variant="caption" color={colors.status.successDark} style={styles.breakLabel}>
              Réduction Daloa Cash (parrainage)
            </AppText>
            <AppText
              variant="body"
              color={colors.status.successDark}
              style={[styles.boldNum, styles.breakAmount]}
              numberOfLines={1}
            >
              -{formatFCFA(daloaCashDiscount)}
            </AppText>
          </View>
        )}

        {groupedDeliveryDiscount > 0 && (
          <View style={styles.breakRow}>
            <AppText variant="caption" color={colors.status.successDark} style={styles.breakLabel}>
              Économie livraison groupée
            </AppText>
            <AppText
              variant="body"
              color={colors.status.successDark}
              style={[styles.boldNum, styles.breakAmount]}
              numberOfLines={1}
            >
              -{formatFCFA(groupedDeliveryDiscount)}
            </AppText>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View style={styles.totalLabel}>
            <AppText variant="bodyStrong">Total net à régler</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              {paymentMode === 'cod'
                ? 'Règlement au livreur'
                : paymentMode === 'cash_at_shop'
                ? 'Règlement en boutique'
                : 'Paiement sécurisé en ligne (Mobile Money)'}
            </AppText>
          </View>
          <AppText variant="h2" color={accent[600]} style={styles.totalAmountText} numberOfLines={1}>
            {formatFCFA(totalAmount)}
          </AppText>
        </View>
      </View>

      {/* Garantie double OTP */}
      <View style={styles.otpNoticeBox}>
        <ShieldCheck size={16} color={accent[700]} />
        <AppText variant="caption" color={colors.text.body} style={styles.flex1} numberOfLines={2}>
          <AppText variant="caption" style={styles.boldNum}>Code OTP : </AppText>
          Transmettez votre code au livreur seulement après avoir inspecté l'article.
        </AppText>
      </View>

      {/* Boutons d'action pleine largeur */}
      <View style={styles.navRow}>
        <Button
          title={
            isSubmitting
              ? 'Traitement en cours...'
              : priceStatus === 'loading'
              ? 'Calcul du prix…'
              : priceStatus === 'error'
              ? 'Recalculer le prix'
              : actionLabel
          }
          variant="primary"
          size="lg"
          onPress={() => {
            Haptics.selection();
            if (priceStatus === 'error') onRetryPrice?.();
            else onSubmit();
          }}
          disabled={isSubmitting || priceStatus === 'loading' || (paymentMode === 'online' && onlineDisabled)}
          fullWidth
        />
        <Button
          title="Modifier l'adresse ou la livraison"
          variant="outline"
          size="md"
          leftIcon={<ArrowLeft size={16} color={colors.text.body} />}
          onPress={() => {
            Haptics.lightImpact();
            onBack();
          }}
          disabled={isSubmitting}
          fullWidth
          style={styles.backBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  breakdownCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    gap: spacing[2],
  },
  breakdownTitle: { marginBottom: 4 },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  breakLabel: { flex: 1, minWidth: 0 },
  breakAmount: { flexShrink: 0 },
  divider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing[1] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing[1], gap: spacing[3] },
  totalLabel: { flex: 1, minWidth: 0 },
  boldNum: { fontVariant: ['tabular-nums'], fontFamily: typography.families.bold },
  totalAmountText: { flexShrink: 0, fontVariant: ['tabular-nums'], fontFamily: typography.families.extrabold },
  otpNoticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surface, borderRadius: radii.lg, padding: spacing[3], gap: spacing[2], borderWidth: 1, borderColor: colors.border.subtle },
  flex1: { flex: 1 },
  navRow: { gap: spacing[2], marginTop: spacing[2] },
  backBtn: { marginTop: 2 },
  daloaCashCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg.surface, borderRadius: radii.xl, padding: spacing[3], borderWidth: 1, borderColor: colors.status.successLight, gap: spacing[2] },
  daloaCashLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
  daloaCashIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.status.successLight, alignItems: 'center', justifyContent: 'center' },
  daloaCashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  cashAvailableText: { fontVariant: ['tabular-nums'], fontFamily: typography.families.bold },
});
