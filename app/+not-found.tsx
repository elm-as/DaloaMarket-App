import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { colors, radii, spacing, Button, AppText, useAccent } from '@daloa/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Introuvable', headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
            <Compass size={40} color={accent.DEFAULT} />
          </View>

          <AppText variant="display" color={accent.DEFAULT} style={styles.code}>
            404
          </AppText>
          <AppText variant="h2" center>
            Page introuvable
          </AppText>
          <AppText variant="body" color={colors.text.muted} center style={styles.sub}>
            La page que vous cherchez n'existe pas ou a été déplacée.
          </AppText>

          <Button
            title="Retour à l'accueil"
            variant="market"
            size="lg"
            onPress={() => router.replace('/(tabs)' as any)}
            style={styles.btn}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[2],
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  code: {
    fontVariant: ['tabular-nums'],
  },
  sub: {
    maxWidth: 280,
    marginTop: 4,
  },
  btn: {
    marginTop: spacing[4],
    minWidth: 220,
  },
});
