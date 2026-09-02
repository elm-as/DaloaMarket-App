import React, { useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { ThemeProvider, colors } from '@daloa/ui';

/** Enregistre les push et gère les taps ; monté dans l'arbre Auth. */
function PushRegistrar() {
  usePushNotifications();
  return null;
}
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 3,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider app="market">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FavoritesProvider>
            <CartProvider>
            <PushRegistrar />
            <StatusBar style="dark" backgroundColor={colors.bg.surface} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg.surface },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="listing/create" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="seller/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
              <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="chat/index" options={{ headerShown: false }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="pro/become-pro" options={{ headerShown: false }} />
              <Stack.Screen name="pro/packs" options={{ headerShown: false }} />
              <Stack.Screen name="pro/revenue" options={{ headerShown: false }} />
              <Stack.Screen name="pro/stats" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="auth/register" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="auth/reset-password" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="settings/index" options={{ headerShown: false }} />
              <Stack.Screen name="settings/shop" options={{ headerShown: false }} />
              <Stack.Screen name="settings/payout" options={{ headerShown: false }} />
              <Stack.Screen name="settings/delete-account" options={{ headerShown: false }} />
              <Stack.Screen name="affiliations/index" options={{ headerShown: false }} />
              <Stack.Screen name="favorites/index" options={{ headerShown: false }} />
              <Stack.Screen name="banned" options={{ headerShown: false }} />
              <Stack.Screen name="legal/how-it-works" options={{ headerShown: false }} />
              <Stack.Screen name="legal/about" options={{ headerShown: false }} />
              <Stack.Screen name="legal/faq" options={{ headerShown: false }} />
              <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
              <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
              <Stack.Screen name="legal/help" options={{ headerShown: false }} />
            </Stack>
            </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
