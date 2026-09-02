import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';

interface CartSummaryCardProps {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  grandTotal: number;
  itemCount: number;
  onCheckout: () => void;
}

export const CartSummaryCard: React.FC<CartSummaryCardProps> = ({
  subtotal,
  deliveryFee,
  serviceFee,
  grandTotal,
  itemCount,
  onCheckout,
}) => {
  const accent = useAccent();

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRow}>
      <AppText variant="body" color={colors.text.muted}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.tnum}>
        {value}
      </AppText>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <AppText variant="bodyStrong" style={styles.cardTitle}>
          Récapitulatif de la commande
        </AppText>

        <Row label={`Sous-total (${itemCount} article${itemCount > 1 ? 's' : ''})`} value={formatFCFA(subtotal)} />
        <Row label="Livraison locale estimée" value={formatFCFA(deliveryFee)} />
        <Row label="Protection séquestre & service (2%)" value={formatFCFA(serviceFee)} />

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <AppText variant="bodyStrong">Total à payer</AppText>
          <AppText variant="h2" color={accent[600]} style={styles.tnum}>
            {formatFCFA(grandTotal)}
          </AppText>
        </View>

        {/* Réassurance séquestre */}
        <View style={styles.escrowBanner}>
          <ShieldCheck size={16} color={colors.status.successDark} />
          <AppText variant="caption" color={colors.status.successDark} style={styles.escrowText}>
            Paiement 100% protégé par séquestre. Le vendeur n'est crédité qu'après confirmation de votre
            code OTP à la livraison.
          </AppText>
        </View>

        {/* CTA */}
        <AppPressable
          haptic="success"
          onPress={onCheckout}
          rippleColor="rgba(255,255,255,0.24)"
          style={[styles.checkoutBtn, { backgroundColor: accent.DEFAULT }]}
          accessibilityRole="button"
          accessibilityLabel="Commander via séquestre"
        >
          <Lock size={15} color={colors.text.inverse} />
          <AppText variant="label" color={colors.text.inverse}>
            Commander via Séquestre
          </AppText>
          <ArrowRight size={15} color={colors.text.inverse} />
        </AppPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  summaryCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tnum: {
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
    borderRadius: radii.xl,
    padding: spacing[3],
    gap: spacing[2],
    marginTop: 4,
  },
  escrowText: {
    flex: 1,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radii.xl,
    gap: spacing[2],
    marginTop: 6,
    overflow: 'hidden',
  },
});
