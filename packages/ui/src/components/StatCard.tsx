import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Card } from './Card';
import { CurrencyText } from './CurrencyText';

export interface StatCardProps {
  label: string;
  value: string | number;
  isCurrency?: boolean;
  currencyColor?: string;
  icon?: React.ReactNode;
  trend?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  isCurrency = false,
  currencyColor = colors.market.primary,
  icon,
  trend,
  style,
}) => {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconBox}>{icon}</View>}
      </View>
      <View style={styles.bottomRow}>
        {isCurrency ? (
          <CurrencyText
            amount={typeof value === 'number' ? value : parseFloat(value as string) || 0}
            size="xl"
            weight="bold"
            color={currencyColor}
          />
        ) : (
          <Text style={styles.valueText}>{value}</Text>
        )}
        {trend && <Text style={styles.trendText}>{trend}</Text>}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: spacing[3] + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  label: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: colors.dark.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    marginTop: 2,
  },
  valueText: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  trendText: {
    color: colors.status.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
});
