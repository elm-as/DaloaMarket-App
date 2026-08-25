import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

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
        <Search size={18} color={colors.dark.textDim} style={styles.searchIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.dark.textDim}
          style={styles.input}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            style={styles.clearBtn}
          >
            <X size={16} color={colors.dark.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {onFilterPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selection();
            onFilterPress();
          }}
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
        >
          <SlidersHorizontal
            size={18}
            color={hasActiveFilters ? '#FFFFFF' : colors.dark.text}
          />
        </TouchableOpacity>
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
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingHorizontal: spacing[3],
    height: 46,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.xl,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.market.primary,
    borderColor: colors.market.primary,
  },
});
