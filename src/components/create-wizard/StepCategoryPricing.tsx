import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen, Sparkles, Tag, FileText, Check } from 'lucide-react-native';
import { MARKET_CATEGORIES, LISTING_CONDITIONS } from '@daloa/config';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { StepVariantsSection, DraftVariant } from './StepVariantsSection';
import { PricingPayoutPromoBox } from './PricingPayoutPromoBox';

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
  isProSeller?: boolean;
  sellerFeeOverride?: number | null;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Shirt,
  Smartphone,
  Home,
  Car,
  UtensilsCrossed,
  Sparkles,
  Dumbbell,
  BookOpen,
  FileText,
  Tag,
};

const CONDITION_COLORS: Record<string, string> = {
  new: '#22C55E',
  like_new: '#10B981',
  good: '#3B82F6',
  used: '#F59E0B',
};

const CONDITION_DESC: Record<string, string> = {
  new: "Jamais utilisé, emballage d'origine",
  like_new: 'Utilisé mais sans défaut visible',
  good: 'Fonctionne parfaitement, légères traces',
  used: "Signes d'usure, fonctionnel",
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
  isProSeller = false,
  sellerFeeOverride = null,
}) => {
  const accent = useAccent();

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
                  styles.catPill,
                  isSelected && {
                    borderColor: cat.color,
                    backgroundColor: cat.color + '14',
                  },
                ]}
              >
                <IconComp size={15} color={cat.color} strokeWidth={2} />
                <AppText
                  variant="caption"
                  color={isSelected ? colors.text.DEFAULT : colors.text.body}
                  style={isSelected ? styles.catLabelActive : styles.catLabel}
                >
                  {cat.name}
                </AppText>
                {isSelected && <Check size={13} color={cat.color} strokeWidth={2.8} />}
              </AppPressable>
            );
          })}
        </View>
        {selectedCategory === 'digital' && (
          <View style={styles.digitalNotice}>
            <AppText variant="caption" color="#0369A1" style={{ fontFamily: typography.families.semibold }}>
              💡 Produit numérique : aucun coursier ne sera affecté. Vous transmettrez le document directement à l'acheteur en privé après validation.
            </AppText>
          </View>
        )}
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
      <StepVariantsSection
        basePrice={price}
        category={selectedCategory}
        variants={variants}
        onVariantsChange={onVariantsChange}
      />

      {/* ── Prix, Gain net vendeur & Promo Flash (FOMO) ── */}
      <PricingPayoutPromoBox
        price={price}
        setPrice={setPrice}
        originalPrice={originalPrice}
        setOriginalPrice={setOriginalPrice}
        isProSeller={isProSeller}
        sellerFeeOverride={sellerFeeOverride}
      />
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
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  catLabel: {
    fontFamily: typography.families.medium,
  },
  catLabelActive: {
    fontFamily: typography.families.semibold,
  },
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
  digitalNotice: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radii.lg,
    padding: spacing[3],
    marginTop: spacing[2],
  },
});
