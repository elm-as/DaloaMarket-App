import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldCheck, Truck } from 'lucide-react-native';
import { colors, radii, spacing, AppText } from '@daloa/ui';

export const ListingTrustBadges: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.item}>
      <View style={[styles.iconCircle, { backgroundColor: colors.status.successLight }]}>
        <ShieldCheck size={18} color={colors.status.successDark} />
      </View>
      <View>
        <AppText variant="label" color={colors.text.body}>
          Paiement Sécurisé
        </AppText>
        <AppText variant="caption" color={colors.text.muted}>
          Protection Escrow
        </AppText>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.item}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary[50] }]}>
        <Truck size={18} color={colors.primary.DEFAULT} />
      </View>
      <View>
        <AppText variant="label" color={colors.text.body}>
          Livraison Daloa
        </AppText>
        <AppText variant="caption" color={colors.text.muted}>
          Par DaloaDelivery
        </AppText>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    marginTop: spacing[3],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing[2],
  },
});
