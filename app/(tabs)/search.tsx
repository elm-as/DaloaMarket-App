import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { useInfiniteListings } from '@daloa/api';
import { colors, radii, spacing, ListingCard, Skeleton, EmptyState, useResponsive } from '@daloa/ui';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { Haptics } from '@daloa/utils';
import { SearchFilterModal, SearchFilterValues } from '../../src/components/search/SearchFilterModal';
import { SearchTopBar } from '../../src/components/search/SearchTopBar';

const EMPTY_FILTERS: SearchFilterValues = {
  category: null,
  district: null,
  condition: null,
  minPrice: '',
  maxPrice: '',
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, addToCart, updateQuantity } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { gridColumns } = useResponsive();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterValues>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  const {
    data: listingsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings({
    category: filters.category || undefined,
    district: filters.district || undefined,
    condition: filters.condition || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
  });

  const filteredListings = useMemo(() => {
    const rawList = listingsData?.pages.flatMap((p) => p.data) || [];
    let list = [...rawList];

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l: any) =>
          l.title.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q)) ||
          (l.district && l.district.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_asc') {
      list.sort((a: any, b: any) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a: any, b: any) => b.price - a.price);
    }

    return list;
  }, [listingsData, searchQuery, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.district) count++;
    if (filters.condition) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  }, [filters]);

  const toggleSort = () => {
    Haptics.selection();
    setSortBy((p) => (p === 'recent' ? 'price_asc' : p === 'price_asc' ? 'price_desc' : 'recent'));
  };

  const getCartQty = (listingId: string) => {
    const it = items.find((i) => i.listing.id === listingId);
    return it ? it.quantity : 0;
  };

  const handleUpdateCartQty = (listingId: string, qty: number) => {
    const item = items.find((i) => i.listing.id === listingId);
    if (item) updateQuantity(item.id, qty);
  };

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setSearchQuery('');
  };

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
        resultCount={filteredListings.length}
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
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
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
                onAddToCart={() => addToCart(item, null, 1)}
                onUpdateCartQty={(id, qty) => handleUpdateCartQty(id, qty)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            </View>
          )}
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
  },
});
