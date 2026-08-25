import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';

export type StatusPillType =
  | 'pending_payment'
  | 'awaiting_pickup'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'disputed'
  | 'cancelled'
  | 'paid';

export interface StatusPillProps {
  status: StatusPillType | string;
  label?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, size = 'md', style }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'delivered':
        return {
          bg: colors.status.successBg,
          text: colors.status.success,
          defaultLabel: 'Livré',
          dotColor: colors.status.success,
        };
      case 'picked_up':
      case 'in_transit':
        return {
          bg: 'rgba(6, 182, 212, 0.12)',
          text: colors.delivery.primary,
          defaultLabel: 'En transit',
          dotColor: colors.delivery.primary,
        };
      case 'accepted':
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          text: colors.status.info,
          defaultLabel: 'Livreur assigné',
          dotColor: colors.status.info,
        };
      case 'awaiting_pickup':
        return {
          bg: 'rgba(249, 115, 22, 0.12)',
          text: colors.market.primary,
          defaultLabel: 'En préparation',
          dotColor: colors.market.primary,
        };
      case 'pending_payment':
        return {
          bg: colors.status.warningBg,
          text: colors.status.warning,
          defaultLabel: 'Paiement en attente',
          dotColor: colors.status.warning,
        };
      case 'disputed':
        return {
          bg: colors.status.errorBg,
          text: colors.status.error,
          defaultLabel: 'Litige ouvert',
          dotColor: colors.status.error,
        };
      case 'cancelled':
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          text: colors.dark.textMuted,
          defaultLabel: 'Annulé',
          dotColor: colors.dark.textMuted,
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          text: colors.dark.text,
          defaultLabel: status,
          dotColor: colors.dark.textDim,
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? spacing[2] : spacing[3],
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text
        style={[
          styles.label,
          {
            color: config.text,
            fontSize: isSmall ? typography.sizes.xs : typography.sizes.sm,
            fontWeight: typography.weights.semibold,
          },
        ]}
      >
        {label || config.defaultLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    letterSpacing: 0.2,
  },
});
