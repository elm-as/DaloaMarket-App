import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Shirt,
  Smartphone,
  Home,
  Car,
  Dumbbell,
  BookOpen,
  UtensilsCrossed,
  Sparkles,
  LayoutGrid,
} from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';

export interface CategoryItem {
  id: string;
  name: string;
  emoji?: string;
  icon?: any;
  color?: string;
  bg?: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'fashion', name: 'Mode', icon: Shirt, color: colors.categories.fashion.text, bg: colors.categories.fashion.bg },
  { id: 'electronics', name: 'High-Tech', icon: Smartphone, color: colors.categories.electronics.text, bg: colors.categories.electronics.bg },
  { id: 'home', name: 'Maison', icon: Home, color: colors.categories.home.text, bg: colors.categories.home.bg },
  { id: 'vehicles', name: 'Auto/Moto', icon: Car, color: colors.categories.vehicles.text, bg: colors.categories.vehicles.bg },
  { id: 'food', name: 'Alimentaire', icon: UtensilsCrossed, color: colors.categories.food.text, bg: colors.categories.food.bg },
  { id: 'sports', name: 'Sports', icon: Dumbbell, color: colors.categories.sports.text, bg: colors.categories.sports.bg },
  { id: 'books', name: 'Livres', icon: BookOpen, color: colors.categories.books.text, bg: colors.categories.books.bg },
];

export interface CategoryGridProps {
  categories?: CategoryItem[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  showAllOption?: boolean;
}

/**
 * Grille de catégories compacte à défilement horizontal fluide
 * Résout le problème du défilement vertical fastidieux en restant ergonomique sur mobile.
 */
export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory,
  onSelectCategory,
  showAllOption = true,
}) => {
  const handlePress = (id: string | null) => {
    if (selectedCategory === id) {
      onSelectCategory(null);
    } else {
      onSelectCategory(id);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {showAllOption && (
        <AppPressable
          haptic="selection"
          onPress={() => handlePress(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCategory === null }}
          accessibilityLabel="Toutes les catégories"
          style={[styles.itemCard, selectedCategory === null && styles.itemCardSelected]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: selectedCategory === null ? colors.primary.DEFAULT : colors.bg.subtle },
            ]}
          >
            <LayoutGrid
              size={17}
              color={selectedCategory === null ? colors.text.inverse : colors.grey[600]}
              strokeWidth={2.4}
            />
          </View>
          <AppText
            variant="caption"
            color={selectedCategory === null ? colors.primary[700] : colors.text.body}
            style={selectedCategory === null ? styles.labelSelected : styles.label}
          >
            Tous
          </AppText>
        </AppPressable>
      )}

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const IconComponent = cat.icon || Sparkles;

        return (
          <AppPressable
            key={cat.id}
            haptic="selection"
            onPress={() => handlePress(cat.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={cat.name}
            style={[styles.itemCard, isSelected && styles.itemCardSelected]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isSelected ? colors.primary.DEFAULT : cat.bg || colors.primary[50] },
              ]}
            >
              <IconComponent
                size={17}
                color={isSelected ? colors.text.inverse : cat.color || colors.primary.DEFAULT}
                strokeWidth={2.3}
              />
            </View>
            <AppText
              variant="caption"
              numberOfLines={1}
              color={isSelected ? colors.primary[700] : colors.text.body}
              style={isSelected ? styles.labelSelected : styles.label}
            >
              {cat.name}
            </AppText>
          </AppPressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    gap: spacing[2],
  },
  itemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    minWidth: 70,
    gap: 5,
    overflow: 'hidden',
  },
  itemCardSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary[50],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.families.bold,
  },
  labelSelected: {
    fontFamily: typography.families.black,
  },
});
