import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, ArrowLeft, Info } from 'lucide-react-native';
import { useFavoriteListings, useGuestFavoriteListings } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  ListingCard,
  Skeleton,
  EmptyState,
  useResponsive,
  useAccent,
} from '@daloa/ui';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, isAuthenticated } = useAuth();
  const { items, addToCart, updateQuantity } = useCart();
  const { isFavorited, toggleFavorite, favoriteIds } = useFavorites();
  const { gridColumns } = useResponsive();

  const guestIds = React.useMemo(() => Array.from(favoriteIds), [favoriteIds]);

  const {
    data: userFavorites,
    isLoading: userLoading,
    refetch: userRefetch,
    isRefetching: userRefetching,
  } = useFavoriteListings(user?.id);

  const {
    data: guestFavorites,
    isLoading: guestLoading,
    refetch: guestRefetch,
    isRefetching: guestRefetching,
  } = useGuestFavoriteListings(guestIds);

  const list = user ? (userFavorites || []) : (guestFavorites || []);
  const isLoading = user ? userLoading : (guestLoading && guestIds.length > 0);
  const refetch = user ? userRefetch : guestRefetch;
  const isRefetching = user ? userRefetching : guestRefetching;

  const getCartQty = (listingId: string) => {
    const it = items.find((i) => i.listing.id === listingId);
    return it ? it.quantity : 0;
  };

  const handleUpdateCartQty = (listingId: string, qty: number) => {
    const item = items.find((i) => i.listing.id === listingId);
    if (item) updateQuantity(item.id, qty);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero banner */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroRow}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Vos coups de cœur
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Mes favoris
            </AppText>
          </View>
          {list.length > 0 ? (
            <View style={styles.countBadge}>
              <AppText variant="caption" color={colors.text.inverse}>
                {list.length} article{list.length > 1 ? 's' : ''}
              </AppText>
            </View>
          ) : (
            <View style={styles.iconCircle}>
              <Heart size={18} color={accent[200]} />
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Message de synchronisation pour les invités */}
      {!isAuthenticated && list.length > 0 && (
        <AppPressable
          onPress={() => router.push('/auth/login' as any)}
          style={styles.syncBanner}
        >
          <Info size={14} color={accent[700]} />
          <AppText variant="caption" color={accent[800]} style={styles.syncBannerText}>
            Connectez-vous pour synchroniser vos {list.length} favori{list.length > 1 ? 's' : ''} sur tous vos appareils
          </AppText>
        </AppPressable>
      )}

      {isLoading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCell}>
              <Skeleton height={210} borderRadius={radii['2xl']} />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          data={list}
          numColumns={gridColumns}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cell}>
              <ListingCard
                listing={{
                  id: item.id,
                  title: item.title,
                  price: item.price,
                  originalPrice: item.original_price,
                  photos: item.photos || [],
                  district: item.district,
                  createdAt: item.created_at,
                  stock: item.stock,
                  boostedUntil: item.boosted_until,
                  cartQty: getCartQty(item.id),
                  isFavorite: isFavorited(item.id),
                  variants: item.variants || [],
                  hasVariants: Boolean(item.variants && item.variants.length > 0),
                }}
                onPress={() => router.push(`/listing/${item.id}` as any)}
                onAddToCart={() => addToCart(item, null, 1)}
                onUpdateCartQty={(id, qty) => handleUpdateCartQty(id, qty)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Heart size={30} color={colors.primary.DEFAULT} />}
              title="Aucun favori pour l'instant"
              description="Touchez le cœur sur une annonce pour la retrouver ici."
              actionTitle="Explorer les annonces"
              onActionPress={() => router.push('/(tabs)' as any)}
              actionVariant="market"
            />
          }
        />
      )}
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
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  syncBanner: {
    marginHorizontal: spacing[3],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBannerText: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
  },
  cell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
  },
  skeletonCell: {
    width: '48%',
    marginBottom: spacing[3],
  },
});
