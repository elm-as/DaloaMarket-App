import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Keyboard } from 'lucide-react-native';
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
  const boxSize = { width: boxWidth, height: Math.round(boxWidth * 1.18) };

  // Laisse le temps au BottomSheet (animation slide du Modal natif ~300ms)
  // de terminer sa transition avant de requérir le focus du clavier.
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
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
    <View style={styles.container}>
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

        {/*
          TextInput natif plein cadre :
          1. elevation: 20 et zIndex: 20 garantissent qu'il est physiquement au premier plan sur Android.
          2. opacity: 1 avec color: 'transparent' et backgroundColor: 'transparent' permet à Android
             de reconnaître un vrai champ EditText actif et d'invoquer immédiatement le clavier virtuel.
          3. Supporte les chiffres, le presse-papier et la détection automatique OTP SMS.
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
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          selectionColor="transparent"
          style={styles.overlayInput}
          accessibilityLabel={`Saisie du code secret OTP à ${length} chiffres`}
        />
      </View>

      {/* Secours si un appareil n'ouvre pas le clavier au toucher des cases.
          Masqué pendant la saisie : les cases montrent déjà l'avancement. */}
      {!isFocused && (
        <TouchableOpacity
          onPress={handleFocus}
          activeOpacity={0.7}
          style={styles.tapHelper}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le clavier de saisie OTP"
        >
          <Keyboard size={14} color={colors.grey[600]} />
          <Text style={styles.tapHelperText}>Toucher pour saisir le code</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[3],
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
  cursor: {
    width: 2,
    height: 24,
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
  tapHelper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[3],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    backgroundColor: '#F3F4F6',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tapHelperActive: {
    backgroundColor: '#FFF4E6',
    borderColor: colors.primary.DEFAULT,
  },
  tapHelperText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.medium,
    color: colors.grey[600],
  },
  tapHelperTextActive: {
    color: colors.primary.DEFAULT,
    fontFamily: typography.families.bold,
  },
});
