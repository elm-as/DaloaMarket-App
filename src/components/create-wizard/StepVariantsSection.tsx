import React, { useEffect, useState } from 'react';
import { View, TextInput, Switch, ScrollView } from 'react-native';
import { Plus, Layers, Shirt, Footprints, Palette, Tag, Check } from 'lucide-react-native';
import { colors, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import {
  PRESET_CLOTHING_SIZES,
  PRESET_COLORS,
  PRESET_SHOE_SIZES,
  PRESET_STORAGE_SIZES,
  getRecommendedMobileVariantTab,
  mergeMobileDraftVariants,
  type DraftVariant,
  type MobileVariantTab,
} from './variantPresets';
import { VariantComboBuilder } from './VariantComboBuilder';
import { StepVariantsList } from './StepVariantsList';
import { stepVariantsStyles as styles } from './stepVariantsStyles';

export type { DraftVariant };

interface StepVariantsSectionProps {
  basePrice: string;
  category?: string;
  variants: DraftVariant[];
  onVariantsChange: (variants: DraftVariant[]) => void;
}

const OPTION_TABS: { key: MobileVariantTab; label: string; Icon: React.FC<any> }[] = [
  { key: 'clothing_size', label: 'Tailles', Icon: Shirt },
  { key: 'shoe_size', label: 'Pointures', Icon: Footprints },
  { key: 'color', label: 'Couleurs', Icon: Palette },
  { key: 'combo', label: 'Couleur + Taille', Icon: Layers },
  { key: 'custom', label: 'Autre', Icon: Tag },
];

export const StepVariantsSection: React.FC<StepVariantsSectionProps> = ({
  basePrice,
  category,
  variants,
  onVariantsChange,
}) => {
  const accent = useAccent();
  const [isEnabled, setIsEnabled] = useState(variants.length > 0);
  const [activeTab, setActiveTab] = useState<MobileVariantTab>(() =>
    getRecommendedMobileVariantTab(category)
  );
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customStock, setCustomStock] = useState('1');

  useEffect(() => {
    setActiveTab(getRecommendedMobileVariantTab(category));
  }, [category]);

  useEffect(() => {
    if (variants.length > 0 && !isEnabled) setIsEnabled(true);
  }, [variants.length, isEnabled]);

  const parsedBasePrice = parseFloat(basePrice);
  const fallbackBasePrice = Number.isFinite(parsedBasePrice) && parsedBasePrice >= 300 ? parsedBasePrice : null;

  const handleToggleSection = (val: boolean) => {
    Haptics.selection();
    setIsEnabled(val);
    if (!val) onVariantsChange([]);
  };

  const handleTogglePreset = (payload: {
    title: string;
    color?: string | null;
    color_code?: string | null;
    size?: string | null;
  }) => {
    Haptics.selection();
    const key = payload.title.trim().toLowerCase();
    const existingIndex = variants.findIndex((v) => v.title.trim().toLowerCase() === key);
    if (existingIndex >= 0) {
      onVariantsChange(variants.filter((_, idx) => idx !== existingIndex));
      return;
    }
    onVariantsChange([
      ...variants,
      {
        title: payload.title,
        color: payload.color ?? null,
        color_code: payload.color_code ?? null,
        size: payload.size ?? null,
        price: fallbackBasePrice,
        stock: 1,
      },
    ]);
  };

  const handleAddCustom = () => {
    const clean = customTitle.trim();
    if (!clean) return;
    Haptics.success();
    const parsedPrice = parseFloat(customPrice);
    const priceNum = customPrice.trim() && Number.isFinite(parsedPrice) ? parsedPrice : fallbackBasePrice;
    const stockNum = Math.max(1, parseInt(customStock, 10) || 1);

    onVariantsChange(
      mergeMobileDraftVariants(variants, [{ title: clean, price: priceNum, stock: stockNum }])
    );
    setCustomTitle('');
    setCustomPrice('');
    setCustomStock('1');
  };

  const handleStepStock = (index: number, delta: number) => {
    Haptics.selection();
    onVariantsChange(
      variants.map((item, idx) =>
        idx === index ? { ...item, stock: Math.max(1, (item.stock || 1) + delta) } : item
      )
    );
  };

  const handleRemoveVariant = (index: number) => {
    Haptics.lightImpact();
    onVariantsChange(variants.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <View style={styles.titleWithIcon}>
            <Layers size={18} color={accent.DEFAULT} strokeWidth={2.2} />
            <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
              Tailles, pointures ou couleurs
            </AppText>
          </View>
          <AppText variant="caption" color={colors.text.muted}>
            Activez si votre article existe en plusieurs options
          </AppText>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggleSection}
          trackColor={{ false: colors.grey[200], true: accent[300] }}
          thumbColor={isEnabled ? accent.DEFAULT : colors.grey[400]}
        />
      </View>

      {isEnabled && (
        <View style={styles.contentBox}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {OPTION_TABS.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <AppPressable
                  key={key}
                  haptic="selection"
                  onPress={() => setActiveTab(key)}
                  style={[
                    styles.tabBtn,
                    active && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                  ]}
                >
                  <Icon size={14} color={active ? colors.text.inverse : colors.text.muted} strokeWidth={2} />
                  <AppText
                    variant="caption"
                    color={active ? colors.text.inverse : colors.text.body}
                    style={styles.tabLabel}
                  >
                    {label}
                  </AppText>
                </AppPressable>
              );
            })}
          </ScrollView>

          {activeTab === 'color' && (
            <View style={styles.chipsWrap}>
              {PRESET_COLORS.map((color) => {
                const selected = variants.some((v) => v.title.toLowerCase() === color.name.toLowerCase());
                return (
                  <AppPressable
                    key={color.name}
                    onPress={() =>
                      handleTogglePreset({ title: color.name, color: color.name, color_code: color.code })
                    }
                    style={[
                      styles.chip,
                      selected && { borderColor: accent.DEFAULT, backgroundColor: accent[50] ?? '#FFF7ED' },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: color.code },
                        color.border && { borderWidth: 1, borderColor: colors.border.strong },
                      ]}
                    />
                    <AppText variant="caption" color={colors.text.DEFAULT} style={styles.chipText}>
                      {color.name}
                    </AppText>
                    {selected && <Check size={12} color={accent.DEFAULT} strokeWidth={2.5} />}
                  </AppPressable>
                );
              })}
            </View>
          )}

          {(activeTab === 'clothing_size' || activeTab === 'shoe_size') && (
            <View style={styles.chipsWrap}>
              {(activeTab === 'clothing_size' ? PRESET_CLOTHING_SIZES : PRESET_SHOE_SIZES).map((size) => {
                const selected = variants.some((v) => v.title.toLowerCase() === size.toLowerCase());
                return (
                  <AppPressable
                    key={size}
                    onPress={() => handleTogglePreset({ title: size, size })}
                    style={[
                      styles.sizeChip,
                      selected && { borderColor: accent.DEFAULT, backgroundColor: accent[50] ?? '#FFF7ED' },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={selected ? accent[800] ?? accent.DEFAULT : colors.text.DEFAULT}
                      style={[styles.chipText, { fontVariant: ['tabular-nums'] }]}
                    >
                      {size}
                    </AppText>
                  </AppPressable>
                );
              })}
            </View>
          )}

          {activeTab === 'combo' && (
            <VariantComboBuilder
              basePriceNum={fallbackBasePrice}
              onGenerate={(generated) => onVariantsChange(mergeMobileDraftVariants(variants, generated))}
            />
          )}

          {activeTab === 'custom' && (
            <View style={styles.addForm}>
              <View style={styles.chipsWrap}>
                {PRESET_STORAGE_SIZES.map((storage) => {
                  const selected = variants.some((v) => v.title.toLowerCase() === storage.toLowerCase());
                  return (
                    <AppPressable
                      key={storage}
                      onPress={() => handleTogglePreset({ title: storage, size: storage })}
                      style={[
                        styles.chip,
                        selected && { borderColor: accent.DEFAULT, backgroundColor: accent[50] ?? '#FFF7ED' },
                      ]}
                    >
                      <AppText variant="caption" color={colors.text.DEFAULT} style={styles.chipText}>
                        {storage}
                      </AppText>
                    </AppPressable>
                  );
                })}
              </View>

              <TextInput
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder="Ex: Coton XL, Pack de 3, Noir 128 Go..."
                placeholderTextColor={colors.text.subtle}
                style={styles.input}
              />

              <View style={styles.rowInputs}>
                <TextInput
                  value={customPrice}
                  onChangeText={setCustomPrice}
                  keyboardType="numeric"
                  placeholder={`Prix (${basePrice || 'base'})`}
                  placeholderTextColor={colors.text.subtle}
                  style={[styles.input, styles.inputHalf]}
                />
                <TextInput
                  value={customStock}
                  onChangeText={setCustomStock}
                  keyboardType="numeric"
                  placeholder="Stock (1)"
                  placeholderTextColor={colors.text.subtle}
                  style={[styles.input, styles.inputHalf]}
                />
              </View>

              <AppPressable
                haptic="selection"
                onPress={handleAddCustom}
                disabled={!customTitle.trim()}
                style={[styles.addBtn, { backgroundColor: customTitle.trim() ? accent.DEFAULT : colors.grey[200] }]}
              >
                <Plus size={16} color={colors.text.inverse} strokeWidth={2.5} />
                <AppText variant="label" color={colors.text.inverse}>
                  Ajouter cette option
                </AppText>
              </AppPressable>
            </View>
          )}

          <StepVariantsList
            basePrice={basePrice}
            variants={variants}
            onStepStock={handleStepStock}
            onRemoveVariant={handleRemoveVariant}
          />
        </View>
      )}
    </View>
  );
};
