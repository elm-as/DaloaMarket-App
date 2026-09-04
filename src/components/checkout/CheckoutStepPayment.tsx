import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, Button, AppText, useAccent } from '@daloa/ui';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react-native';
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
  quantity: number;
  activePrice: number;
  deliveryFee: number;
  totalAmount: number;
  distanceKm: number;
  isSubmitting: boolean;
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
  quantity,
  activePrice,
  deliveryFee,
  totalAmount,
  distanceKm,
  isSubmitting,
  onBack,
  onSubmit,
}: CheckoutStepPaymentProps) {
  const accent = useAccent();

  const actionLabel =
    paymentMode === 'cod'
      ? `Confirmer la commande (${formatFCFA(totalAmount)})`
      : paymentMode === 'cash_at_shop'
      ? `Valider le retrait (${formatFCFA(totalAmount)})`
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
      />

      {/* 2. Récapitulatif transparent de la commande */}
      <View style={styles.breakdownCard}>
        <AppText variant="bodyStrong" style={styles.breakdownTitle}>
          Récapitulatif de la commande
        </AppText>

        <View style={styles.breakRow}>
          <AppText variant="caption" color={colors.text.muted}>
            Article ({quantity}x)
          </AppText>
          <AppText variant="body" style={styles.boldNum}>
            {formatFCFA(activePrice * quantity)}
          </AppText>
        </View>

        <View style={styles.breakRow}>
          <AppText variant="caption" color={colors.text.muted}>
            {deliveryMode === 'pickup'
              ? 'Retrait en boutique'
              : `Livraison DaloaDelivery (${distanceKm.toFixed(1)} km)`}
          </AppText>
          <AppText
            variant="body"
            color={deliveryMode === 'pickup' ? colors.status.successDark : colors.text.DEFAULT}
            style={styles.boldNum}
          >
            {deliveryMode === 'pickup' ? '0 FCFA' : formatFCFA(deliveryFee)}
          </AppText>
        </View>

        <View style={styles.breakRow}>
          <AppText variant="caption" color={colors.status.successDark}>
            Frais de service acheteur (0%)
          </AppText>
          <AppText variant="body" color={colors.status.successDark} style={styles.boldNum}>
            0 FCFA
          </AppText>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View>
            <AppText variant="bodyStrong">Total net à régler</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              {paymentMode === 'cod'
                ? 'Règlement au livreur'
                : paymentMode === 'cash_at_shop'
                ? 'Règlement en boutique'
                : 'Paiement sécurisé MoneyFusion'}
            </AppText>
          </View>
          <AppText variant="h2" color={accent[600]} style={styles.totalAmountText}>
            {formatFCFA(totalAmount)}
          </AppText>
        </View>
      </View>

      {/* Garantie double OTP */}
      <View style={styles.otpNoticeBox}>
        <ShieldCheck size={16} color={accent[700]} />
        <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
          <AppText variant="caption" style={styles.boldNum}>Double code OTP : </AppText>
          Ne transmettez votre code de confirmation au livreur qu'après avoir déballé et vérifié l'article.
        </AppText>
      </View>

      {/* Boutons d'action pleine largeur */}
      <View style={styles.navRow}>
        <Button
          title={isSubmitting ? 'Traitement en cours...' : actionLabel}
          variant="primary"
          size="lg"
          onPress={() => {
            Haptics.selection();
            onSubmit();
          }}
          disabled={isSubmitting}
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
  container: {
    gap: spacing[3],
  },
  breakdownCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    gap: spacing[2],
  },
  breakdownTitle: {
    marginBottom: 4,
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[1],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boldNum: {
    fontWeight: '700',
  },
  totalAmountText: {
    fontWeight: '700',
  },
  otpNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  navRow: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  backBtn: {
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
});
