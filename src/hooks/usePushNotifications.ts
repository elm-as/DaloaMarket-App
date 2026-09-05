import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { notificationsService } from '@daloa/api';
import { useAuth } from '../context/AuthContext';

// Affiche les notifications même app au premier plan (iOS / Android uniquement).
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any),
  });
}

/**
 * Enregistre l'appareil pour les notifications push (Expo) dès qu'un utilisateur
 * est connecté, et gère le tap sur une notification (ouverture de la commande liée).
 * Monté une fois via <PushRegistrar/> dans le layout racine.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const responseSub = useRef<Notifications.Subscription | null>(null);

  // 1. Enregistrement du token à la connexion (désactivé sur web pour éviter le warning VAPID).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!user?.id) return;

    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let granted = existing.granted || existing.status === 'granted';

        if (!granted) {
          const req = await Notifications.requestPermissionsAsync();
          granted = req.granted || req.status === 'granted';
        }
        if (!granted) return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Général',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const projectId =
          (Constants.expoConfig?.extra as any)?.eas?.projectId ||
          (Constants as any)?.easConfig?.projectId ||
          '343876f7-071a-474b-bc8c-ac2df326911c';

        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );

        if (tokenData?.data) {
          await notificationsService.registerPushToken(user.id, tokenData.data, 'market');
          console.log('[usePushNotifications] Token Expo enregistré:', tokenData.data);
        }
      } catch (err) {
        console.warn('[usePushNotifications] Échec obtention token push:', err);
      }
    })();
  }, [user?.id]);

  // 2. Tap sur une notification → navigation contextuelle (iOS / Android uniquement).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    responseSub.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.orderId) {
        router.push(`/order/${data.orderId}` as any);
      } else if (data?.chatPartnerId) {
        router.push(`/chat/${data.chatPartnerId}` as any);
      }
    });

    return () => {
      responseSub.current?.remove();
    };
  }, [router]);
}
