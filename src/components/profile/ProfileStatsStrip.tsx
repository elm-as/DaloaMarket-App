import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Package, CheckCircle, Star } from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable, useAccent } from '@daloa/ui';

interface ProfileStatsStripProps {
  activeCount: number;
  soldCount: number;
  reviewCount: number;
  rating?: number | null;
  onPressActive?: () => void;
  onPressSold?: () => void;
}

export const ProfileStatsStrip: React.FC<ProfileStatsStripProps> = ({
  activeCount,
  soldCount,
  reviewCount,
  rating,
  onPressActive,
  onPressSold,
}) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* 1. Annonces en vente */}
      <AppPressable
        haptic="selection"
        onPress={onPressActive}
        style={styles.statCard}
        accessibilityLabel={`Voir les ${activeCount} annonces en vente`}
      >
        <View style={[styles.iconCircle, { backgroundColor: accent[50] }]}>
          <Package size={14} color={accent[600]} />
        </View>
        <AppText variant="h2" color={colors.text.body} style={styles.statNumber}>
          {activeCount}
        </AppText>
        <AppText variant="caption" color={colors.text.subtle} style={styles.statLabel}>
          En vente
        </AppText>
      </AppPressable>

      {/* 2. Ventes terminées */}
      <AppPressable
        haptic="selection"
        onPress={onPressSold}
        style={styles.statCard}
        accessibilityLabel={`Voir les ${soldCount} annonces vendues`}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.status.successLight }]}>
          <CheckCircle size={14} color={colors.status.successDark} />
        </View>
        <AppText variant="h2" color={colors.text.body} style={styles.statNumber}>
          {soldCount}
        </AppText>
        <AppText variant="caption" color={colors.text.subtle} style={styles.statLabel}>
          Vendues
        </AppText>
      </AppPressable>

      {/* 3. Avis clients */}
      <View style={styles.statCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
          <Star size={14} color="#D97706" fill="#D97706" />
        </View>
        <AppText variant="h2" color={colors.text.body} style={styles.statNumber}>
          {rating != null && rating > 0 ? rating.toFixed(1) : reviewCount}
        </AppText>
        <AppText variant="caption" color={colors.text.subtle} style={styles.statLabel}>
          {reviewCount > 0 ? `${reviewCount} avis` : 'Avis'}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: -spacing[3],
    marginBottom: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    lineHeight: 24,
  },
  statLabel: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
