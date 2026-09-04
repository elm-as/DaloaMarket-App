import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Modal,
  Animated,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Minus, ShoppingCart, Check } from 'lucide-react-native';
import { AppText, AppPressable, colors, radii, spacing, useAccent } from '@daloa/ui';
import { formatFCFA, Haptics } from '@daloa/utils';
import { ListingVariant } from '@daloa/types';

const FALLBACK =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=120';

export interface VariantSelection {
  variant: ListingVariant;
  quantity: number;
}

interface VariantPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  variants: ListingVariant[];
  listingTitle: string;
  listingPhoto?: string;
  basePrice: number;
  /** Quantités déjà au panier pour pré-remplissage { variantId: qty } */
  initialQuantities?: Record<string, number>;
  /** Sélection multi-options avec quantités individuelles */
  onConfirmQuantities: (selections: VariantSelection[]) => void;
  /** Compatibilité ascendante : sélection d'une seule variante */
  onConfirm?: (variant: ListingVariant) => void;
}

export const VariantPickerSheet: React.FC<VariantPickerSheetProps> = ({
  visible,
  onClose,
  variants,
  listingTitle,
  listingPhoto,
  basePrice,
  initialQuantities,
  onConfirmQuantities,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const slideY = useRef(new Animated.Value(600)).current;

  // Dictionnaire { variantId: quantité choisie }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const hasInitialInCart = Boolean(
    initialQuantities && Object.values(initialQuantities).some((q) => q > 0)
  );

  useEffect(() => {
    if (visible) {
      if (initialQuantities && Object.keys(initialQuantities).length > 0) {
        setQuantities({ ...initialQuantities });
      } else {
        const initial: Record<string, number> = {};
        const firstInStock = variants.find((v) => (v.stock ?? 1) > 0);
        if (firstInStock?.id) {
          initial[firstInStock.id] = 1;
        }
        setQuantities(initial);
      }

      Animated.spring(slideY, {
        toValue: 0,
        damping: 24,
        stiffness: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 600,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible, variants, initialQuantities]);

  const handleIncrement = (variantId: string, maxStock: number) => {
    const current = quantities[variantId] || 0;
    if (current >= maxStock) return;
    Haptics.selection();
    setQuantities((prev) => ({ ...prev, [variantId]: current + 1 }));
  };

  const handleDecrement = (variantId: string) => {
    const current = quantities[variantId] || 0;
    if (current <= 0) return;
    Haptics.selection();
    setQuantities((prev) => {
      const next = { ...prev };
      if (current === 1) delete next[variantId];
      else next[variantId] = current - 1;
      return next;
    });
  };

  const summary = useMemo(() => {
    let totalQty = 0;
    let totalPrice = 0;
    const selectedList: VariantSelection[] = [];

    variants.forEach((v) => {
      const q = v.id ? quantities[v.id] || 0 : 0;
      if (q > 0) {
        totalQty += q;
        totalPrice += q * (v.price ?? basePrice);
        selectedList.push({ variant: v, quantity: q });
      }
    });

    return { totalQty, totalPrice, selectedList };
  }, [variants, quantities, basePrice]);

  const handleConfirm = () => {
    if (summary.totalQty === 0 && !hasInitialInCart) return;
    Haptics.success();
    if (onConfirmQuantities) {
      onConfirmQuantities(summary.selectedList);
    } else if (onConfirm && summary.selectedList[0]) {
      onConfirm(summary.selectedList[0].variant);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <AppText variant="title">Options & Quantités</AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              Ajustez les quantités pour chaque option souhaitée
            </AppText>
          </View>
          <AppPressable onPress={onClose} rippleBorderless style={styles.closeBtn} accessibilityLabel="Fermer">
            <X size={18} color={colors.text.muted} />
          </AppPressable>
        </View>

        {/* Aperçu produit */}
        <View style={styles.productPreview}>
          <Image
            source={{ uri: listingPhoto || FALLBACK }}
            style={styles.previewImg}
            resizeMode="cover"
          />
          <View style={styles.previewInfo}>
            <AppText variant="bodyStrong" numberOfLines={2} color={colors.text.body}>
              {listingTitle}
            </AppText>
            <AppText variant="caption" color={accent[700]} style={styles.startingPrice}>
              Dès {formatFCFA(basePrice)}
            </AppText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Liste des variantes avec ajustement de quantité par ligne */}
        <ScrollView
          style={styles.variantList}
          contentContainerStyle={styles.variantListContent}
          showsVerticalScrollIndicator={false}
        >
          {variants.map((v) => {
            const vId = v.id || '';
            const qty = quantities[vId] || 0;
            const maxStock = v.stock ?? 1;
            const outOfStock = maxStock <= 0;
            const unitPrice = v.price ?? basePrice;
            const isSelected = qty > 0;

            return (
              <View
                key={vId}
                style={[
                  styles.variantRow,
                  isSelected && { borderColor: accent[300], backgroundColor: accent[50] },
                  outOfStock && styles.variantRowDisabled,
                ]}
              >
                {/* Infos Variante */}
                <View style={styles.variantMeta}>
                  <View style={styles.variantTitleRow}>
                    <AppText
                      variant="bodyStrong"
                      color={outOfStock ? colors.text.subtle : isSelected ? accent[900] ?? accent[700] : colors.text.body}
                      style={outOfStock && { textDecorationLine: 'line-through' }}
                    >
                      {v.label}
                    </AppText>
                    {isSelected && (
                      <View style={[styles.selectedCheck, { backgroundColor: accent.DEFAULT }]}>
                        <Check size={10} color={colors.text.inverse} strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  <View style={styles.variantSubRow}>
                    <AppText variant="caption" color={accent[700]} style={styles.priceTag}>
                      {formatFCFA(unitPrice)} / unité
                    </AppText>
                    <AppText
                      variant="caption"
                      color={outOfStock ? colors.status.error : colors.text.subtle}
                    >
                      {outOfStock ? 'Épuisé' : `${maxStock} dispo`}
                    </AppText>
                  </View>
                </View>

                {/* Stepper de quantité dédié à cette option */}
                {!outOfStock ? (
                  <View style={[styles.stepperWrap, isSelected && { borderColor: accent[200] }]}>
                    <AppPressable
                      haptic="light"
                      rippleBorderless
                      disabled={qty <= 0}
                      onPress={() => handleDecrement(vId)}
                      style={[styles.stepBtn, qty <= 0 && styles.stepBtnDisabled]}
                      accessibilityLabel={`Diminuer ${v.label}`}
                    >
                      <Minus size={14} color={qty > 0 ? accent.DEFAULT : colors.text.subtle} strokeWidth={2.5} />
                    </AppPressable>

                    <View style={styles.qtyBox}>
                      <AppText
                        variant="bodyStrong"
                        color={qty > 0 ? accent[800] ?? colors.text.body : colors.text.subtle}
                        style={styles.qtyText}
                      >
                        {qty}
                      </AppText>
                    </View>

                    <AppPressable
                      haptic="light"
                      rippleBorderless
                      disabled={qty >= maxStock}
                      onPress={() => handleIncrement(vId, maxStock)}
                      style={[styles.stepBtn, qty >= maxStock && styles.stepBtnDisabled]}
                      accessibilityLabel={`Augmenter ${v.label}`}
                    >
                      <Plus size={14} color={qty < maxStock ? accent.DEFAULT : colors.text.subtle} strokeWidth={2.5} />
                    </AppPressable>
                  </View>
                ) : (
                  <View style={styles.outBadge}>
                    <AppText variant="caption" color={colors.text.subtle}>
                      Indisponible
                    </AppText>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Barre CTA récapitulative dynamique */}
        <View style={styles.ctaWrap}>
          <AppPressable
            haptic="success"
            onPress={handleConfirm}
            disabled={summary.totalQty === 0 && !hasInitialInCart}
            rippleColor="rgba(255,255,255,0.24)"
            style={[
              styles.ctaBtn,
              summary.totalQty > 0
                ? { backgroundColor: accent.DEFAULT }
                : hasInitialInCart
                ? { backgroundColor: colors.status.error }
                : { backgroundColor: colors.grey[300] },
            ]}
            accessibilityLabel={summary.totalQty > 0 ? 'Valider les options' : 'Retirer du panier'}
          >
            {summary.totalQty > 0 ? (
              <>
                <ShoppingCart size={18} color={colors.text.inverse} strokeWidth={2.2} />
                <AppText variant="label" color={colors.text.inverse} style={styles.ctaText}>
                  {hasInitialInCart
                    ? `Enregistrer (${summary.totalQty}) — ${formatFCFA(summary.totalPrice)}`
                    : `Ajouter ${summary.totalQty} article${summary.totalQty > 1 ? 's' : ''} — ${formatFCFA(summary.totalPrice)}`}
                </AppText>
              </>
            ) : hasInitialInCart ? (
              <AppText variant="label" color={colors.text.inverse} style={styles.ctaText}>
                Retirer du panier (0 sélectionné)
              </AppText>
            ) : (
              <AppText variant="label" color={colors.text.subtle} style={styles.ctaText}>
                Sélectionnez au moins une option
              </AppText>
            )}
          </AppPressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 44,
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
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
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
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  previewImg: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
  },
  previewInfo: {
    flex: 1,
    gap: 2,
  },
  startingPrice: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  variantList: {
    flexGrow: 0,
    maxHeight: 320,
  },
  variantListContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing[2] + 4,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  variantRowDisabled: {
    opacity: 0.45,
    backgroundColor: colors.bg.subtle,
  },
  variantMeta: {
    flex: 1,
    gap: 3,
  },
  variantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedCheck: {
    width: 16,
    height: 16,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceTag: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    height: 36,
    paddingHorizontal: 3,
  },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
  },
  stepBtnDisabled: {
    opacity: 0.35,
    backgroundColor: 'transparent',
  },
  qtyBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontVariant: ['tabular-nums'],
  },
  outBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
  },
  ctaWrap: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radii.xl,
    gap: 8,
    overflow: 'hidden',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default VariantPickerSheet;
