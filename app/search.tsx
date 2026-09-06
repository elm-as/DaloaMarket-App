import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@daloa/ui';

/**
 * Route d'alias web : /search -> /(tabs)/search
 */
export default function DeepLinkSearch() {
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/(tabs)/search', params } as any);
  }, [params, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT }}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}
