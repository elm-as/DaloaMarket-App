import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Route, ShieldCheck, Zap } from 'lucide-react-native';
import { colors, radii, spacing, AppText, useAccent } from '@daloa/ui';
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
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Zap size={14} color={accent.DEFAULT} />
          <AppText variant="overline" color={accent[700]}>
            DEVIS KILOMÉTRIQUE OFFICIEL
          </AppText>
        </View>
        <AppText variant="h2" color={accent[900]} style={styles.priceText}>
          {formatFCFA(deliveryFee)}
        </AppText>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Route size={13} color={colors.text.muted} />
          <AppText variant="caption" color={colors.text.body}>
            Distance estimée : <AppText variant="caption" style={styles.tabular}>{distanceKm} km</AppText>
          </AppText>
        </View>
        <AppText variant="caption" color={colors.text.subtle}>•</AppText>
        <AppText variant="caption" color={colors.text.muted}>
          Gain net coursier : <AppText variant="caption" style={styles.tabular}>{formatFCFA(driverNetGain)}</AppText>
        </AppText>
      </View>

      <View style={styles.routeSummary}>
        <AppText variant="caption" color={colors.text.body} numberOfLines={1}>
          Trajet : {pickupDistrict || 'Départ'} ➔ {dropoffDistrict || 'Arrivée'}
        </AppText>
      </View>

      <View style={styles.securityFooter}>
        <ShieldCheck size={14} color={colors.status.successDark} />
        <AppText variant="caption" color={colors.status.successDark} style={styles.securityText}>
          Sécurisé par double code OTP (au ramassage et à la remise).
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontVariant: ['tabular-nums'],
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeSummary: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radii.md,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    marginBottom: spacing[2],
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing[1],
  },
  securityText: {
    flex: 1,
  },
});
