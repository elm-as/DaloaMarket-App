import { router, type Router } from 'expo-router';

/**
 * Navigation arrière sécurisée qui évite le warning
 * "The action 'GO_BACK' was not handled by any navigator."
 * si l'historique de navigation est vide.
 */
export function safeBack(customRouter?: Router, fallbackRoute: string = '/(tabs)') {
  const r = customRouter || router;
  if (r.canGoBack()) {
    r.back();
  } else {
    r.replace(fallbackRoute as any);
  }
}
