import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, typography, shadows } from '../tokens';
import { Haptics } from '@daloa/utils';

export type ButtonVariant = 'primary' | 'market' | 'delivery' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'market',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.lightImpact();
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.xl,
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingVertical = spacing[2];
        base.paddingHorizontal = spacing[3];
        break;
      case 'lg':
        base.paddingVertical = spacing[4];
        base.paddingHorizontal = spacing[6];
        break;
      case 'md':
      default:
        base.paddingVertical = spacing[3] + 2;
        base.paddingHorizontal = spacing[5];
        break;
    }

    // Variant
    switch (variant) {
      case 'market':
      case 'primary':
        base.backgroundColor = colors.market.primary;
        Object.assign(base, shadows.glowMarket);
        break;
      case 'delivery':
        base.backgroundColor = colors.delivery.primary;
        Object.assign(base, shadows.glowDelivery);
        break;
      case 'secondary':
        base.backgroundColor = colors.dark.surfaceRaised;
        base.borderWidth = 1;
        base.borderColor = colors.dark.border;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = colors.dark.borderLight;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'danger':
        base.backgroundColor = colors.status.error;
        break;
      case 'success':
        base.backgroundColor = colors.status.success;
        break;
    }

    if (disabled) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'market':
      case 'primary':
      case 'danger':
      case 'success':
        return '#FFFFFF';
      case 'delivery':
        return '#090D16';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return colors.dark.text;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? typography.sizes.sm : size === 'lg' ? typography.sizes.lg : typography.sizes.base,
                fontWeight: typography.weights.semibold,
                marginLeft: leftIcon ? spacing[2] : 0,
                marginRight: rightIcon ? spacing[2] : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
        </>
      )}
    </TouchableOpacity>
  };
};

const styles = StyleSheet.create({
  text: {
    letterSpacing: 0.2,
  },
});
