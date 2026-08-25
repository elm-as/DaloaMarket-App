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
          placeholderTextColor={colors.dark.textDim}
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
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1] + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    paddingHorizontal: spacing[3],
    minHeight: 50,
  },
  inputFocused: {
    borderColor: colors.market.primary,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  input: {
    flex: 1,
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    paddingVertical: spacing[2],
  },
  leftIconContainer: {
    marginRight: spacing[2],
  },
  rightIconContainer: {
    marginLeft: spacing[2],
  },
  showHideText: {
    color: colors.market.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  helperText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
});
