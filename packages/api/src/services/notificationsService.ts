import { supabase } from '../supabase';
import { NOTIFICATION_TEMPLATES } from '@daloa/config';

export const notificationsService = {
  /**
   * Enregistre le token push Expo de l'appareil
   */
  async registerPushToken(userId: string, expoPushToken: string, appType: 'market' | 'delivery'): Promise<void> {
    if (!expoPushToken || !userId) return;

    try {
      // Déduplication mono-appareil : un appareil physique ne doit être actif que
      // pour le compte actuellement connecté. Les anciens comptes sur cet appareil sont désactivés.
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('expo_push_token', expoPushToken)
        .neq('user_id', userId);

      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('expo_push_token', expoPushToken)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('push_subscriptions')
          .update({
            is_active: true,
            app_type: appType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('push_subscriptions').insert({
          user_id: userId,
          expo_push_token: expoPushToken,
          app_type: appType,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('[notificationsService] Erreur registerPushToken:', err);
    }
  },

  /**
   * Désactive les notifications push de l'appareil lors de la déconnexion
   */
  async deactivatePushToken(userId: string, expoPushToken?: string): Promise<void> {
    if (!userId) return;
    try {
      let query = supabase
        .from('push_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (expoPushToken) {
        query = query.eq('expo_push_token', expoPushToken);
      }
      await query;
    } catch (err) {
      console.warn('[notificationsService] Erreur deactivatePushToken:', err);
    }
  },

  /**
   * Envoie une notification push via l'Edge Function Supabase send-push
   */
  async sendPushNotification(params: {
    userIds?: string[];
    broadcast?: boolean;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    appType?: 'market' | 'delivery';
  }): Promise<{ success: boolean; sent?: number; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: params,
      });
      if (error) throw error;
      return { success: true, sent: data?.sent ?? 0 };
    } catch (err: any) {
      console.warn('[notificationsService] Erreur sendPushNotification:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Récupère un template de notification formaté
   */
  getTemplate(key: string) {
    return NOTIFICATION_TEMPLATES[key] || null;
  },
};

