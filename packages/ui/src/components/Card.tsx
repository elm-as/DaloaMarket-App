import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radii, spacing } from '../tokens';
import { AppPressable } from './AppPressable';

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
          backgroundColor: colors.bg.surface,
          borderColor: colors.border.DEFAULT,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        };
      case 'glowMarket':
        return {
          backgroundColor: colors.bg.surface,
          borderColor: colors.primary.DEFAULT,
          shadowColor: colors.primary.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'glowDelivery':
        return {
          backgroundColor: colors.bg.surface,
          borderColor: colors.secondary.DEFAULT,
          shadowColor: colors.secondary.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'glass':
        return {
          backgroundColor: colors.bg.surface,
          borderColor: colors.border.DEFAULT,
        };
      case 'surface':
      default:
        return {
          backgroundColor: colors.bg.surface,
          borderColor: colors.border.DEFAULT,
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
      <AppPressable
        onPress={onPress}
        haptic="light"
        pressedOpacity={0.92}
        style={[containerStyle, style]}
      >
        {children}
      </AppPressable>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
