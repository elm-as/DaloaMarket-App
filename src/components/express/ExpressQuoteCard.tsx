import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Route, ShieldCheck, Zap, ArrowRight, Bike } from 'lucide-react-native';
import { colors, radii, spacing, AppText, useAccent, typography } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';

export interface ExpressQuoteCardProps {
  distanceKm: number;
  deliveryFee: number;
  driverNetGain: number;
  pickupDistrict: string;
  dropoffDistrict: string;
}

export const ExpressQuoteCard: React.FC<ExpressQuoteCardProps> = ({
  distanceKm,
  deliveryFee,
  driverNetGain,
  pickupDistrict,
  dropoffDistrict,
}) => {
  const accent = useAccent();

  return (
    <View style={[styles.container, { borderColor: accent[200], backgroundColor: accent[50] }]}>
      {/* 1. Badge d'en-tête */}
      <View style={styles.topRow}>
        <View style={[styles.officialBadge, { backgroundColor: accent[100] }]}>
          <Zap size={13} color={accent[800]} />
          <AppText variant="overline" color={accent[900]} style={styles.officialText}>
            DEVIS KILOMÉTRIQUE OFFICIEL
          </AppText>
        </View>
        <AppText variant="caption" color={accent[700]} style={styles.directText}>
          Tarif garanti
        </AppText>
      </View>

      {/* 2. Prix principal mis en valeur */}
      <View style={styles.priceContainer}>
        <AppText variant="h1" color={accent[900]} style={styles.priceText}>
          {formatFCFA(deliveryFee)}
        </AppText>
        <AppText variant="caption" color={colors.text.muted}>
          Tarif tout compris (sans frais cachés)
        </AppText>
      </View>

      {/* 3. Grille métrique (Distance & Gain coursier) */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconBox}>
            <Route size={14} color={accent[700]} />
          </View>
          <View style={styles.metricTexts}>
            <AppText variant="caption" color={colors.text.muted}>
              Distance
            </AppText>
            <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.tabular}>
              {distanceKm} km
            </AppText>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconBox}>
            <Bike size={14} color={colors.status.successDark} />
          </View>
          <View style={styles.metricTexts}>
            <AppText variant="caption" color={colors.text.muted}>
              Gain coursier
            </AppText>
            <AppText variant="bodyStrong" color={colors.status.successDark} style={styles.tabular}>
              {formatFCFA(driverNetGain)}
            </AppText>
          </View>
        </View>
      </View>

      {/* 4. Trajet résumé */}
      <View style={styles.routePill}>
        <AppText variant="caption" color={colors.text.muted}>
          Trajet :
        </AppText>
        <AppText variant="caption" color={colors.text.DEFAULT} style={styles.districtName} numberOfLines={1}>
          {pickupDistrict || 'Départ'}
        </AppText>
        <ArrowRight size={12} color={accent.DEFAULT} />
        <AppText variant="caption" color={colors.text.DEFAULT} style={styles.districtName} numberOfLines={1}>
          {dropoffDistrict || 'Arrivée'}
        </AppText>
      </View>

      {/* 5. Sécurité double OTP */}
      <View style={styles.securityFooter}>
        <ShieldCheck size={14} color={colors.status.successDark} />
        <AppText variant="caption" color={colors.status.successDark} style={styles.securityText}>
          Sécurisé par double code OTP (ramassage et remise).
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[3],
    marginVertical: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  officialText: {
    letterSpacing: 0.5,
  },
  directText: {
    fontFamily: typography.families.semibold,
  },
  priceContainer: {
    alignItems: 'center',
    paddingVertical: spacing[1],
    marginBottom: spacing[2],
  },
  priceText: {
    fontVariant: ['tabular-nums'],
    fontSize: 26,
    lineHeight: 32,
    fontFamily: typography.families.extrabold,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTexts: {
    flex: 1,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radii.md,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    marginBottom: spacing[2],
  },
  districtName: {
    fontFamily: typography.families.semibold,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
  },
});
