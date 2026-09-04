import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen, Tag } from 'lucide-react-native';
import { MARKET_CATEGORIES, LISTING_CONDITIONS } from '@daloa/config';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';
import { StepVariantsSection, DraftVariant } from './StepVariantsSection';

interface StepCategoryPricingProps {
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedCondition: string;
  setSelectedCondition: (c: string) => void;
  price: string;
  setPrice: (p: string) => void;
  originalPrice: string;
  setOriginalPrice: (p: string) => void;
  variants: DraftVariant[];
  onVariantsChange: (variants: DraftVariant[]) => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Shirt,
  Smartphone,
  Home,
  Car,
  UtensilsCrossed,
  Dumbbell,
  BookOpen,
  Tag,
};

const CONDITION_COLORS: Record<string, string> = {
  new: '#22C55E',
  like_new: '#10B981',
  good: '#3B82F6',
  used: '#F59E0B',
};

const CONDITION_DESC: Record<string, string> = {
  new: 'Jamais utilisé, emballage d\'origine',
  like_new: 'Utilisé mais sans défaut visible',
  good: 'Fonctionne parfaitement, légères traces',
  used: 'Signes d\'usure, fonctionnel',
};

export const StepCategoryPricing: React.FC<StepCategoryPricingProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedCondition,
  setSelectedCondition,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  variants,
  onVariantsChange,
}) => {
  const accent = useAccent();
  const numPrice = parseFloat(price) || 0;
  const numOriginal = originalPrice ? parseFloat(originalPrice) : null;
  const hasDiscount = numOriginal != null && numOriginal > numPrice && numPrice > 0;
  const discountPct = hasDiscount && numOriginal ? Math.round(((numOriginal - numPrice) / numOriginal) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* ── Catégorie ── */}
      <View style={styles.section}>
        <AppText variant="label" color={colors.text.body}>Catégorie du produit *</AppText>
        <View style={styles.catGrid}>
          {MARKET_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = ICON_MAP[cat.iconName] ?? Tag;
            return (
              <AppPressable
                key={cat.id}
                haptic="selection"
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.catCard,
                  isSelected && { borderColor: cat.color, backgroundColor: cat.color + '14' },
                ]}
              >
                <View style={[styles.catIconCircle, { backgroundColor: cat.color + '22' }]}>
                  <IconComp size={20} color={cat.color} strokeWidth={1.8} />
                </View>
                <AppText
                  variant="overline"
                  color={isSelected ? cat.color : colors.text.muted}
                  numberOfLines={2}
                  style={styles.catLabel}
                >
                  {cat.name}
                </AppText>
                {isSelected && (
                  <View style={[styles.catSelectedDot, { backgroundColor: cat.color }]} />
                )}
              </AppPressable>
            );
          })}
        </View>
      </View>

      {/* ── État ── */}
      <View style={styles.section}>
        <AppText variant="label" color={colors.text.body}>État de l'article *</AppText>
        <View style={styles.conditionList}>
          {LISTING_CONDITIONS.map((cond) => {
            const isSelected = selectedCondition === cond.id;
            const dotColor = CONDITION_COLORS[cond.id] ?? accent.DEFAULT;
            return (
              <AppPressable
                key={cond.id}
                haptic="selection"
                onPress={() => setSelectedCondition(cond.id)}
                style={[
                  styles.condRow,
                  {
                    borderColor: isSelected ? dotColor : colors.border.DEFAULT,
                    borderWidth: isSelected ? 2 : 1.5,
                    backgroundColor: isSelected ? dotColor + '12' : colors.bg.surface,
                  },
                ]}
              >
                <View style={[styles.condDot, { backgroundColor: dotColor }]} />
                <View style={styles.condText}>
                  <AppText variant="bodyStrong" color={isSelected ? colors.text.DEFAULT : colors.text.body}>
                    {cond.shortLabel}
                  </AppText>
                  <AppText variant="caption" color={colors.text.muted}>
                    {CONDITION_DESC[cond.id]}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.condRadio,
                    {
                      borderColor: isSelected ? dotColor : colors.border.DEFAULT,
                      backgroundColor: isSelected ? dotColor : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <View style={styles.condRadioInner} />}
                </View>
              </AppPressable>
            );
          })}
        </View>
      </View>

      {/* ── Variantes ── */}
      <StepVariantsSection basePrice={price} variants={variants} onVariantsChange={onVariantsChange} />

      {/* ── Prix ── */}
      <View style={styles.section}>
        <AppText variant="label" color={colors.text.body}>Prix de vente (FCFA) *</AppText>
        <View style={[styles.priceInputWrapper, { borderColor: price ? accent[300] : colors.border.DEFAULT }]}>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Ex: 25 000"
            placeholderTextColor={colors.text.subtle}
            style={styles.priceInput}
          />
          <AppText variant="bodyStrong" color={accent[600]}>FCFA</AppText>
        </View>
        {numPrice > 0 && (
          <View style={[styles.pricePreview, { backgroundColor: accent[50], borderColor: accent[100] }]}>
            <AppText variant="caption" color={accent[700]}>
              Votre article sera affiché à{' '}
              <AppText variant="bodyStrong" color={accent[700]}>{formatFCFA(numPrice)}</AppText>
              {hasDiscount && (
                <AppText variant="caption" color={colors.status.successDark}> — -{discountPct}% de réduction</AppText>
              )}
            </AppText>
          </View>
        )}
      </View>

      {/* ── Prix barré (optionnel) ── */}
      <View style={styles.section}>
        <AppText variant="label" color={colors.text.body}>
          Prix d'origine barré{' '}
          <AppText variant="caption" color={colors.text.subtle}>(optionnel)</AppText>
        </AppText>
        <AppText variant="caption" color={colors.text.muted} style={styles.hint}>
          Ajoute un badge "−X%" et rayé l'ancien prix pour attirer l'attention.
        </AppText>
        <View style={[styles.priceInputWrapper, { borderColor: originalPrice ? colors.status.warning : colors.border.DEFAULT }]}>
          <TextInput
            value={originalPrice}
            onChangeText={setOriginalPrice}
            keyboardType="numeric"
            placeholder="Ex: 35 000"
            placeholderTextColor={colors.text.subtle}
            style={styles.priceInput}
          />
          <AppText variant="bodyStrong" color={colors.text.subtle}>FCFA</AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    gap: spacing[1],
  },
  section: {
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  hint: {
    marginTop: -4,
  },
  // ─── Catégorie ───
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  catCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    textAlign: 'center',
    lineHeight: 14,
  },
  catSelectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  // ─── État ───
  conditionList: {
    gap: spacing[2],
  },
  condRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
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
  condText: {
    flex: 1,
    gap: 1,
  },
  condRadio: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  condRadioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  // ─── Prix ───
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    backgroundColor: colors.grey[50],
    paddingHorizontal: spacing[3],
    height: 52,
    gap: spacing[2],
  },
  priceInput: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontFamily: typography.families.bold,
    color: colors.text.DEFAULT,
  },
  pricePreview: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
    marginTop: -4,
  },
});
