import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@daloa/ui';

/**
 * Route d'alias deep link web : /suivi/[id] -> /order/[id]
 */
export default function DeepLinkOrderSuivi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/order/${id}` as any);
    } else {
      router.replace('/(tabs)/orders' as any);
    }
  }, [id, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT }}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}
