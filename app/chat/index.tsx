import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useConversations } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  Avatar,
  EmptyState,
  Skeleton,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import { MessageSquare, ArrowLeft, Package } from 'lucide-react-native';
import { formatRelativeTime } from '@daloa/utils';

export default function ChatListScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations(user?.id);

  const list = conversations || [];
  const totalUnread = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero gradient */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroRow}>
          {!isTab && (
            <AppPressable
              onPress={() => router.back()}
              rippleBorderless
              style={styles.backBtn}
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={18} color={colors.text.inverse} />
            </AppPressable>
          )}
          <View style={[styles.heroTitles, isTab && { marginLeft: 0 }]}>
            <AppText variant="overline" color={accent[100]}>
              Vos conversations
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Messagerie
            </AppText>
          </View>
          {totalUnread > 0 ? (
            <View style={styles.unreadHeroBadge}>
              <AppText variant="caption" color={colors.text.inverse}>
                {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
              </AppText>
            </View>
          ) : (
            <View style={styles.iconCircle}>
              <MessageSquare size={18} color={accent[200]} />
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={accent.DEFAULT}
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
            icon={<MessageSquare size={32} color={accent.DEFAULT} />}
            title="Aucune discussion"
            description="Contactez un vendeur depuis une annonce pour poser des questions ou négocier un prix."
            actionTitle="Explorer les articles"
            onActionPress={() => router.push('/(tabs)' as any)}
            actionVariant="market"
          />
        ) : (
          list.map((conv) => (
            <AppPressable
              key={conv.partnerId}
              onPress={() => {
                router.push({
                  pathname: `/chat/${conv.partnerId}` as any,
                  params: {
                    partnerName: conv.partnerName,
                    partnerAvatar: conv.partnerAvatar || '',
                    listingId: conv.listingId || '',
                    listingTitle: conv.listingTitle || '',
                    listingPhoto: conv.listingPhoto || '',
                    listingPrice: conv.listingPrice?.toString() || '',
                  },
                } as any);
              }}
              style={styles.convCard}
              accessibilityLabel={`Discussion avec ${conv.partnerName}`}
            >
              <Avatar uri={conv.partnerAvatar} name={conv.partnerName} size={50} />

              <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                  <AppText variant="bodyStrong" numberOfLines={1} style={styles.partnerName}>
                    {conv.partnerName}
                  </AppText>
                  <AppText variant="caption" color={colors.text.subtle}>
                    {formatRelativeTime(conv.lastMessageTime)}
                  </AppText>
                </View>

                {conv.listingTitle && (
                  <View style={styles.listingTagRow}>
                    <Package size={11} color={accent[700]} />
                    <AppText variant="caption" color={accent[700]} numberOfLines={1}>
                      {conv.listingTitle}
                    </AppText>
                  </View>
                )}

                <AppText variant="caption" color={colors.text.muted} numberOfLines={1}>
                  {conv.lastMessage}
                </AppText>
              </View>

              {conv.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: accent.DEFAULT }]}>
                  <AppText variant="overline" color={colors.text.inverse}>
                    {conv.unreadCount}
                  </AppText>
                </View>
              )}
            </AppPressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  heroBanner: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  unreadHeroBadge: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[2],
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: spacing[3],
    overflow: 'hidden',
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
    flex: 1,
  },
  unreadBadge: {
    borderRadius: radii.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  listingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
