import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { AppPressable } from './AppPressable';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Rechercher sur DaloaMarket...',
  onFilterPress,
  onClear,
  hasActiveFilters = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputBox}>
        <Search size={18} color={colors.grey[400]} style={styles.searchIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.grey[400]}
          style={styles.input}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <AppPressable
            haptic="none"
            rippleBorderless
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            style={styles.clearBtn}
          >
            <X size={16} color={colors.text.muted} />
          </AppPressable>
        )}
      </View>
      {onFilterPress && (
        <AppPressable
          haptic="selection"
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Filtres"
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
        >
          <SlidersHorizontal
            size={18}
            color={hasActiveFilters ? colors.text.inverse : colors.text.body}
          />
        </AppPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    height: 44,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    color: colors.text.DEFAULT,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.medium,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filterBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
});
