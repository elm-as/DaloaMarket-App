import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Animated,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, SlidersHorizontal, MapPin, Search, Tag, Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, Button, useAccent } from '@daloa/ui';
import { DALOA_DISTRICTS, MARKET_CATEGORIES, LISTING_CONDITIONS } from '@daloa/config';

export interface SearchFilterValues {
  category: string | null;
  district: string | null;
  condition: string | null;
  minPrice: string;
  maxPrice: string;
}

interface SearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilterValues;
  onApply: (newFilters: SearchFilterValues) => void;
  onReset: () => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen,
};

const CONDITION_COLORS: Record<string, string> = {
  new: '#22C55E',
  like_new: '#10B981',
  good: '#3B82F6',
  used: '#F59E0B',
};

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(800)).current;
  const [local, setLocal] = useState<SearchFilterValues>(filters);

  // Sub-picker state for district
  const [districtPickerOpen, setDistrictPickerOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');

  useEffect(() => {
    setLocal(filters);
  }, [filters, visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 800,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible]);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const filteredDistricts = districtSearch.trim()
    ? ([...DALOA_DISTRICTS]).filter((d) =>
        d.toLowerCase().includes(districtSearch.toLowerCase())
      )
    : ([...DALOA_DISTRICTS]);

  const activeCount = [
    local.category,
    local.district,
    local.condition,
    local.minPrice || local.maxPrice ? 'budget' : null,
  ].filter(Boolean).length;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet principal */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, spacing[4]), transform: [{ translateY: slideY }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SlidersHorizontal size={16} color={accent.DEFAULT} />
            <AppText variant="title">Filtrer les annonces</AppText>
            {activeCount > 0 && (
              <View style={[styles.activeBadge, { backgroundColor: accent.DEFAULT }]}>
                <AppText variant="overline" color={colors.text.inverse}>{activeCount}</AppText>
              </View>
            )}
          </View>
          <AppPressable onPress={onClose} rippleBorderless style={styles.closeBtn}>
            <X size={18} color={colors.text.muted} />
          </AppPressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Quartier ── */}
          <View style={styles.section}>
            <AppText variant="label" color={colors.text.body}>Quartier de Daloa</AppText>
            <AppPressable
              haptic="selection"
              onPress={() => { setDistrictSearch(''); setDistrictPickerOpen(true); }}
              style={[
                styles.selectField,
                local.district && { borderColor: accent[300] },
              ]}
            >
              <View style={[styles.selectIcon, { backgroundColor: accent[50] }]}>
                <MapPin size={13} color={accent.DEFAULT} />
              </View>
              <AppText
                variant="body"
                color={local.district ? colors.text.DEFAULT : colors.text.subtle}
                style={styles.flex1}
              >
                {local.district || 'Tous les quartiers'}
              </AppText>
              {local.district ? (
                <AppPressable
                  rippleBorderless
                  onPress={() => setLocal((p) => ({ ...p, district: null }))}
                  style={styles.clearBtn}
                >
                  <X size={13} color={colors.text.muted} />
                </AppPressable>
              ) : (
                <AppText variant="caption" color={colors.text.subtle}>Choisir →</AppText>
              )}
            </AppPressable>
          </View>

          {/* ── Catégorie ── */}
          <View style={styles.section}>
            <AppText variant="label" color={colors.text.body}>Catégorie</AppText>
            <View style={styles.catGrid}>
              {MARKET_CATEGORIES.map((cat) => {
                const isActive = local.category === cat.id;
                const IconComp = ICON_MAP[cat.iconName] ?? Tag;
                return (
                  <AppPressable
                    key={cat.id}
                    haptic="selection"
                    onPress={() => setLocal((p) => ({ ...p, category: isActive ? null : cat.id }))}
                    style={[
                      styles.catCard,
                      isActive && { borderColor: cat.color, backgroundColor: cat.color + '12' },
                    ]}
                  >
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                      <IconComp size={16} color={cat.color} strokeWidth={1.8} />
                    </View>
                    <AppText
                      variant="overline"
                      color={isActive ? cat.color : colors.text.muted}
                      numberOfLines={2}
                      style={styles.catLabel}
                    >
                      {cat.name.split(' & ')[0]}
                    </AppText>
                    {isActive && <View style={[styles.catDot, { backgroundColor: cat.color }]} />}
                  </AppPressable>
                );
              })}
            </View>
          </View>

          {/* ── État ── */}
          <View style={styles.section}>
            <AppText variant="label" color={colors.text.body}>État du produit</AppText>
            <View style={styles.condList}>
              {LISTING_CONDITIONS.map((cond) => {
                const isActive = local.condition === cond.id;
                const dotColor = CONDITION_COLORS[cond.id] ?? accent.DEFAULT;
                return (
                  <AppPressable
                    key={cond.id}
                    haptic="selection"
                    onPress={() => setLocal((p) => ({ ...p, condition: isActive ? null : cond.id }))}
                    style={[
                      styles.condRow,
                      isActive && { borderColor: dotColor, backgroundColor: dotColor + '10' },
                    ]}
                  >
                    <View style={[styles.condDot, { backgroundColor: dotColor }]} />
                    <AppText variant="body" color={isActive ? colors.text.DEFAULT : colors.text.body} style={styles.flex1}>
                      {cond.shortLabel}
                    </AppText>
                    {isActive && <Check size={15} color={dotColor} strokeWidth={2.5} />}
                  </AppPressable>
                );
              })}
            </View>
          </View>

          {/* ── Budget ── */}
          <View style={styles.section}>
            <AppText variant="label" color={colors.text.body}>Budget (FCFA)</AppText>
            <View style={styles.budgetRow}>
              <View style={[styles.budgetInput, (local.minPrice) && { borderColor: accent[300] }]}>
                <AppText variant="caption" color={colors.text.subtle}>Min</AppText>
                <TextInput
                  value={local.minPrice}
                  onChangeText={(t) => setLocal((p) => ({ ...p, minPrice: t }))}
                  placeholder="5 000"
                  placeholderTextColor={colors.text.subtle}
                  keyboardType="numeric"
                  style={styles.budgetTextInput}
                />
              </View>
              <View style={styles.budgetSep} />
              <View style={[styles.budgetInput, (local.maxPrice) && { borderColor: accent[300] }]}>
                <AppText variant="caption" color={colors.text.subtle}>Max</AppText>
                <TextInput
                  value={local.maxPrice}
                  onChangeText={(t) => setLocal((p) => ({ ...p, maxPrice: t }))}
                  placeholder="500 000"
                  placeholderTextColor={colors.text.subtle}
                  keyboardType="numeric"
                  style={styles.budgetTextInput}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button title="Effacer tout" variant="outline" onPress={handleReset} style={styles.resetBtn} />
          <Button
            title="Voir les résultats"
            variant="market"
            onPress={handleApply}
            style={styles.applyBtn}
            leftIcon={<Check size={16} color={colors.text.inverse} strokeWidth={2.5} />}
          />
        </View>
      </Animated.View>

      {/* ── Sub-picker quartier ── */}
      {districtPickerOpen && (
        <>
          <Pressable style={styles.subBackdrop} onPress={() => setDistrictPickerOpen(false)} />
          <View style={[styles.districtSheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
            <View style={styles.handle} />
            <View style={styles.districtHeader}>
              <View style={styles.headerLeft}>
                <MapPin size={15} color={accent.DEFAULT} />
                <AppText variant="title">Choisir un quartier</AppText>
              </View>
              <AppPressable onPress={() => setDistrictPickerOpen(false)} rippleBorderless style={styles.closeBtn}>
                <X size={18} color={colors.text.muted} />
              </AppPressable>
            </View>
            <View style={styles.districtSearch}>
              <Search size={14} color={colors.text.muted} />
              <TextInput
                value={districtSearch}
                onChangeText={setDistrictSearch}
                placeholder="Rechercher un quartier…"
                placeholderTextColor={colors.text.subtle}
                style={styles.districtSearchInput}
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={filteredDistricts}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.districtList}
              renderItem={({ item }) => {
                const isSel = item === local.district;
                return (
                  <AppPressable
                    haptic="selection"
                    onPress={() => {
                      setLocal((p) => ({ ...p, district: isSel ? null : item }));
                      setDistrictPickerOpen(false);
                    }}
                    style={[styles.districtRow, isSel && { backgroundColor: accent[50] }]}
                  >
                    <View style={[styles.districtDot, { backgroundColor: isSel ? accent.DEFAULT : colors.border.strong }]} />
                    <AppText variant={isSel ? 'bodyStrong' : 'body'} color={isSel ? accent[700] : colors.text.body} style={styles.flex1}>
                      {item}
                    </AppText>
                    {isSel && <Check size={15} color={accent.DEFAULT} strokeWidth={2.5} />}
                  </AppPressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          </View>
        </>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scroll: {
    padding: spacing[4],
    gap: spacing[1],
  },
  section: {
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  flex1: { flex: 1 },
  // ─── Quartier select ───
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.grey[50],
    overflow: 'hidden',
  },
  selectIcon: {
    width: 26,
    height: 26,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    padding: 4,
  },
  // ─── Catégories ───
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  catCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: 6,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
    gap: 5,
    position: 'relative',
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    textAlign: 'center',
    lineHeight: 13,
  },
  catDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: radii.full,
  },
  // ─── État ───
  condList: {
    gap: spacing[2],
  },
  condRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
  },
  condDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  // ─── Budget ───
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    backgroundColor: colors.grey[50],
    gap: 2,
  },
  budgetTextInput: {
    fontSize: typography.sizes.base,
    fontFamily: typography.families.bold,
    color: colors.text.DEFAULT,
    padding: 0,
  },
  budgetSep: {
    width: 16,
    height: 1.5,
    backgroundColor: colors.border.strong,
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  resetBtn: { flex: 1 },
  applyBtn: { flex: 2 },
  // ─── Sub-picker quartier ───
  subBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  districtSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    elevation: 32,
  },
  districtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  districtSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
    height: 42,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.grey[50],
  },
  districtSearchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.normal,
    color: colors.text.DEFAULT,
  },
  districtList: { flexGrow: 0 },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  districtDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  sep: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing[4] + 8 + spacing[3],
  },
});
