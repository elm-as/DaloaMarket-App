import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@daloa/ui';

/**
 * Route d'alias deep link web : /checkout/[id] -> /checkout?listingId=[id]
 */
export default function DeepLinkCheckoutListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id === 'cart') {
      router.replace({ pathname: '/checkout', params: { cart: 'true' } } as any);
    } else if (id) {
      router.replace({ pathname: '/checkout', params: { listingId: id } } as any);
    } else {
      router.replace('/checkout' as any);
    }
  }, [id, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT }}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}
