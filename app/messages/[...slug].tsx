import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@daloa/ui';

/**
 * Route d'alias deep link web : /messages/[...slug] -> /chat/[id] ou /chat
 * Gère les formats web :
 *  - /messages/:listingId/:userId
 *  - /messages/:userId
 *  - /messages
 */
export default function DeepLinkMessagesCatchAll() {
  const { slug } = useLocalSearchParams<{ slug?: string[] }>();
  const router = useRouter();

  useEffect(() => {
    const segments: string[] = slug ?? [];

    if (segments.length >= 2) {
      const listingId = segments[0];
      const partnerId = segments[1];
      router.replace({
        pathname: '/chat/[id]' as any,
        params: { id: partnerId, listingId },
      } as any);
    } else if (segments.length === 1) {
      router.replace(`/chat/${segments[0]}` as any);
    } else {
      router.replace('/chat' as any);
    }
  }, [slug, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT }}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}
