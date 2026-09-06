import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@daloa/ui';

/**
 * Route d'alias web : /checkout/cart -> /checkout?cart=true
 */
export default function DeepLinkCheckoutCart() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/checkout', params: { cart: 'true' } } as any);
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT }}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}
