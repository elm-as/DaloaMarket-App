import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Haptics } from '@daloa/utils';

const GAP = 8;

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
  const [rowWidth, setRowWidth] = useState(0);

  const digits = value.split('');
  const isSixDigits = length >= 6;

  // Les cases se réduisent sur les petits écrans : 6 × 44 px + espaces = 304 px,
  // plus que la place disponible sur un téléphone de 320 px de large.
  const maxBox = isSixDigits ? 44 : 52;
  const boxWidth = rowWidth > 0 ? Math.min(maxBox, Math.floor((rowWidth - GAP * (length - 1)) / length)) : maxBox;
  const boxSize = { width: boxWidth, height: Math.round(boxWidth * 1.15) };

  // Laisse le temps au BottomSheet (animation slide du Modal natif ~300ms)
  // de terminer sa transition avant de requérir le focus du clavier.
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleFocus = () => {
    Haptics.lightImpact();
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    Haptics.selection();
    onChange(clean);
  };

  return (
    <Pressable onPress={handleFocus} style={styles.container}>
      <View style={styles.inputWrapper}>
        {/*
          Cases visuelles pass-through :
          pointerEvents="none" garantit que les View n'interceptent aucun événement tactile.
          Le clic traverse directement vers le TextInput natif placé au-dessus.
        */}
        <View
          style={styles.boxesContainer}
          pointerEvents="none"
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
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
                  boxSize,
                  isFilled && styles.boxFilled,
                  isCurrent && styles.boxCurrent,
                  isError && styles.boxError,
                ]}
              >
                {digit ? (
                  <Text
                    style={[
                      styles.digitText,
                      isSixDigits && styles.digitTextSixDigits,
                    ]}
                  >
                    {digit}
                  </Text>
                ) : isCurrent ? (
                  <View style={styles.cursor} />
                ) : null}
              </View>
            );
          })}
        </View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          maxLength={length}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          caretHidden={true}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          selectionColor="transparent"
          style={styles.overlayInput}
          accessibilityLabel={`Saisie du code secret OTP à ${length} chiffres`}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
    alignItems: 'center',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: GAP,
    width: '100%',
  },
  overlayInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    backgroundColor: 'transparent',
    // Certains Android ignorent `color: 'transparent'` : taille 1 évite l'écho visuel derrière les cases.
    fontSize: 1,
    textAlign: 'center',
    zIndex: 20,
    elevation: 20,
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
  },
  boxSixDigits: {
    width: 44,
    height: 50,
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
  cursor: {
    width: 2,
    height: 22,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 1,
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
