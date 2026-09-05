import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { useInfiniteListings, analyticsService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, ListingCard, Skeleton, EmptyState, useResponsive, AppText, AppPressable } from '@daloa/ui';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { Haptics } from '@daloa/utils';
import { SearchFilterModal, SearchFilterValues } from '../../src/components/search/SearchFilterModal';
import { SearchTopBar } from '../../src/components/search/SearchTopBar';
import { VariantPickerSheet } from '../../src/components/listing-detail/VariantPickerSheet';
import { OwnerActionSheet } from '../../src/components/listing-detail/OwnerActionSheet';
import { filterAndRankListings } from '../../src/components/search/search-relevance';

const EMPTY_FILTERS: SearchFilterValues = {
  category: null, district: null, condition: null, minPrice: '', maxPrice: '',
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, addToCart, updateQuantity, setListingVariants } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { gridColumns } = useResponsive();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeVariantListing, setActiveVariantListing] = useState<any | null>(null);
  const [managingListing, setManagingListing] = useState<any | null>(null);

  const activeListingInitialQuantities = useMemo(() => {
    if (!activeVariantListing) return undefined;
    const map: Record<string, number> = {};
    items.forEach((i) => {
      if (i.listing.id === activeVariantListing.id && i.variant?.id) map[i.variant.id] = i.quantity;
    });
    return map;
  }, [items, activeVariantListing]);

  // Log de recherche débouncé (évite un event par frappe) — graine pour le ML
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      analyticsService.logEvent({
        eventName: 'search',
        userId: user?.id ?? null,
        props: { query: q },
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [searchQuery, user?.id]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterValues>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchFilters = useMemo(() => ({
    category: filters.category || undefined,
    district: filters.district || undefined,
    condition: filters.condition || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    searchQuery: debouncedQuery.trim() || undefined,
    sortBy: sortBy === 'recent' ? undefined : sortBy,
  }), [filters.category, filters.district, filters.condition, filters.minPrice, filters.maxPrice, debouncedQuery, sortBy]);

  const {
    data: listingsData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteListings(searchFilters);

  const filteredListings = useMemo(() => {
    const rawList = listingsData?.pages.flatMap((p) => p.data) || [];
    return filterAndRankListings(rawList, debouncedQuery, sortBy);
  }, [listingsData, debouncedQuery, sortBy]);

  const resultCount = useMemo(() => {
    const serverCount = listingsData?.pages?.[0]?.totalCount;
    if (typeof serverCount === 'number') {
      if (!hasNextPage && filteredListings.length <= serverCount) {
        return filteredListings.length;
      }
      return serverCount;
    }
    return filteredListings.length;
  }, [listingsData?.pages, hasNextPage, filteredListings.length]);

  const activeFiltersCount = useMemo(() => {
    return [filters.category, filters.district, filters.condition, filters.minPrice || filters.maxPrice].filter(Boolean).length;
  }, [filters]);

  const toggleSort = useCallback(() => {
    Haptics.selection();
    setSortBy((p) => (p === 'recent' ? 'price_asc' : p === 'price_asc' ? 'price_desc' : 'recent'));
  }, []);

  const getCartQty = useCallback(
    (listingId: string) => {
      return items
        .filter((i) => i.listing.id === listingId)
        .reduce((sum, i) => sum + i.quantity, 0);
    },
    [items]
  );

  const handleAddToCart = useCallback(
    (listing: any) => {
      if (listing.variants && listing.variants.length > 0) {
        setActiveVariantListing(listing);
        return;
      }
      addToCart(listing, null, 1);
    },
    [addToCart]
  );

  const handleUpdateCartQty = useCallback(
    (listingId: string, qty: number) => {
      const item = items.find((i) => i.listing.id === listingId);
      if (item) updateQuantity(item.id, qty);
    },
    [items, updateQuantity]
  );

  const resetAll = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearchQuery('');
  }, []);

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
            onAddToCart={() => handleAddToCart(item)}
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
        console.warn('Erreur chargement page suivante (recherche):', err);
      })
      .finally(() => {
        setTimeout(() => { isFetchingNextRef.current = false; }, 500);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header & Filtres Rapides */}
      <SearchTopBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => {
          Haptics.lightImpact();
          setIsFilterModalOpen(true);
        }}
        sortBy={sortBy}
        onToggleSort={toggleSort}
        resultCount={resultCount}
        isLoading={isLoading}
        filters={filters}
        setFilters={setFilters}
      />

      {/* 2. Résultats */}
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
          data={filteredListings}
          numColumns={gridColumns}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
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
          ListEmptyComponent={
            <EmptyState
              icon={<SearchX size={30} color={colors.primary.DEFAULT} />}
              title="Aucun résultat trouvé"
              description="Essayez d'autres mots-clés ou réinitialisez les filtres."
              actionTitle={activeFiltersCount > 0 || searchQuery ? 'Réinitialiser' : undefined}
              onActionPress={activeFiltersCount > 0 || searchQuery ? resetAll : undefined}
              actionVariant="market"
            />
          }
        />
      )}

      {/* Modal des filtres */}
      <SearchFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

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
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
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
    paddingTop: spacing[2],
  },
  skeletonCell: {
    width: '48%',
    marginBottom: spacing[3],
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
