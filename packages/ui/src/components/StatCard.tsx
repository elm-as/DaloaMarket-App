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
  currencyColor = colors.primary.DEFAULT,
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
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  label: {
    color: colors.grey[500],
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.medium,
    fontWeight: typography.weights.medium,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    marginTop: 2,
  },
  valueText: {
    color: '#111827',
    fontSize: typography.sizes.xl,
    fontFamily: typography.families.bold,
    fontWeight: typography.weights.bold,
  },
  trendText: {
    color: colors.status.success,
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.semibold,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
});
