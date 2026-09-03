import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';

/**
 * Enveloppe KeyboardAvoidingView standard (iOS: padding, Android: rien car
 * windowSoftInputMode=adjustResize est géré nativement). Appliqué autour des
 * écrans contenant des TextInput pour éviter le masquage par le clavier.
 */
export function KeyboardScreen({
  children,
  style,
  behavior,
  keyboardVerticalOffset = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  behavior?: 'height' | 'position' | 'padding';
  keyboardVerticalOffset?: number;
}) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={behavior ?? (Platform.OS === 'ios' ? 'padding' : undefined)}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
