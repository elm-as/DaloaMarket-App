import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@daloa/api';
import { colors, spacing, AppText, useAccent } from '@daloa/ui';

/** Extrait les paires clé=valeur d'un fragment/query d'URL. */
function parseFragment(fragment?: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fragment) return out;
  for (const pair of fragment.split('&')) {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

/**
 * Finalise l'authentification OAuth/lien email : Supabase redirige vers
 * daloamarket://auth/callback, expo-router route ici, et on établit la session
 * (code PKCE en query, ou access/refresh tokens dans le fragment).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const accent = useAccent();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (params.error_description) throw new Error(String(params.error_description));

        // Flux PKCE : code d'autorisation en paramètre de requête.
        if (params.code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(String(params.code));
          if (exErr) throw exErr;
        } else {
          // Flux implicite : access_token / refresh_token dans le fragment (#...).
          const initialUrl = await Linking.getInitialURL();
          const frag = initialUrl?.includes('#') ? initialUrl.split('#')[1] : null;
          const tokens = parseFragment(frag);
          if (tokens.access_token && tokens.refresh_token) {
            const { error: sessErr } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            });
            if (sessErr) throw sessErr;
          } else {
            throw new Error('Session introuvable dans le retour de connexion.');
          }
        }

        if (!cancelled) router.replace('/(tabs)' as any);
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || 'Échec de la connexion. Veuillez réessayer.');
        setTimeout(() => router.replace('/auth/login' as any), 2500);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.code]);

  return (
    <View style={styles.container}>
      {error ? (
        <AppText variant="body" color={colors.status.errorDark} center style={styles.text}>
          {error}
        </AppText>
      ) : (
        <>
          <ActivityIndicator size="large" color={accent.DEFAULT} />
          <AppText variant="body" color={colors.text.muted} style={styles.text}>
            Connexion en cours…
          </AppText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.DEFAULT,
    gap: spacing[3],
    padding: spacing[6],
  },
  text: {
    marginTop: spacing[2],
  },
});
