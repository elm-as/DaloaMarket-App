/**
 * Helper sécurisé pour les retours haptiques
 * Utilise Expo Haptics s'il est disponible dans l'environnement runtime sans planter
 */
export const Haptics = {
  selection: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.selectionAsync();
    } catch {
      // Ignorer si non supporté ou web
    }
  },
  success: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    } catch {}
  },
  warning: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
    } catch {}
  },
  error: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
    } catch {}
  },
  lightImpact: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } catch {}
  },
  mediumImpact: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },
  heavyImpact: async () => {
    try {
      const ExpoHaptics = await import('expo-haptics');
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },
};
