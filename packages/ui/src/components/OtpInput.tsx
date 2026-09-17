import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Haptics } from '@daloa/utils';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  isError?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  isError = false,
  autoFocus = true,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = value.split('');
  const isSixDigits = length >= 6;

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    Haptics.selection();
    onChange(clean);
  };

  return (
    <Pressable
      onPress={handleFocus}
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Champ de saisie code secret OTP à ${length} chiffres`}
    >
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
                isSixDigits && styles.boxSixDigits,
                isFilled && styles.boxFilled,
                isCurrent && styles.boxCurrent,
                isError && styles.boxError,
              ]}
            >
              <Text
                style={[
                  styles.digitText,
                  isSixDigits && styles.digitTextSixDigits,
                ]}
              >
                {digit}
              </Text>
            </View>
          );
        })}

        {/* 
          Surcouche TextInput plein cadre :
          Sur Android dans un BottomSheet, un champ 1x1 masqué empêche le focus natif.
          Couvrir l'ensemble des cases avec StyleSheet.absoluteFillObject et opacity: 0.01
          permet à l'OS Android de capter directement le tap et d'ouvrir le clavier numérique.
        */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          maxLength={length}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          caretHidden={true}
          autoFocus={autoFocus}
          style={styles.overlayInput}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[3],
    alignItems: 'center',
    width: '100%',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    gap: 8,
  },
  overlayInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  box: {
    width: 52,
    height: 58,
    borderRadius: radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  boxSixDigits: {
    width: 44,
    height: 52,
    borderRadius: radii.lg,
  },
  boxFilled: {
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
  boxCurrent: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: '#FFF4E6',
  },
  boxError: {
    borderColor: colors.status.error,
  },
  digitText: {
    color: '#111827',
    fontSize: typography.sizes['3xl'],
    fontFamily: typography.families.bold,
    fontVariant: ['tabular-nums'],
  },
  digitTextSixDigits: {
    fontSize: typography.sizes['2xl'],
  },
});
