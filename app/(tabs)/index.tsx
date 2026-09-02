import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ShoppingCart, Package, Sparkles, Heart } from 'lucide-react-native';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  ListingCard,
  CategoryGrid,
  Skeleton,
  useResponsive,
} from '@daloa/ui';
import { useInfiniteListings } from '@daloa/api';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { HomeHero } from '../../src/components/home/HomeHero';
import { HomeDeliveryBanner } from '../../src/components/home/HomeDeliveryBanner';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itemCount, addToCart, updateQuantity, items } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { gridColumns } = useResponsive();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings({ category: selectedCategory || undefined });

  const listingsList = data?.pages.flatMap((p) => p.data) || [];

  const getCartQty = (listingId: string) => {
    const item = items.find((i) => i.listing.id === listingId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (listingId: string) => {
    const listing = listingsList.find((l) => l.id === listingId);
    if (!listing) return;
    addToCart(listing, null, 1);
  };

  const handleUpdateCartQty = (listingId: string, qty: number) => {
    const item = items.find((i) => i.listing.id === listingId);
    if (item) updateQuantity(item.id, qty);
  };

  const ListHeader = (
    <View>
      <HomeHero />
      <HomeDeliveryBanner />

      <View style={styles.sectionHeader}>
        <AppText variant="title">Catégories</AppText>
        {selectedCategory && (
          <AppPressable haptic="selection" rippleBorderless onPress={() => setSelectedCategory(null)}>
            <AppText variant="label" color={colors.primary.DEFAULT}>
              Réinitialiser
            </AppText>
          </AppPressable>
        )}
      </View>

      <CategoryGrid selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} showAllOption />

      <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        <View style={styles.sectionTitleRow}>
          <Sparkles size={16} color={colors.primary.DEFAULT} />
          <AppText variant="title">
            {selectedCategory ? 'Annonces filtrées' : 'Dernières annonces'}
          </AppText>
        </View>
        <View style={styles.countBadge}>
          <AppText variant="caption" color={colors.text.muted}>
            {listingsList.length}
          </AppText>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <AppPressable haptic="none" rippleBorderless onPress={() => router.push('/(tabs)' as any)} style={styles.logoBox}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </AppPressable>

        <AppPressable
          haptic="none"
          onPress={() => router.push('/(tabs)/search' as any)}
          style={styles.searchTrigger}
          accessibilityRole="search"
          accessibilityLabel="Rechercher un article ou un quartier"
        >
          <Search size={16} color={colors.text.subtle} />
          <AppText variant="body" color={colors.text.subtle} style={styles.searchFlex} numberOfLines={1}>
            Chercher un article, quartier...
          </AppText>
        </AppPressable>

        <View style={styles.actionsGroup}>
          <AppPressable rippleBorderless onPress={() => router.push('/favorites' as any)} style={styles.iconBtn} accessibilityLabel="Mes favoris">
            <Heart size={20} color={colors.grey[600]} />
          </AppPressable>
          <AppPressable rippleBorderless onPress={() => router.push('/(tabs)/orders' as any)} style={styles.iconBtn} accessibilityLabel="Mes commandes">
            <Package size={20} color={colors.grey[600]} />
          </AppPressable>
          <AppPressable
            rippleBorderless
            onPress={() => router.push('/(tabs)/cart' as any)}
            style={[styles.iconBtn, styles.cartBtn]}
            accessibilityLabel={`Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`}
          >
            <ShoppingCart size={20} color={colors.primary.DEFAULT} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <AppText variant="caption" color={colors.text.inverse} style={styles.cartBadgeText}>
                  {itemCount}
                </AppText>
              </View>
            )}
          </AppPressable>
        </View>
      </View>

      {/* Contenu */}
      {isLoading ? (
        <View>
          {ListHeader}
          <View style={styles.gridPad}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={styles.skeletonCell}>
                <Skeleton height={210} borderRadius={radii['2xl']} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlashList
          data={listingsList}
          numColumns={gridColumns}
          keyExtractor={(item: any) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary.DEFAULT} colors={[colors.primary.DEFAULT]} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText variant="bodyStrong" center>
                Aucune annonce disponible
              </AppText>
              <AppText variant="caption" center color={colors.text.subtle} style={styles.emptySub}>
                Soyez le premier à publier dans cette catégorie à Daloa !
              </AppText>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary.DEFAULT} />
              </View>
            ) : null
          }
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
                }}
                onPress={() => router.push(`/listing/${item.id}` as any)}
                onAddToCart={() => handleAddToCart(item.id)}
                onUpdateCartQty={(id, qty) => handleUpdateCartQty(id, qty)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing[2],
  },
  logoBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  searchTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    height: 40,
    gap: spacing[2],
    overflow: 'hidden',
  },
  searchFlex: {
    flex: 1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.subtle,
  },
  cartBtn: {
    backgroundColor: colors.primary[50],
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary.DEFAULT,
    minWidth: 16,
    height: 16,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 9.5,
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[8],
  },
  cell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  gridPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
  },
  skeletonCell: {
    width: '48%',
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    marginVertical: spacing[2],
  },
  sectionHeaderSpaced: {
    marginTop: spacing[3],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[4],
  },
  emptySub: {
    marginTop: 4,
  },
  footer: {
    paddingVertical: spacing[4],
  },
});
