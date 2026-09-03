import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  Modal,
  Animated,
  Pressable,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DALOA_DISTRICTS } from '@daloa/config';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { MapPin, Truck, Plus, Minus, ChevronDown, Search, Check, X } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

interface StepLocationDeliveryProps {
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  stock: number;
  setStock: React.Dispatch<React.SetStateAction<number>>;
  acceptsDelivery: boolean;
  setAcceptsDelivery: (a: boolean) => void;
}

export const StepLocationDelivery: React.FC<StepLocationDeliveryProps> = ({
  selectedDistrict,
  setSelectedDistrict,
  stock,
  setStock,
  acceptsDelivery,
  setAcceptsDelivery,
}) => {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const slideY = useRef(new Animated.Value(600)).current;

  const filtered = search.trim()
    ? DALOA_DISTRICTS.filter((d) =>
        d.toLowerCase().includes(search.trim().toLowerCase())
      )
    : DALOA_DISTRICTS;

  const openPicker = () => {
    setSearch('');
    setPickerOpen(true);
    Animated.spring(slideY, {
      toValue: 0,
      damping: 22,
      stiffness: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closePicker = () => {
    Animated.timing(slideY, {
      toValue: 600,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setPickerOpen(false));
  };

  const handleSelect = (district: string) => {
    Haptics.selection();
    setSelectedDistrict(district);
    closePicker();
  };

  return (
    <View style={styles.container}>
      {/* ── Quartier ── */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <MapPin size={15} color={accent.DEFAULT} />
          <AppText variant="label" color={colors.text.body}>
            Quartier de disponibilité *
          </AppText>
        </View>
        <AppText variant="caption" color={colors.text.muted}>
          Où l'article est disponible pour le retrait ou le ramassage coursier.
        </AppText>

        {/* Champ de sélection */}
        <AppPressable
          haptic="selection"
          onPress={openPicker}
          style={[
            styles.selectField,
            { borderColor: selectedDistrict ? accent[300] : colors.border.DEFAULT },
          ]}
        >
          <View style={[styles.selectIconBg, { backgroundColor: accent[50] }]}>
            <MapPin size={14} color={accent.DEFAULT} />
          </View>
          <AppText
            variant="bodyStrong"
            color={selectedDistrict ? colors.text.DEFAULT : colors.text.subtle}
            style={styles.selectText}
          >
            {selectedDistrict || 'Choisir un quartier…'}
          </AppText>
          <ChevronDown size={16} color={colors.text.muted} />
        </AppPressable>
      </View>

      {/* ── Stock ── */}
      <View style={styles.stockCard}>
        <View style={styles.flex1}>
          <AppText variant="label" color={colors.text.body}>Quantité en stock</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Nombre d'unités disponibles immédiatement
          </AppText>
        </View>
        <View style={styles.stockStepper}>
          <AppPressable
            haptic="light"
            rippleBorderless
            onPress={() => setStock((p) => Math.max(1, p - 1))}
            style={[styles.stockBtn, { backgroundColor: accent[50] }]}
            accessibilityLabel="Diminuer le stock"
          >
            <Minus size={14} color={accent[600]} strokeWidth={2.5} />
          </AppPressable>
          <AppText variant="bodyStrong" style={styles.stockCount}>{stock}</AppText>
          <AppPressable
            haptic="light"
            rippleBorderless
            onPress={() => setStock((p) => p + 1)}
            style={[styles.stockBtn, { backgroundColor: accent[50] }]}
            accessibilityLabel="Augmenter le stock"
          >
            <Plus size={14} color={accent[600]} strokeWidth={2.5} />
          </AppPressable>
        </View>
      </View>

      {/* ── Livraison ── */}
      <View style={[styles.deliveryCard, { backgroundColor: accent[50], borderColor: accent[100] }]}>
        <View style={styles.deliveryLeft}>
          <View style={styles.deliveryIcon}>
            <Truck size={18} color={accent[600]} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="label" color={colors.text.body}>
              Livraison DaloaDelivery acceptée
            </AppText>
            <AppText variant="caption" color={colors.text.muted}>
              Permet aux acheteurs de se faire livrer par coursier avec paiement séquestre.
            </AppText>
          </View>
        </View>
        <Switch
          value={acceptsDelivery}
          onValueChange={(val) => {
            Haptics.lightImpact();
            setAcceptsDelivery(val);
          }}
          trackColor={{ false: colors.border.DEFAULT, true: accent.DEFAULT }}
          thumbColor={colors.bg.surface}
        />
      </View>

      {/* ── Bottom Sheet Picker ── */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closePicker}
      >
        <Pressable style={styles.backdrop} onPress={closePicker} />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing[4]), transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <MapPin size={16} color={accent.DEFAULT} />
              <AppText variant="title">Choisir un quartier</AppText>
            </View>
            <AppPressable onPress={closePicker} rippleBorderless style={styles.closeBtn}>
              <X size={18} color={colors.text.muted} />
            </AppPressable>
          </View>

          {/* Recherche */}
          <View style={styles.searchBox}>
            <Search size={15} color={colors.text.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un quartier…"
              placeholderTextColor={colors.text.subtle}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <AppPressable rippleBorderless onPress={() => setSearch('')} style={styles.clearSearch}>
                <X size={13} color={colors.text.muted} />
              </AppPressable>
            )}
          </View>

          {/* Liste */}
          <FlatList
            data={filtered as string[]}
            keyExtractor={(item) => item}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item === selectedDistrict;
              return (
                <AppPressable
                  haptic="selection"
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.districtRow,
                    isSelected && { backgroundColor: accent[50] },
                  ]}
                >
                  <View style={[styles.districtDot, { backgroundColor: isSelected ? accent.DEFAULT : colors.border.strong }]} />
                  <AppText
                    variant={isSelected ? 'bodyStrong' : 'body'}
                    color={isSelected ? accent[700] : colors.text.body}
                    style={styles.flex1}
                  >
                    {item}
                  </AppText>
                  {isSelected && <Check size={16} color={accent.DEFAULT} strokeWidth={2.5} />}
                </AppPressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    gap: spacing[3],
  },
  section: {
    gap: spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flex1: {
    flex: 1,
  },
  // ─── Champ select ───
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.grey[50],
    overflow: 'hidden',
  },
  selectIconBg: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: {
    flex: 1,
  },
  // ─── Stock ───
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grey[50],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    padding: spacing[3],
    gap: spacing[3],
  },
  stockStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    padding: 3,
    gap: spacing[2],
  },
  stockBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stockCount: {
    minWidth: 20,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  // ─── Livraison ───
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[3],
  },
  deliveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
    marginRight: spacing[2],
  },
  deliveryIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Bottom sheet ───
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
    maxHeight: '78%',
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
    height: 44,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.grey[50],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.normal,
    color: colors.text.DEFAULT,
  },
  clearSearch: {
    padding: 4,
  },
  list: {
    flexGrow: 0,
  },
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
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing[4] + 8 + spacing[3],
  },
});
