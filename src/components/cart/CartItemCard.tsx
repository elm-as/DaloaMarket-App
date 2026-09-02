import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Trash2, Plus, Minus } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { formatFCFA, Haptics } from '@daloa/utils';
import { CartItem } from '../../context/CartContext';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQty: (newQty: number) => void;
  onRemove: () => void;
}

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQty, onRemove }) => {
  const accent = useAccent();
  const photo = item.listing.photos?.[0] || FALLBACK_PHOTO;
  const price = item.variant?.price ?? item.listing.price;
  const lineTotal = price * item.quantity;
  const maxStock = item.variant?.stock ?? item.listing.stock ?? 99;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{ uri: photo }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
              {item.listing.title}
            </AppText>
            <AppPressable
              haptic="none"
              rippleBorderless
              onPress={() => {
                Haptics.warning();
                onRemove();
              }}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel="Retirer du panier"
            >
              <Trash2 size={15} color={colors.text.subtle} />
            </AppPressable>
          </View>

          {item.variant?.label && (
            <View style={styles.variantBadge}>
              <AppText variant="caption" color={colors.grey[600]}>
                {item.variant.label}
              </AppText>
            </View>
          )}

          <View style={styles.bottomRow}>
            <View>
              <AppText variant="bodyStrong" color={accent[600]} style={styles.unitPrice}>
                {formatFCFA(price)}
              </AppText>
              {item.quantity > 1 && (
                <AppText variant="caption" color={colors.text.muted} style={styles.lineTotal}>
                  Total: {formatFCFA(lineTotal)}
                </AppText>
              )}
            </View>

            <View style={[styles.stepperBox, { backgroundColor: accent[50], borderColor: accent[200] }]}>
              <AppPressable
                haptic="selection"
                rippleBorderless
                onPress={() => onUpdateQty(item.quantity - 1)}
                style={styles.stepperBtn}
                accessibilityRole="button"
                accessibilityLabel="Diminuer la quantité"
              >
                <Minus size={13} color={accent[600]} strokeWidth={2.5} />
              </AppPressable>

              <AppText variant="bodyStrong" style={styles.qtyText}>
                {item.quantity}
              </AppText>

              <AppPressable
                haptic="selection"
                rippleBorderless
                disabled={item.quantity >= maxStock}
                onPress={() => item.quantity < maxStock && onUpdateQty(item.quantity + 1)}
                style={[styles.stepperBtn, item.quantity >= maxStock && styles.stepperBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Augmenter la quantité"
              >
                <Plus
                  size={13}
                  color={item.quantity >= maxStock ? colors.text.subtle : accent[600]}
                  strokeWidth={2.5}
                />
              </AppPressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  title: {
    flex: 1,
  },
  deleteBtn: {
    padding: 2,
  },
  variantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  unitPrice: {
    fontVariant: ['tabular-nums'],
  },
  lineTotal: {
    fontVariant: ['tabular-nums'],
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  qtyText: {
    paddingHorizontal: 7,
    fontVariant: ['tabular-nums'],
  },
});
