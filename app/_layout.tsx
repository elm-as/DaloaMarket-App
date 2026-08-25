import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { colors } from '@daloa/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 3,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="light" backgroundColor={colors.dark.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.dark.background },
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
              <Stack.Screen name="affiliations/index" options={{ headerShown: false }} />
              <Stack.Screen name="banned" options={{ headerShown: false }} />
              <Stack.Screen name="legal/how-it-works" options={{ headerShown: false }} />
              <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
              <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
              <Stack.Screen name="legal/help" options={{ headerShown: false }} />
            </Stack>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
