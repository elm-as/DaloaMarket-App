import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layers, Sparkles } from 'lucide-react-native';
import { colors, radii, spacing } from '../tokens';
import { useAccent } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { formatFCFA } from '@daloa/utils';

export interface GroupedDeliveryBannerProps {
  sellerCount: number;
  savings?: number;
}

export const GroupedDeliveryBanner: React.FC<GroupedDeliveryBannerProps> = ({
  sellerCount,
  savings = 0,
}) => {
  const accent = useAccent();
  if (sellerCount <= 1) return null;

  return (
    <View style={[styles.container, { backgroundColor: accent[50], borderColor: accent[200] }]}>
      <View style={styles.iconCircle}>
        <Layers size={16} color={accent[700]} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" color={accent[900]}>
            Livraison groupée multi-boutiques
          </AppText>
          {savings > 0 && (
            <View style={styles.savingsBadge}>
              <Sparkles size={11} color={colors.status.successDark} />
              <AppText
                variant="overline"
                color={colors.status.successDark}
                style={styles.tabularNum}
              >
                -{formatFCFA(savings)}
              </AppText>
            </View>
          )}
        </View>

        <AppText variant="caption" color={accent[800]} style={styles.description}>
          Vos commandes auprès de {sellerCount} boutiques sont combinées en une seule course optimisée (+300 FCFA par boutique supplémentaire).
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing[2],
    marginVertical: spacing[2],
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.status.successLight,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  description: {
    lineHeight: 16,
  },
  tabularNum: {
    fontVariant: ['tabular-nums'],
  },
});
