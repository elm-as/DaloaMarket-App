import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { AppPressable } from './AppPressable';

export type ButtonVariant =
  | 'primary'
  | 'market'
  | 'secondary'
  | 'delivery'
  | 'outline'
  | 'ghost'
  | 'whatsapp'
  | 'danger'
  | 'success'
  | 'soft';

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
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  /** Onde d'encre adaptée : claire sur fond coloré, sombre sur fond clair. */
  const getRippleColor = (): string => {
    switch (variant) {
      case 'outline':
      case 'ghost':
      case 'soft':
        return 'rgba(0,0,0,0.08)';
      default:
        return 'rgba(255,255,255,0.24)';
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.lg,
      overflow: 'hidden', // découpe l'onde ripple aux coins arrondis
      width: fullWidth ? '100%' : undefined,
    };

    // Sizes
    switch (size) {
      case 'sm':
        base.paddingVertical = 7;
        base.paddingHorizontal = spacing[3];
        base.borderRadius = radii.md;
        break;
      case 'lg':
        base.paddingVertical = 14;
        base.paddingHorizontal = spacing[6];
        base.borderRadius = radii.xl;
        break;
      case 'md':
      default:
        base.paddingVertical = 11;
        base.paddingHorizontal = spacing[4];
        base.borderRadius = radii.lg;
        break;
    }

    // Variants (1:1 avec les styles CSS du site Web)
    switch (variant) {
      case 'market':
      case 'primary':
        base.backgroundColor = colors.primary.DEFAULT;
        base.shadowColor = colors.primary.DEFAULT;
        base.shadowOffset = { width: 0, height: 4 };
        base.shadowOpacity = 0.28;
        base.shadowRadius = 8;
        base.elevation = 4;
        break;
      case 'secondary':
      case 'delivery':
        base.backgroundColor = colors.secondary.DEFAULT;
        base.shadowColor = colors.secondary.DEFAULT;
        base.shadowOffset = { width: 0, height: 4 };
        base.shadowOpacity = 0.25;
        base.shadowRadius = 8;
        base.elevation = 4;
        break;
      case 'whatsapp':
        base.backgroundColor = colors.whatsapp;
        base.shadowColor = colors.whatsapp;
        base.shadowOffset = { width: 0, height: 3 };
        base.shadowOpacity = 0.25;
        base.shadowRadius = 6;
        base.elevation = 3;
        break;
      case 'soft':
        base.backgroundColor = colors.primary[50];
        base.borderWidth = 1;
        base.borderColor = colors.primary[100];
        break;
      case 'outline':
        base.backgroundColor = colors.bg.surface;
        base.borderWidth = 1.5;
        base.borderColor = colors.border.DEFAULT;
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
      base.opacity = 0.45;
      base.shadowOpacity = 0;
      base.elevation = 0;
    }

    return base;
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'market':
      case 'primary':
      case 'secondary':
      case 'delivery':
      case 'whatsapp':
      case 'danger':
      case 'success':
        return colors.text.inverse;
      case 'soft':
        return colors.primary[700];
      case 'outline':
        return colors.text.DEFAULT;
      case 'ghost':
        return colors.text.body;
      default:
        return colors.text.inverse;
    }
  };

  return (
    <AppPressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic="light"
      rippleColor={getRippleColor()}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={title}
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
                fontSize: size === 'sm' ? typography.sizes.xs : size === 'lg' ? typography.sizes.base : typography.sizes.sm,
                fontFamily: variant === 'ghost' ? typography.families.semibold : typography.families.extrabold,
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
    </AppPressable>
  );
};

const styles = StyleSheet.create({
  text: {
    letterSpacing: 0.1,
  },
});
