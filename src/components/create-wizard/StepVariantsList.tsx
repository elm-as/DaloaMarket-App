import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';
import type { DraftVariant } from './variantPresets';

interface StepVariantsListProps {
  basePrice: string;
  variants: DraftVariant[];
  onStepStock: (index: number, delta: number) => void;
  onRemoveVariant: (index: number) => void;
}

export const StepVariantsList: React.FC<StepVariantsListProps> = ({
  basePrice,
  variants,
  onStepStock,
  onRemoveVariant,
}) => {
  if (variants.length === 0) return null;

  return (
    <View style={styles.variantsList}>
      <AppText variant="overline" color={colors.text.muted}>
        Options ajoutées ({variants.length})
      </AppText>
      {variants.map((v, idx) => (
        <View key={`${v.title}-${idx}`} style={styles.variantItem}>
          <View style={styles.variantInfo}>
            <View style={styles.variantTitleRow}>
              {v.color_code && (
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: v.color_code },
                    v.color_code.toLowerCase() === '#ffffff' && {
                      borderWidth: 1,
                      borderColor: colors.border.strong,
                    },
                  ]}
                />
              )}
              <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={{ flexShrink: 1 }}>
                {v.title}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.text.muted} style={styles.priceText}>
              {v.price ? formatFCFA(v.price) : `${basePrice || '0'} FCFA (base)`}
            </AppText>
          </View>

          <View style={styles.stepperBox}>
            <AppPressable onPress={() => onStepStock(idx, -1)} style={styles.stepBtn}>
              <Minus size={13} color={colors.text.body} />
            </AppPressable>
            <AppText variant="caption" color={colors.text.DEFAULT} style={styles.stepQty}>
              {v.stock}
            </AppText>
            <AppPressable onPress={() => onStepStock(idx, 1)} style={styles.stepBtn}>
              <Plus size={13} color={colors.text.body} />
            </AppPressable>
          </View>

          <AppPressable
            haptic="light"
            onPress={() => onRemoveVariant(idx)}
            style={styles.deleteBtn}
            accessibilityLabel={`Supprimer ${v.title}`}
          >
            <Trash2 size={16} color={colors.status.errorDark} />
          </AppPressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  variantsList: { gap: spacing[2] },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg.surface,
    padding: spacing[2] + 2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  variantInfo: { flex: 1, minWidth: 0, gap: 2 },
  variantTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  priceText: { fontVariant: ['tabular-nums'] },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.grey[50],
    paddingHorizontal: 2,
  },
  stepBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepQty: { minWidth: 22, textAlign: 'center', fontFamily: typography.families.bold, fontVariant: ['tabular-nums'] },
  deleteBtn: { padding: spacing[1] },
});
