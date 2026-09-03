import * as ExpoHaptics from 'expo-haptics';

/**
 * Helper sécurisé pour les retours haptiques
 * Utilise Expo Haptics s'il est disponible dans l'environnement runtime sans planter
 */
export const Haptics = {
  selection: async () => {
    try {
      await ExpoHaptics.selectionAsync();
    } catch {}
  },
  success: async () => {
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    } catch {}
  },
  warning: async () => {
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
    } catch {}
  },
  error: async () => {
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
    } catch {}
  },
  lightImpact: async () => {
    try {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } catch {}
  },
  mediumImpact: async () => {
    try {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },
  heavyImpact: async () => {
    try {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },
};
