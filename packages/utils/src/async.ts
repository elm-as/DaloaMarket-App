/**
 * Garde-temps pour les promesses qui peuvent ne jamais se résoudre.
 *
 * Cas d'usage d'origine : `Location.getCurrentPositionAsync()` d'Expo ne rend
 * jamais la main sur Android quand l'appareil n'obtient pas de fix GPS (intérieur,
 * ciel couvert, puce occupée). Les écrans passaient alors `isLocating` à `true`
 * et restaient bloqués sur « Localisation… » indéfiniment.
 *
 * La promesse d'origine n'est pas annulable : elle continue en arrière-plan et
 * son résultat est simplement ignoré. Ce qui compte est que l'interface reprenne
 * la main et qu'un repli soit proposé.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => Promise<T | null> | T | null
): Promise<T | null> {
  const TIMED_OUT = Symbol('timeout');

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });

  try {
    const result = await Promise.race([promise.catch(() => null), timeout]);
    if (result !== TIMED_OUT) {
      return result as T | null;
    }
    return onTimeout ? await onTimeout() : null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Délai au-delà duquel une demande de position est considérée perdue. */
export const GPS_TIMEOUT_MS = 8000;
