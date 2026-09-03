import { supabase } from '../supabase';
import { NOTIFICATION_TEMPLATES } from '@daloa/config';

export const notificationsService = {
  /**
   * Enregistre le token push Expo de l'appareil
   */
  async registerPushToken(userId: string, expoPushToken: string, appType: 'market' | 'delivery'): Promise<void> {
    if (!expoPushToken || !userId) return;

    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      expo_push_token: expoPushToken,
      app_type: appType,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  },

  /**
   * Récupère un template de notification formaté
   */
  getTemplate(key: string) {
    return NOTIFICATION_TEMPLATES[key] || null;
  },
};
