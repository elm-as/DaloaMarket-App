import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useConversations } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Avatar,
  EmptyState,
  Skeleton,
} from '@daloa/ui';
import { MessageSquare, ChevronRight } from 'lucide-react-native';
import { formatRelativeTime, Haptics } from '@daloa/utils';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations(user?.id);

  const list = conversations || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Messagerie Directe" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.market.primary}
          />
        }
      >
        {isLoading ? (
          <View style={{ gap: spacing[3] }}>
            <Skeleton height={72} borderRadius={radii.xl} />
            <Skeleton height={72} borderRadius={radii.xl} />
            <Skeleton height={72} borderRadius={radii.xl} />
          </View>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={32} color={colors.market.primary} />}
            title="Aucune discussion"
            description="Contactez un vendeur depuis une annonce pour poser des questions ou négocier un prix."
            actionTitle="Explorer les articles"
            onActionPress={() => router.push('/(tabs)/index')}
          />
        ) : (
          list.map((conv) => (
            <TouchableOpacity
              key={conv.partnerId}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.lightImpact();
                router.push({
                  pathname: `/chat/${conv.partnerId}`,
                  params: {
                    partnerName: conv.partnerName,
                    partnerAvatar: conv.partnerAvatar || '',
                    listingId: conv.listingId || '',
                    listingTitle: conv.listingTitle || '',
                    listingPhoto: conv.listingPhoto || '',
                    listingPrice: conv.listingPrice?.toString() || '',
                  },
                });
              }}
              style={styles.convCard}
            >
              <Avatar uri={conv.partnerAvatar} name={conv.partnerName} size={50} />

              <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                  <Text style={styles.partnerName} numberOfLines={1}>
                    {conv.partnerName}
                  </Text>
                  <Text style={styles.timeText}>{formatRelativeTime(conv.lastMessageTime)}</Text>
                </View>

                {conv.listingTitle && (
                  <Text style={styles.listingTag} numberOfLines={1}>
                    📦 {conv.listingTitle}
                  </Text>
                )}

                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </View>

              {conv.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conv.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[2],
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: spacing[3],
  },
  convInfo: {
    flex: 1,
    gap: 2,
  },
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerName: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  timeText: {
    color: colors.dark.textDim,
    fontSize: 10,
  },
  listingTag: {
    color: colors.market.primary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  lastMessage: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  unreadBadge: {
    backgroundColor: colors.market.primary,
    borderRadius: radii.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
});
