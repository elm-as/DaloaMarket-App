import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { captureReferralFromUrl } from '@daloa/api';

/**
 * Met de côté le code ambassadeur porté par le lien qui amène l'utilisateur.
 *
 * Monté une fois à la racine, avant toute navigation : un ambassadeur partage
 * souvent le lien d'une annonce (`/listing/xyz?ref=CODE`), pas celui de
 * l'inscription, et le code doit survivre au trajet jusqu'à la création du
 * compte — y compris quand Google fait sortir de l'application.
 *
 * Deux cas à couvrir, et ils sont distincts : l'application démarrée *par* le
 * lien (`getInitialURL`) et l'application déjà ouverte qui reçoit le lien
 * (`addEventListener`). Ne traiter que le premier perdrait tous les partages
 * reçus en cours d'usage.
 */
export function useReferralCapture(): void {
  useEffect(() => {
    let cancelled = false;

    Linking.getInitialURL()
      .then((url) => {
        if (!cancelled) void captureReferralFromUrl(url);
      })
      .catch(() => undefined);

    const sub = Linking.addEventListener('url', ({ url }) => {
      void captureReferralFromUrl(url);
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
}
