import React from 'react';
import {
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import { Haptics } from '@daloa/utils';

/**
 * <AppPressable> — Le SEUL élément tactile à utiliser dans les écrans.
 *
 * Pourquoi : remplace `TouchableOpacity` (feedback fondu iOS-like = tell n°1 d'un
 * projet RN pas fini). Fournit :
 *   - un ripple d'encre Android natif (`android_ripple`),
 *   - un léger retour d'opacité/scale sur iOS (où il n'y a pas de ripple),
 *   - un `hitSlop` par défaut (cibles confortables ≥ 44 px),
 *   - un retour haptique optionnel intégré.
 *
 * Usage :
 *   <AppPressable onPress={...}><AppText>…</AppText></AppPressable>
 *   <AppPressable haptic="medium" rippleBorderless onPress={...}>…</AppPressable>
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';

export interface AppPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Couleur de l'onde Android. Défaut : encre neutre translucide. */
  rippleColor?: string;
  /** Ripple sans bord (icônes rondes, boutons circulaires). */
  rippleBorderless?: boolean;
  /** Retour haptique au toucher. Défaut : 'light'. 'none' pour désactiver. */
  haptic?: HapticType;
  /** Opacité appliquée pendant l'appui (fallback iOS). Défaut 0.85. */
  pressedOpacity?: number;
  /** Léger scale pendant l'appui (0 = désactivé). Défaut 0. */
  pressedScale?: number;
  children: React.ReactNode;
}

const DEFAULT_RIPPLE = 'rgba(0,0,0,0.10)';

function fireHaptic(type: HapticType) {
  switch (type) {
    case 'light':
      Haptics.lightImpact();
      break;
    case 'medium':
      Haptics.mediumImpact();
      break;
    case 'heavy':
      Haptics.heavyImpact();
      break;
    case 'selection':
      Haptics.selection();
      break;
    case 'success':
      Haptics.success();
      break;
    case 'none':
    default:
      break;
  }
}

export const AppPressable: React.FC<AppPressableProps> = ({
  style,
  rippleColor = DEFAULT_RIPPLE,
  rippleBorderless = false,
  haptic = 'light',
  pressedOpacity = 0.85,
  pressedScale = 0,
  hitSlop = 8,
  onPress,
  disabled,
  children,
  ...rest
}) => {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    if (haptic !== 'none') fireHaptic(haptic);
    onPress?.(e);
  };

  return (
    <Pressable
      android_ripple={{ color: rippleColor, borderless: rippleBorderless }}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        style,
        pressed && {
          opacity: pressedOpacity,
          transform: pressedScale ? [{ scale: pressedScale }] : undefined,
        },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
};
