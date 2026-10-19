import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ShieldCheck, UserCheck, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { AppText } from './AppText';
import { BuyerReliabilityTier } from '@daloa/types';

export interface BuyerReliabilityBadgeProps {
  score?: number | null;
  tier?: BuyerReliabilityTier;
  deliveredCount?: number | null;
  refusedCount?: number | null;
  compact?: boolean;
  showAdvice?: boolean;
  advice?: string | null;
  style?: StyleProp<ViewStyle>;
}

export function BuyerReliabilityBadge({
  score = 100,
  tier = 'verified',
  deliveredCount = 0,
  refusedCount = 0,
  compact = false,
  showAdvice = false,
  advice,
  style,
}: BuyerReliabilityBadgeProps) {
  const safeScore = score != null ? Math.round(score) : 100;
  const safeDelivered = Math.max(0, deliveredCount ?? 0);
  const safeRefused = Math.max(0, refusedCount ?? 0);

  const config = React.useMemo(() => {
    switch (tier) {
      case 'at_risk':
        return {
          bgColor: '#FEE2E2',
          borderColor: '#F87171',
          textColor: '#B91C1C',
          iconColor: '#B91C1C',
          label: 'Profil à risque',
          Icon: AlertTriangle,
        };
      case 'warning':
        return {
          bgColor: '#FEF3C7',
          borderColor: '#FCD34D',
          textColor: '#B45309',
          iconColor: '#B45309',
          label: 'Vigilance modérée',
          Icon: AlertCircle,
        };
      case 'new_client':
        return {
          bgColor: '#EFF6FF',
          borderColor: '#93C5FD',
          textColor: '#1D4ED8',
          iconColor: '#1D4ED8',
          label: 'Nouveau client',
          Icon: UserCheck,
        };
      case 'verified':
      default:
        return {
          bgColor: colors.status.successLight,
          borderColor: '#86EFAC',
          textColor: colors.status.successDark,
          iconColor: colors.status.successDark,
          label: 'Client fiable',
          Icon: ShieldCheck,
        };
    }
  }, [tier]);

  const { Icon } = config;

  if (compact) {
    return (
      <View
        style={[
          styles.badgePill,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
          style,
        ]}
      >
        <Icon size={12} color={config.iconColor} strokeWidth={2.5} />
        <AppText
          variant="caption"
          color={config.textColor}
          style={[styles.boldText, styles.tnumText]}
        >
          {tier === 'new_client' ? 'Nouveau' : `${safeScore}%`}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badgePill,
            { backgroundColor: config.bgColor, borderColor: config.borderColor },
          ]}
        >
          <Icon size={13} color={config.iconColor} strokeWidth={2.5} />
          <AppText
            variant="caption"
            color={config.textColor}
            style={[styles.boldText, styles.tnumText]}
          >
            {config.label} • {tier === 'new_client' ? '1ère commande' : `${safeScore}%`}
          </AppText>
        </View>

        {safeDelivered + safeRefused > 0 && (
          <View style={styles.statsRow}>
            <AppText variant="caption" color={colors.text.muted} style={styles.tnumText}>
              {safeDelivered} livrée{safeDelivered > 1 ? 's' : ''}
              {safeRefused > 0 ? ` · ${safeRefused} refus` : ''}
            </AppText>
          </View>
        )}
      </View>

      {showAdvice && advice ? (
        <View style={[styles.adviceBox, { backgroundColor: config.bgColor }]}>
          <AppText variant="caption" color={config.textColor} style={styles.adviceText}>
            💡 {advice}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    gap: spacing[1],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boldText: {
    fontFamily: typography.families.bold,
  },
  tnumText: {
    fontVariant: ['tabular-nums'],
  },
  adviceBox: {
    marginTop: 4,
    padding: spacing[2],
    borderRadius: radii.md,
  },
  adviceText: {
    lineHeight: 16,
    fontFamily: typography.families.medium,
  },
});
