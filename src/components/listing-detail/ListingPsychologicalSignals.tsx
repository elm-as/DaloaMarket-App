import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography, AppText } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';
import { PackageCheck, ShieldCheck, Truck } from 'lucide-react-native';

interface ListingPsychologicalSignalsProps {
  listingId: string;
  stock: number;
  currentPrice: number;
  originalPrice?: number | null;
}

/**
 * Indicateurs factuels de stock et garanties transactionnelles
 * sur la fiche produit mobile.
 */
export const ListingPsychologicalSignals: React.FC<ListingPsychologicalSignalsProps> = ({
  stock,
  currentPrice,
  originalPrice,
}) => {
  const effectiveStock = Math.max(0, stock);
  const isLowStock = effectiveStock > 0 && effectiveStock <= 3;
  const savingsAmount =
    originalPrice != null && originalPrice > currentPrice
      ? originalPrice - currentPrice
      : 0;

  return (
    <View style={styles.container}>
      {(isLowStock || savingsAmount > 0) && (
        <View style={styles.badgesWrap}>
          {isLowStock && (
            <View style={[styles.chip, styles.chipAmber]}>
              <PackageCheck size={13} color="#B45309" />
              <AppText variant="caption" color="#92400E" style={styles.chipText}>
                Stock restant : {effectiveStock} unité{effectiveStock > 1 ? 's' : ''}
              </AppText>
            </View>
          )}

          {savingsAmount > 0 && (
            <View style={[styles.chip, styles.chipGreen]}>
              <AppText variant="caption" color="#065F46" style={styles.chipText}>
                Remise immédiate : -{formatFCFA(savingsAmount)}
              </AppText>
            </View>
          )}
        </View>
      )}

      <View style={styles.trustGrid}>
        <View style={styles.trustCard}>
          <View style={[styles.trustIcon, styles.trustIconGreen]}>
            <ShieldCheck size={15} color="#047857" />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
              Paiement protégé par code OTP
            </AppText>
            <AppText variant="caption" color={colors.text.muted} style={styles.trustSub}>
              Fonds conservés jusqu’à la remise de l’article. Remboursé si non livré ou non conforme.
            </AppText>
          </View>
        </View>

        <View style={styles.trustCard}>
          <View style={[styles.trustIcon, styles.trustIconOrange]}>
            <Truck size={15} color="#C2410C" />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
              Livraison locale à Daloa
            </AppText>
            <AppText variant="caption" color={colors.text.muted} style={styles.trustSub}>
              Prise en charge en boutique et livraison à domicile par un coursier DaloaDelivery.
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  chipAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  chipGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  chipText: {
    fontFamily: typography.families.semibold,
    fontVariant: ['tabular-nums'],
  },
  trustGrid: {
    gap: spacing[2],
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2] + 2,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  trustIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    borderWidth: 1,
  },
  trustIconGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  trustIconOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  trustSub: {
    marginTop: 2,
    lineHeight: 16,
  },
  flex1: {
    flex: 1,
  },
});
