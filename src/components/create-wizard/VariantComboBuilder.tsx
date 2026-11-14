import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Layers, Check } from 'lucide-react-native';
import { AppText, AppPressable, colors, radii, spacing, typography, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import {
  PRESET_CLOTHING_SIZES,
  PRESET_COLORS,
  PRESET_SHOE_SIZES,
  buildMobileVariantCombinations,
  type DraftVariant,
  type PresetColor,
} from './variantPresets';

interface VariantComboBuilderProps {
  basePriceNum: number | null;
  onGenerate: (variants: DraftVariant[]) => void;
}

export const VariantComboBuilder: React.FC<VariantComboBuilderProps> = ({
  basePriceNum,
  onGenerate,
}) => {
  const accent = useAccent();
  const [selectedColors, setSelectedColors] = useState<PresetColor[]>([]);
  const [sizeKind, setSizeKind] = useState<'clothing' | 'shoe'>('clothing');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [stockStr, setStockStr] = useState('1');

  const toggleColor = (color: PresetColor) => {
    Haptics.selection();
    setSelectedColors((prev) =>
      prev.some((c) => c.name === color.name)
        ? prev.filter((c) => c.name !== color.name)
        : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    Haptics.selection();
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const sizeList = sizeKind === 'clothing' ? PRESET_CLOTHING_SIZES : PRESET_SHOE_SIZES;
  const comboCount =
    selectedColors.length > 0 && selectedSizes.length > 0
      ? selectedColors.length * selectedSizes.length
      : selectedColors.length + selectedSizes.length;

  const handleApply = () => {
    if (comboCount === 0) return;
    Haptics.success();
    const generated = buildMobileVariantCombinations({
      colors: selectedColors,
      sizes: selectedSizes,
      stockPerItem: Math.max(1, parseInt(stockStr, 10) || 1),
      basePriceNum,
    });
    onGenerate(generated);
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.block}>
        <AppText variant="caption" color={colors.text.body} style={styles.stepLabel}>
          1. Cochez les couleurs
        </AppText>
        <View style={styles.chipsRow}>
          {PRESET_COLORS.map((color) => {
            const active = selectedColors.some((c) => c.name === color.name);
            return (
              <AppPressable
                key={color.name}
                haptic="selection"
                onPress={() => toggleColor(color)}
                style={[
                  styles.chip,
                  active && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: color.code },
                    color.border && { borderWidth: 1, borderColor: colors.border.strong },
                  ]}
                />
                <AppText
                  variant="caption"
                  color={active ? colors.text.inverse : colors.text.body}
                  style={styles.chipText}
                >
                  {color.name}
                </AppText>
                {active && <Check size={12} color={colors.text.inverse} strokeWidth={2.5} />}
              </AppPressable>
            );
          })}
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.kindHeader}>
          <AppText variant="caption" color={colors.text.body} style={styles.stepLabel}>
            2. Cochez les {sizeKind === 'clothing' ? 'tailles' : 'pointures'}
          </AppText>
          <View style={styles.kindSwitch}>
            {(['clothing', 'shoe'] as const).map((kind) => {
              const active = sizeKind === kind;
              return (
                <AppPressable
                  key={kind}
                  onPress={() => {
                    if (sizeKind !== kind) {
                      setSizeKind(kind);
                      setSelectedSizes([]);
                    }
                  }}
                  style={[styles.kindBtn, active && { backgroundColor: colors.text.DEFAULT }]}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.text.inverse : colors.text.muted}
                    style={{ fontSize: 11, fontFamily: typography.families.bold }}
                  >
                    {kind === 'clothing' ? 'Tailles' : 'Pointures'}
                  </AppText>
                </AppPressable>
              );
            })}
          </View>
        </View>
        <View style={styles.chipsRow}>
          {sizeList.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <AppPressable
                key={size}
                haptic="selection"
                onPress={() => toggleSize(size)}
                style={[
                  styles.sizeChip,
                  active && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                ]}
              >
                <AppText
                  variant="caption"
                  color={active ? colors.text.inverse : colors.text.body}
                  style={[styles.chipText, { fontVariant: ['tabular-nums'] }]}
                >
                  {size}
                </AppText>
              </AppPressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.stockField}>
          <AppText variant="caption" color={colors.text.muted}>
            Stock / option :
          </AppText>
          <TextInput
            value={stockStr}
            onChangeText={setStockStr}
            keyboardType="numeric"
            style={styles.stockInput}
          />
        </View>

        <AppPressable
          haptic="success"
          disabled={comboCount === 0}
          onPress={handleApply}
          style={[
            styles.applyBtn,
            { backgroundColor: comboCount > 0 ? accent.DEFAULT : colors.grey[200] },
          ]}
        >
          <Layers size={15} color={comboCount > 0 ? colors.text.inverse : colors.text.subtle} />
          <AppText
            variant="label"
            color={comboCount > 0 ? colors.text.inverse : colors.text.subtle}
            style={{ fontSize: 12 }}
          >
            {comboCount > 0 ? `Ajouter (${comboCount})` : 'Choisissez ci-dessus'}
          </AppText>
        </AppPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing[3] },
  block: { gap: spacing[1] + 2 },
  stepLabel: { fontFamily: typography.families.bold },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing[2] + 4,
    paddingVertical: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  sizeChip: {
    minWidth: 44,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2] + 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  chipText: { fontSize: 12, fontFamily: typography.families.bold },
  kindHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kindSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: 2,
    gap: 2,
  },
  kindBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.sm },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  stockField: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockInput: {
    width: 54,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: typography.families.bold,
    color: colors.text.DEFAULT,
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    gap: 6,
  },
});
