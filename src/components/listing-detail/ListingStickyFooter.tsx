import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, Minus, Plus, Trash2, Lock, CreditCard } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';

interface ListingStickyFooterProps {
  cartQty: number;
  cartItemId?: string;
  onAddToCart: () => void;
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onBuyNow: () => void;
  isOwner?: boolean;
}

export const ListingStickyFooter: React.FC<ListingStickyFooterProps> = ({
  cartQty,
  cartItemId,
  onAddToCart,
  onUpdateQty,
  onRemoveFromCart,
  onBuyNow,
  isOwner = false,
}) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  const handleDecrement = () => {
    if (!cartItemId) return;
    if (cartQty <= 1) { onRemoveFromCart(cartItemId); return; }
    onUpdateQty(cartItemId, cartQty - 1);
  };

  const handleIncrement = () => {
    if (!cartItemId) return;
    onUpdateQty(cartItemId, cartQty + 1);
  };

  if (isOwner) {
    return (
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
        <View style={[styles.ownerBanner, { backgroundColor: accent[50], borderColor: accent[100] }]}>
          <AppText variant="caption" color={accent[700]} center>
            ✏️ Vous êtes le vendeur de cette annonce
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
      {/* Ligne 1 : stepper / Ajouter au panier */}
      <View style={styles.row}>
        {cartQty > 0 ? (
          <>
            <View style={[styles.stepper, { borderColor: accent[200], backgroundColor: accent[50] }]}>
              <AppPressable
                haptic="light"
                rippleBorderless
                onPress={handleDecrement}
                style={styles.stepBtn}
                accessibilityLabel={cartQty <= 1 ? 'Retirer du panier' : 'Diminuer la quantité'}
              >
                {cartQty <= 1
                  ? <Trash2 size={14} color={colors.status.error} />
                  : <Minus size={14} color={accent[700]} strokeWidth={2.5} />
                }
              </AppPressable>
              <AppText variant="bodyStrong" color={accent[800] ?? accent[700]} style={styles.qtyText}>
                {cartQty}
              </AppText>
              <AppPressable
                haptic="light"
                rippleBorderless
                onPress={handleIncrement}
                style={[styles.stepBtn, { backgroundColor: accent.DEFAULT }]}
                accessibilityLabel="Augmenter la quantité"
              >
                <Plus size={14} color={colors.text.inverse} strokeWidth={2.5} />
              </AppPressable>
            </View>
            <View style={styles.inCartLabel}>
              <AppText variant="overline" color={accent[700]}>
                ✓ Dans le panier
              </AppText>
            </View>
          </>
        ) : (
          <AppPressable
            haptic="light"
            onPress={onAddToCart}
            style={[styles.addBtn, { backgroundColor: accent.DEFAULT }]}
            accessibilityLabel="Ajouter au panier"
          >
            <ShoppingCart size={16} color={colors.text.inverse} strokeWidth={2} />
            <AppText variant="label" color={colors.text.inverse}>
              + Ajouter au panier
            </AppText>
          </AppPressable>
        )}
      </View>

      {/* Ligne 2 : Commander directement */}
      <AppPressable
        haptic="success"
        onPress={onBuyNow}
        style={[styles.buyBtn, { borderColor: accent[300] }]}
        accessibilityLabel="Commander avec paiement séquestre"
      >
        <CreditCard size={15} color={accent[700]} strokeWidth={2} />
        <AppText variant="label" color={accent[700]}>
          Commander directement (Paiement sécurisé)
        </AppText>
        <Lock size={13} color={accent[500] ?? accent[400]} />
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    gap: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  // ─── Stepper ───
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: 4,
    gap: 2,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inCartLabel: {
    flex: 1,
    alignItems: 'center',
  },
  // ─── Ajouter au panier (plein écran si pas en cart) ───
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radii.xl,
    gap: 7,
    overflow: 'hidden',
  },
  // ─── Commander directement ───
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    backgroundColor: colors.bg.surface,
    gap: 8,
    overflow: 'hidden',
    paddingHorizontal: spacing[3],
  },
  // ─── Owner ───
  ownerBanner: {
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
});
