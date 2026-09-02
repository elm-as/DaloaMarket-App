import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Animated,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, ShoppingCart } from 'lucide-react-native';
import { AppText, AppPressable, colors, radii, spacing, useAccent } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';
import { ListingVariant } from '@daloa/types';

const FALLBACK =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=120';

interface VariantPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Appelé quand l'utilisateur confirme : variante choisie */
  onConfirm: (variant: ListingVariant) => void;
  variants: ListingVariant[];
  listingTitle: string;
  listingPhoto?: string;
  basePrice: number;
}

export const VariantPickerSheet: React.FC<VariantPickerSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  variants,
  listingTitle,
  listingPhoto,
  basePrice,
}) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const slideY = useRef(new Animated.Value(600)).current;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      Animated.spring(slideY, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? null;

  const handleConfirm = () => {
    if (!selectedVariant) return;
    onConfirm(selectedVariant);
  };

  const displayPrice = selectedVariant?.price ?? basePrice;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, spacing[4]), transform: [{ translateY: slideY }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <AppText variant="title" style={styles.headerTitle}>
            Choisir une option
          </AppText>
          <AppPressable
            onPress={onClose}
            rippleBorderless
            style={styles.closeBtn}
            accessibilityLabel="Fermer"
          >
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
            <AppText variant="h2" color={accent[600]} style={styles.previewPrice}>
              {formatFCFA(displayPrice)}
            </AppText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Liste des variantes */}
        <ScrollView
          style={styles.variantList}
          contentContainerStyle={styles.variantListContent}
          showsVerticalScrollIndicator={false}
        >
          {variants.map((v) => {
            const isSelected = v.id === selectedId;
            const outOfStock = (v.stock ?? 1) <= 0;
            const variantPrice = v.price ?? basePrice;

            return (
              <AppPressable
                key={v.id}
                haptic="selection"
                onPress={() => { if (!outOfStock && v.id) setSelectedId(v.id); }}
                style={[
                  styles.variantRow,
                  isSelected && { borderColor: accent[300], backgroundColor: accent[50] },
                  outOfStock && styles.variantRowDisabled,
                ]}
                accessibilityLabel={`Option ${v.label}`}
                accessibilityState={{ disabled: outOfStock, selected: isSelected }}
              >
                {/* Radio circle */}
                <View style={[
                  styles.radio,
                  isSelected && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                  outOfStock && styles.radioDisabled,
                ]}>
                  {isSelected && <Check size={12} color={colors.text.inverse} strokeWidth={3} />}
                </View>

                {/* Label + stock */}
                <View style={styles.variantMeta}>
                  <AppText
                    variant="bodyStrong"
                    color={outOfStock ? colors.text.subtle : isSelected ? accent[800] ?? accent[700] : colors.text.body}
                    style={outOfStock && { textDecorationLine: 'line-through' }}
                  >
                    {v.label}
                  </AppText>
                  {outOfStock ? (
                    <AppText variant="caption" color={colors.text.subtle}>Épuisé</AppText>
                  ) : v.stock != null && v.stock < 5 ? (
                    <AppText variant="caption" color={colors.status.warning ?? '#F59E0B'}>
                      Plus que {v.stock} en stock
                    </AppText>
                  ) : null}
                </View>

                {/* Prix */}
                <AppText
                  variant="bodyStrong"
                  color={isSelected ? accent[700] : colors.text.body}
                  style={styles.variantPrice}
                >
                  {formatFCFA(variantPrice)}
                </AppText>
              </AppPressable>
            );
          })}
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <AppPressable
            haptic="success"
            onPress={handleConfirm}
            disabled={!selectedVariant}
            rippleColor="rgba(255,255,255,0.24)"
            style={[
              styles.ctaBtn,
              selectedVariant
                ? { backgroundColor: accent.DEFAULT }
                : { backgroundColor: colors.grey[300] },
            ]}
            accessibilityLabel="Ajouter au panier"
          >
            <ShoppingCart size={18} color={colors.text.inverse} strokeWidth={2} />
            <AppText variant="label" color={colors.text.inverse} style={styles.ctaText}>
              {selectedVariant ? `Ajouter — ${formatFCFA(displayPrice)}` : 'Choisissez une option'}
            </AppText>
          </AppPressable>
        </View>
      </Animated.View>
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
    maxHeight: '82%',
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
  },
  headerTitle: {
    flex: 1,
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
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
  },
  previewInfo: {
    flex: 1,
    gap: 2,
  },
  previewPrice: {
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  variantList: {
    flexGrow: 0,
    maxHeight: 300,
  },
  variantListContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    gap: spacing[3],
  },
  variantRowDisabled: {
    opacity: 0.45,
    backgroundColor: colors.bg.subtle,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDisabled: {
    borderColor: colors.border.subtle,
  },
  variantMeta: {
    flex: 1,
    gap: 1,
  },
  variantPrice: {
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  ctaWrap: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: radii.xl,
    gap: 8,
    overflow: 'hidden',
  },
  ctaText: {
    fontSize: 15,
  },
});
