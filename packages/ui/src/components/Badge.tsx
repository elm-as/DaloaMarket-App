import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';

export interface BadgeProps {
  label: string | number;
  variant?: 'pro' | 'verified' | 'count' | 'escrow' | 'discount' | 'default';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'pro', size = 'md', style }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'pro':
        return {
          bg: colors.primary.DEFAULT,
          text: '#FFFFFF',
        };
      case 'verified':
        return {
          bg: colors.status.success,
          text: '#FFFFFF',
        };
      case 'discount':
        return {
          bg: colors.status.error,
          text: '#FFFFFF',
        };
      case 'escrow':
        return {
          bg: colors.secondary.DEFAULT,
          text: '#FFFFFF',
        };
      case 'default':
        return {
          bg: '#F3F4F6',
          text: colors.grey[700],
        };
      case 'count':
      default:
        return {
          bg: colors.primary.DEFAULT,
          text: '#FFFFFF',
        };
    }
  };

  const config = getBadgeStyle();
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          paddingHorizontal: isSm ? 5 : isLg ? 10 : 7,
          paddingVertical: isSm ? 1 : isLg ? 4 : 2,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSm ? 9 : isLg ? 13 : 11,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.families.bold,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
});
