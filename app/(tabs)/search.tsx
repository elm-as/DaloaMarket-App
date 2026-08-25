import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useListings } from '@daloa/api';
import { MARKET_CATEGORIES } from '@daloa/config';
import { ListingFilters } from '@daloa/types';
import { colors, radii, spacing, typography, SearchInput, Skeleton, EmptyState } from '@daloa/ui';
import { ListingCard } from '../../src/components/ListingCard';
import { FilterModal } from '../../src/components/FilterModal';
import { CategoryPill } from '../../src/components/CategoryPill';
import { ArrowUpDown } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function SearchScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState<ListingFilters>({
    sortBy: 'created_at_desc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const { data, isLoading } = useListings({
    ...filters,
    searchQuery: searchQuery.length > 0 ? searchQuery : undefined,
  });

  const listings = data?.data || [];

  const handleCategoryToggle = (catId: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === catId ? undefined : catId,
    }));
  };

  const handleSortToggle = () => {
    Haptics.selection();
    setFilters((prev) => {
      if (prev.sortBy === 'created_at_desc') return { ...prev, sortBy: 'price_asc' };
      if (prev.sortBy === 'price_asc') return { ...prev, sortBy: 'price_desc' };
      if (prev.sortBy === 'price_desc') return { ...prev, sortBy: 'popularity' };
      return { ...prev, sortBy: 'created_at_desc' };
    });
  };

  const getSortLabel = () => {
    switch (filters.sortBy) {
      case 'price_asc':
        return 'Prix croissant';
      case 'price_desc':
        return 'Prix décroissant';
      case 'popularity':
        return 'Popularité';
      default:
        return 'Nouveautés';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher des articles à Daloa..."
          onFilterPress={() => setIsFilterModalOpen(true)}
          hasActiveFilters={Boolean(filters.district || filters.condition || filters.acceptsDeliveryOnly)}
        />
      </View>

      {/* Catégories scroller */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[4] }}>
          <CategoryPill
            id="all"
            name="Tous"
            isSelected={!filters.category}
            onPress={() => setFilters((prev) => ({ ...prev, category: undefined }))}
          />
          {MARKET_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              name={cat.name}
              isSelected={filters.category === cat.id}
              onPress={() => handleCategoryToggle(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Meta Bar: Results count & Sort */}
      <View style={styles.metaBar}>
        <Text style={styles.resultsCount}>{listings.length} résultat(s)</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSortToggle}
          style={styles.sortButton}
        >
          <ArrowUpDown size={14} color={colors.dark.textMuted} />
          <Text style={styles.sortText}>{getSortLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Grille de Produits */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingGrid}>
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
          </View>
        ) : listings.length === 0 ? (
          <EmptyState
            title="Aucun article trouvé"
            description="Essayez d’ajuster vos mots-clés ou réinitialisez les filtres pour voir plus d’articles."
            actionTitle="Réinitialiser les filtres"
            onActionPress={() => {
              setFilters({});
              setSearchQuery('');
            }}
          />
        ) : (
          <View style={styles.productsGrid}>
            {listings.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modale de Filtres */}
      <FilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={() => setFilters({})}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  categoriesContainer: {
    paddingVertical: spacing[2],
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  resultsCount: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dark.surfaceRaised,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  sortText: {
    color: colors.dark.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  scrollContent: {
    paddingTop: spacing[3],
    paddingBottom: 40,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
    gap: spacing[3],
  },
});
