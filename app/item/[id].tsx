import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@daloa/ui';

/**
 * Route d'alias deep link web : /item/[id] -> /listing/[id]
 */
export default function DeepLinkListingItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/listing/${id}` as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [id, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT }}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}
