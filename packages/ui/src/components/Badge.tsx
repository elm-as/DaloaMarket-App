import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';

export interface BadgeProps {
  label: string | number;
  variant?: 'pro' | 'verified' | 'count' | 'escrow' | 'discount';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'pro', style }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'pro':
        return {
          bg: '#F59E0B',
          text: '#000000',
        };
      case 'verified':
        return {
          bg: colors.market.accent,
          text: '#FFFFFF',
        };
      case 'discount':
        return {
          bg: colors.status.error,
          text: '#FFFFFF',
        };
      case 'escrow':
        return {
          bg: colors.status.escrow,
          text: '#FFFFFF',
        };
      case 'count':
      default:
        return {
          bg: colors.market.primary,
          text: '#FFFFFF',
        };
    }
  };

  const config = getBadgeStyle();

  return (
    <View style={[styles.container, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
});
