import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radii, spacing, shadows } from '../tokens';
import { Haptics } from '@daloa/utils';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'surface' | 'raised' | 'glowMarket' | 'glowDelivery' | 'glass';
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'surface',
  style,
  noPadding = false,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'raised':
        return {
          backgroundColor: colors.dark.surfaceRaised,
          borderColor: colors.dark.borderLight,
        };
      case 'glowMarket':
        return {
          backgroundColor: colors.dark.surface,
          borderColor: 'rgba(249, 115, 22, 0.3)',
          ...shadows.glowMarket,
        };
      case 'glowDelivery':
        return {
          backgroundColor: colors.dark.surface,
          borderColor: 'rgba(6, 182, 212, 0.3)',
          ...shadows.glowDelivery,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(19, 27, 42, 0.85)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        };
      case 'surface':
      default:
        return {
          backgroundColor: colors.dark.surface,
          borderColor: colors.dark.border,
        };
    }
  };

  const containerStyle: ViewStyle = {
    ...styles.base,
    ...getVariantStyle(),
    padding: noPadding ? 0 : spacing[4],
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          Haptics.lightImpact();
          onPress();
        }}
        style={[containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
});
