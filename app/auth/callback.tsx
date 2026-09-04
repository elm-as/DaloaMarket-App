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
  const params = useLocalSearchParams<{ code?: string; error_description?: string; returnTo?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Extraction erreurs éventuelles en query
        const webSearch = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const errDesc = params.error_description || webSearch?.get('error_description') || webSearch?.get('error');
        if (errDesc) throw new Error(String(errDesc));

        const code = params.code || webSearch?.get('code');

        // 1. Flux PKCE : code d'autorisation en paramètre de requête.
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(String(code));
          if (exErr) throw exErr;
        } else {
          // 2. Flux implicite : access_token / refresh_token dans le fragment (#...).
          let frag: string | null = null;
          if (typeof window !== 'undefined' && window.location.hash) {
            frag = window.location.hash.startsWith('#')
              ? window.location.hash.substring(1)
              : window.location.hash;
          } else {
            const initialUrl = await Linking.getInitialURL();
            frag = initialUrl?.includes('#') ? initialUrl.split('#')[1] : null;
          }

          const tokens = parseFragment(frag);
          if (tokens.error_description || tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
          }

          if (tokens.access_token && tokens.refresh_token) {
            const { error: sessErr } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            });
            if (sessErr) throw sessErr;
          } else {
            // Vérification si la session a déjà été détectée
            const { data: currentSession } = await supabase.auth.getSession();
            if (!currentSession?.session) {
              throw new Error('Session introuvable dans le retour de connexion.');
            }
          }
        }

        if (!cancelled) {
          const target = params.returnTo || '/(tabs)/profile';
          router.replace(target as any);
        }
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
