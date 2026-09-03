import React from 'react';
import { View, TextInput, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X, SlidersHorizontal, ArrowUpDown, Tag, Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { MARKET_CATEGORIES } from '@daloa/config';
import { SearchFilterValues } from './SearchFilterModal';

const ICON_MAP: Record<string, React.FC<any>> = {
  Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen,
};

interface SearchTopBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFiltersCount: number;
  onOpenFilters: () => void;
  sortBy: 'recent' | 'price_asc' | 'price_desc';
  onToggleSort: () => void;
  resultCount: number;
  filters: SearchFilterValues;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilterValues>>;
}

const SORT_LABELS = {
  recent: 'Récents',
  price_asc: 'Prix ↑',
  price_desc: 'Prix ↓',
};

export const SearchTopBar: React.FC<SearchTopBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeFiltersCount,
  onOpenFilters,
  sortBy,
  onToggleSort,
  resultCount,
  filters,
  setFilters,
}) => {
  const accent = useAccent();
  const hasFilters = activeFiltersCount > 0;

  return (
    <View style={styles.wrapper}>
      {/* Hero gradient */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Titre */}
        <View style={styles.titleRow}>
          <AppText variant="overline" color={accent[100]}>DALOA MARKET</AppText>
          <AppText variant="h2" color={colors.text.inverse}>Rechercher</AppText>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchCard}>
          <Search size={15} color={accent[600]} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="iPhone, Robe, Canapé..."
            placeholderTextColor={colors.text.subtle}
            style={styles.textInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <AppPressable haptic="none" rippleBorderless onPress={() => setSearchQuery('')}>
              <X size={14} color={colors.text.subtle} />
            </AppPressable>
          )}
        </View>

        {/* Catégories rapides avec icônes */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <AppPressable
            haptic="selection"
            onPress={() => setFilters((p) => ({ ...p, category: null }))}
            style={[styles.catChip, !filters.category && { backgroundColor: colors.bg.surface }]}
          >
            <AppText variant="label" color={!filters.category ? accent[600] : colors.text.inverse}>
              Tout
            </AppText>
          </AppPressable>

          {MARKET_CATEGORIES.map((cat) => {
            const isActive = filters.category === cat.id;
            const IconComp = ICON_MAP[cat.iconName] ?? Tag;
            return (
              <AppPressable
                key={cat.id}
                haptic="selection"
                onPress={() => setFilters((p) => ({ ...p, category: isActive ? null : cat.id }))}
                style={[
                  styles.catChip,
                  isActive && { backgroundColor: colors.bg.surface },
                ]}
              >
                <IconComp
                  size={12}
                  color={isActive ? cat.color : 'rgba(255,255,255,0.85)'}
                  strokeWidth={2}
                />
                <AppText variant="label" color={isActive ? cat.color : colors.text.inverse}>
                  {cat.name.split(' & ')[0].split(' ')[0]}
                </AppText>
              </AppPressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Barre filtres + tri */}
      <View style={styles.toolBar}>
        <AppPressable
          haptic="light"
          onPress={onOpenFilters}
          style={[
            styles.toolBtn,
            hasFilters && { backgroundColor: accent[50], borderColor: accent[300] },
          ]}
        >
          <SlidersHorizontal size={13} color={hasFilters ? accent[600] : colors.grey[600]} />
          <AppText variant="caption" color={hasFilters ? accent[600] : colors.grey[600]}>
            Filtres{hasFilters ? ` (${activeFiltersCount})` : ''}
          </AppText>
        </AppPressable>

        <AppPressable haptic="selection" onPress={onToggleSort} style={styles.toolBtn}>
          <ArrowUpDown size={13} color={colors.grey[600]} />
          <AppText variant="caption" color={colors.grey[600]}>
            {SORT_LABELS[sortBy]}
          </AppText>
        </AppPressable>

        <AppText variant="caption" color={colors.text.subtle} style={styles.countText}>
          {resultCount} annonce{resultCount !== 1 ? 's' : ''}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg.surface,
  },
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: spacing[2],
  },
  titleRow: {
    gap: 1,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    height: 44,
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.DEFAULT,
    fontFamily: typography.families.medium,
    paddingVertical: 0,
  },
  catScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing[2],
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey[50],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.md,
    gap: 5,
    overflow: 'hidden',
  },
  countText: {
    marginLeft: 'auto',
  },
});
