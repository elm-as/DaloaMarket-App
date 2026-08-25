import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Haptics } from '@daloa/utils';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  isError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  value,
  onChange,
  isError = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = value.split('');

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    Haptics.selection();
    onChange(clean);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleContainerPress}
      style={styles.container}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={length}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        autoFocus
      />
      <View style={styles.boxesContainer}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrent = isFocused && index === digits.length;
          const isFilled = digit.length > 0;

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFilled && styles.boxFilled,
                isCurrent && styles.boxCurrent,
                isError && styles.boxError,
              ]}
            >
              <Text style={styles.digitText}>{digit}</Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[3],
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxesContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  box: {
    width: 60,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.dark.borderLight,
    backgroundColor: colors.dark.surface,
  },
  boxCurrent: {
    borderColor: colors.market.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  boxError: {
    borderColor: colors.status.error,
  },
  digitText: {
    color: colors.dark.text,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
  },
});
