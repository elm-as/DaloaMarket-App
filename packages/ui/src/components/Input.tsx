import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  isPassword = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.grey[400]}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, inputStyle]}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconContainer}
          >
            <Text style={styles.showHideText}>{showPassword ? 'Masquer' : 'Voir'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  label: {
    color: colors.text.DEFAULT,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.bold,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.primary.DEFAULT,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  input: {
    flex: 1,
    color: colors.text.DEFAULT,
    fontSize: typography.sizes.sm,
    paddingVertical: spacing[2],
    fontFamily: typography.families.medium,
  },
  leftIconContainer: {
    marginRight: spacing[2],
  },
  rightIconContainer: {
    marginLeft: spacing[2],
  },
  showHideText: {
    color: colors.primary.DEFAULT,
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.bold,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    marginTop: 4,
    fontFamily: typography.families.semibold,
  },
  helperText: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.normal,
    marginTop: 4,
  },
});
