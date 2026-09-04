import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, RefreshControl, Image, ActivityIndicator, ScrollView } from 'react-native';
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
  CurrencyText,
} from '@daloa/ui';
import { Image as ExpoImage } from 'expo-image';
import { useInfiniteListings, useFavoriteListings } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { HomeHero } from '../../src/components/home/HomeHero';
import { HomeDeliveryBanner } from '../../src/components/home/HomeDeliveryBanner';
import { HomeRecommendations } from '../../src/components/home/HomeRecommendations';
import { VariantPickerSheet } from '../../src/components/listing-detail/VariantPickerSheet';
import { OwnerActionSheet } from '../../src/components/listing-detail/OwnerActionSheet';
import { getRecommendationsForUser } from '../../src/lib/recommendationEngine';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount, addToCart, updateQuantity, setListingVariants, items } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeVariantListing, setActiveVariantListing] = useState<any | null>(null);
  const [managingListing, setManagingListing] = useState<any | null>(null);
  const { gridColumns } = useResponsive();

  const activeListingInitialQuantities = useMemo(() => {
    if (!activeVariantListing) return undefined;
    const map: Record<string, number> = {};
    items
      .filter((i) => i.listing.id === activeVariantListing.id && i.variant?.id)
      .forEach((i) => {
        if (i.variant?.id) map[i.variant.id] = i.quantity;
      });
    return map;
  }, [items, activeVariantListing]);

  const filters = useMemo(
    () => (selectedCategory ? { category: selectedCategory } : {}),
    [selectedCategory]
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings(filters);

  const { data: favoriteListings } = useFavoriteListings(user?.id);

  const listingsList = data?.pages.flatMap((p) => p.data) || [];

  // Section "Pour vous" — Recommandations intelligentes (Personnalisées ou Découverte Cold-Start)
  const recommendations = useMemo(() => {
    if (!listingsList.length || selectedCategory) return [];
    const favs = favoriteListings || [];
    return getRecommendationsForUser(listingsList, favs as any, { limit: 8 });
  }, [listingsList, favoriteListings, selectedCategory]);

  const getCartQty = useCallback(
    (listingId: string) => {
      return items
        .filter((i) => i.listing.id === listingId)
        .reduce((sum, i) => sum + i.quantity, 0);
    },
    [items]
  );

  const handleAddToCart = useCallback(
    (listingId: string) => {
      const listing = listingsList.find((l) => l.id === listingId);
      if (!listing) return;
      if (listing.variants && listing.variants.length > 0) {
        setActiveVariantListing(listing);
        return;
      }
      addToCart(listing, null, 1);
    },
    [listingsList, addToCart]
  );

  const handleUpdateCartQty = useCallback(
    (listingId: string, qty: number) => {
      const item = items.find((i) => i.listing.id === listingId);
      if (item) updateQuantity(item.id, qty);
    },
    [items, updateQuantity]
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isOwner = Boolean(user?.id && item.user_id === user.id);
      return (
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
              isOwner,
            }}
            onPress={() => router.push(`/listing/${item.id}` as any)}
            onAddToCart={() => handleAddToCart(item.id)}
            onUpdateCartQty={handleUpdateCartQty}
            onToggleFavorite={() => toggleFavorite(item.id)}
            isOwner={isOwner}
            onManage={() => setManagingListing(item)}
          />
        </View>
      );
    },
    [user?.id, getCartQty, isFavorited, handleAddToCart, handleUpdateCartQty, toggleFavorite, router]
  );

  const isFetchingNextRef = useRef(false);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isFetchingNextRef.current) return;
    isFetchingNextRef.current = true;
    fetchNextPage()
      .catch((err) => {
        console.warn('Erreur chargement page suivante:', err);
      })
      .finally(() => {
        setTimeout(() => {
          isFetchingNextRef.current = false;
        }, 500);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListHeader = (
    <View>
      <HomeHero />
      <HomeDeliveryBanner />

      {/* Section Recommandations Pour vous (Cold-Start & Personnalisé) */}
      <HomeRecommendations
        recommendations={recommendations}
        onPressItem={(item) => router.push(`/listing/${item.id}` as any)}
        onAddToCart={(item) => handleAddToCart(item.id)}
        onToggleFavorite={(id) => toggleFavorite(id)}
        isFavorited={(id) => isFavorited(id)}
        getCartQty={getCartQty}
      />

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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
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
                <AppText variant="caption" color={colors.text.subtle} style={styles.footerText}>
                  Chargement de la suite...
                </AppText>
              </View>
            ) : isError ? (
              <View style={styles.footer}>
                <AppPressable onPress={handleEndReached} style={styles.retryBtn}>
                  <AppText variant="caption" color={colors.primary.DEFAULT}>
                    Échec de chargement · Toucher pour réessayer
                  </AppText>
                </AppPressable>
              </View>
            ) : null
          }
          renderItem={renderItem}
        />
      )}

      {/* Sheet de sélection multi-options / multi-quantités */}
      {activeVariantListing && (
        <VariantPickerSheet
          visible={Boolean(activeVariantListing)}
          onClose={() => setActiveVariantListing(null)}
          variants={activeVariantListing.variants || []}
          listingTitle={activeVariantListing.title}
          listingPhoto={activeVariantListing.photos?.[0]}
          basePrice={activeVariantListing.price}
          initialQuantities={activeListingInitialQuantities}
          onConfirmQuantities={(selections) => {
            setListingVariants(activeVariantListing, selections);
            setActiveVariantListing(null);
          }}
        />
      )}

      <OwnerActionSheet
        visible={Boolean(managingListing)}
        onClose={() => setManagingListing(null)}
        listing={managingListing}
        onListingUpdated={() => refetch()}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: spacing[1],
  },
  retryBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
});
