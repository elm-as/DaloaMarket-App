import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Minus, Plus, PackageCheck } from 'lucide-react-native';
import {
  colors,
  radii,
  spacing,
  typography,
  AppText,
  AppPressable,
  BottomSheet,
  Button,
} from '@daloa/ui';

/**
 * Demande la quantité remise en stock avant de réactiver une annonce.
 *
 * Sans ça, « Remettre en vente » repassait `status` à `active` en laissant
 * `stock` à 0 (le trigger `manage_listing_stock_on_order` le met à 0 lors de la
 * vente) : l'annonce réapparaissait dans le fil, s'ajoutait au panier, puis s'en
 * faisait éjecter en « rupture de stock ».
 */

export interface RestockVariant {
  /** Optionnel en base : on retombe alors sur la position dans le tableau. */
  id?: string;
  label?: string | null;
  stock?: number | null;
}

/** Clé de stock d'une variante — doit rester alignée sur `markListingAsActive`. */
const variantKey = (variant: RestockVariant, index: number): string =>
  variant.id ?? String(index);

interface RestockSheetProps {
  visible: boolean;
  listingTitle?: string;
  /** Variantes de l'annonce. Vide ou absent => stock global simple. */
  variants?: RestockVariant[] | null;
  isLoading?: boolean;
  onCancel: () => void;
  /** `variantStocks` n'est fourni que pour une annonce à variantes. */
  onConfirm: (stock: number, variantStocks?: Record<string, number>) => void;
}

const MAX_STOCK = 999;

const Stepper: React.FC<{
  value: number;
  onChange: (next: number) => void;
  min?: number;
}> = ({ value, onChange, min = 0 }) => (
  <View style={styles.stepper}>
    <AppPressable
      haptic="light"
      onPress={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
      accessibilityLabel="Diminuer la quantité"
    >
      <Minus size={16} color={value <= min ? colors.text.subtle : colors.text.DEFAULT} />
    </AppPressable>

    <AppText variant="title" style={styles.stepValue}>
      {value}
    </AppText>

    <AppPressable
      haptic="light"
      onPress={() => onChange(Math.min(MAX_STOCK, value + 1))}
      disabled={value >= MAX_STOCK}
      style={[styles.stepBtn, value >= MAX_STOCK && styles.stepBtnDisabled]}
      accessibilityLabel="Augmenter la quantité"
    >
      <Plus size={16} color={value >= MAX_STOCK ? colors.text.subtle : colors.text.DEFAULT} />
    </AppPressable>
  </View>
);

export const RestockSheet: React.FC<RestockSheetProps> = ({
  visible,
  listingTitle,
  variants,
  isLoading = false,
  onCancel,
  onConfirm,
}) => {
  const hasVariants = Array.isArray(variants) && variants.length > 0;

  const [simpleStock, setSimpleStock] = React.useState(1);
  const [variantStocks, setVariantStocks] = React.useState<Record<string, number>>({});

  // Réinitialisé à chaque ouverture : la feuille est partagée entre les annonces.
  React.useEffect(() => {
    if (!visible) return;
    setSimpleStock(1);
    setVariantStocks(
      hasVariants
        ? Object.fromEntries(
            (variants || []).map((v, i) => [variantKey(v, i), Math.max(0, Number(v.stock) || 0)])
          )
        : {}
    );
  }, [visible, hasVariants, variants]);

  const total = hasVariants
    ? Object.values(variantStocks).reduce((sum, n) => sum + n, 0)
    : simpleStock;

  const canConfirm = total > 0 && !isLoading;

  return (
    <BottomSheet visible={visible} onClose={onCancel} title="Remettre en vente">
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <PackageCheck size={18} color={colors.primary[700]} />
        </View>
        <View style={styles.introText}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {listingTitle || 'Cette annonce'}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            {hasVariants
              ? 'Indiquez ce qu’il vous reste pour chaque option.'
              : 'Combien en avez-vous en stock ?'}
          </AppText>
        </View>
      </View>

      {hasVariants ? (
        <View style={styles.variantList}>
          {(variants || []).map((v, i) => {
            const key = variantKey(v, i);
            return (
              <View key={key} style={styles.variantRow}>
                <AppText variant="body" style={styles.variantLabel} numberOfLines={1}>
                  {v.label || 'Option'}
                </AppText>
                <Stepper
                  value={variantStocks[key] ?? 0}
                  onChange={(next) => setVariantStocks((prev) => ({ ...prev, [key]: next }))}
                />
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <AppText variant="caption" color={colors.text.muted}>
              Stock total
            </AppText>
            <AppText variant="bodyStrong" color={colors.primary[700]}>
              {total}
            </AppText>
          </View>
        </View>
      ) : (
        <View style={styles.simpleWrap}>
          <Stepper value={simpleStock} onChange={setSimpleStock} min={1} />
        </View>
      )}

      {total <= 0 && (
        <AppText variant="caption" color={colors.status.errorDark} style={styles.warning}>
          Indiquez au moins une unité, sinon l’annonce restera indisponible à l’achat.
        </AppText>
      )}

      <View style={styles.actions}>
        <Button title="Annuler" variant="secondary" onPress={onCancel} style={styles.actionBtn} />
        <Button
          title="Remettre en vente"
          variant="primary"
          disabled={!canConfirm}
          loading={isLoading}
          onPress={() => onConfirm(total, hasVariants ? variantStocks : undefined)}
          style={styles.actionBtn}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  introIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  introText: { flex: 1, gap: 2 },
  simpleWrap: { alignItems: 'center', paddingVertical: spacing[3] },
  variantList: { gap: spacing[2] },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  variantLabel: { flex: 1 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.bg.subtle,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
  },
  stepBtnDisabled: { opacity: 0.45 },
  stepValue: {
    minWidth: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    fontFamily: typography.families.extrabold,
  },
  warning: { marginTop: spacing[3] },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[5],
  },
  actionBtn: { flex: 1 },
});
