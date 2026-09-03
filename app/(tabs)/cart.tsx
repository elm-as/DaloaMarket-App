import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../src/context/CartContext';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  EmptyState,
  useAccent,
} from '@daloa/ui';
import { ArrowLeft, ShoppingCart, ShoppingBag, Trash2 } from 'lucide-react-native';
import { PRICING_CONFIG } from '@daloa/config';
import { formatFCFA, Haptics } from '@daloa/utils';
import { CartItemCard } from '../../src/components/cart/CartItemCard';
import { CartSummaryCard } from '../../src/components/cart/CartSummaryCard';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();

  const buyerServiceFee = Math.round(totalAmount * PRICING_CONFIG.marketplace.buyerServiceFeeRate);
  const estimatedDeliveryFee = items.length > 0 ? PRICING_CONFIG.delivery.baseFee : 0;
  const grandTotal = totalAmount + buyerServiceFee + estimatedDeliveryFee;

  const handleCheckout = () => {
    if (items.length === 0) return;
    Haptics.success();
    // Mode panier : le checkout lit tous les articles depuis le CartContext.
    router.push({ pathname: '/checkout' as any, params: { cart: '1' } });
  };

  return (
    <View style={styles.container}>
      {/* 1. Hero dégradé */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroBanner, { paddingTop: insets.top + spacing[2] }]}
      >
        <View style={styles.heroRow}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>

          <View style={styles.heroCenter}>
            <View style={styles.heroIconCircle}>
              <ShoppingCart size={20} color={colors.text.inverse} strokeWidth={1.8} />
            </View>
            <View>
              <AppText variant="overline" color={accent[100]}>VOTRE SÉLECTION</AppText>
              <AppText variant="title" color={colors.text.inverse}>Mon panier</AppText>
            </View>
          </View>

          {items.length > 0 ? (
            <View style={styles.countBadge}>
              <AppText variant="caption" color={colors.text.inverse}>
                {items.length} art.
              </AppText>
            </View>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        {items.length > 0 && (
          <View style={styles.heroTotal}>
            <AppText variant="caption" color={accent[100]}>Total estimé</AppText>
            <AppText variant="h2" color={colors.text.inverse} style={styles.heroTotalAmount}>
              {formatFCFA(grandTotal)}
            </AppText>
          </View>
        )}
      </LinearGradient>

      {/* 2. Contenu */}
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<ShoppingBag size={34} color={accent.DEFAULT} />}
            title="Votre panier est vide"
            description="Découvrez des milliers d'articles neufs et d'occasion disponibles immédiatement à Daloa."
            actionTitle="Explorer les annonces"
            onActionPress={() => router.push('/(tabs)' as any)}
            actionVariant="market"
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
          {/* Actions globales */}
          <View style={styles.topActionsRow}>
            <AppText variant="bodyStrong" color={colors.text.body}>
              Articles sélectionnés ({items.length})
            </AppText>
            <AppPressable
              haptic="none"
              onPress={() => {
                Haptics.warning();
                clearCart();
              }}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Vider le panier"
            >
              <Trash2 size={13} color={colors.text.subtle} />
              <AppText variant="caption" color={colors.text.subtle}>
                Vider tout
              </AppText>
            </AppPressable>
          </View>

          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQty={(newQty) => updateQuantity(item.id, newQty)}
              onRemove={() => removeFromCart(item.id)}
            />
          ))}

          <CartSummaryCard
            subtotal={totalAmount}
            deliveryFee={estimatedDeliveryFee}
            serviceFee={buyerServiceFee}
            grandTotal={grandTotal}
            itemCount={items.length}
            onCheckout={handleCheckout}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  heroBanner: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: spacing[3],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginLeft: spacing[1],
  },
  heroIconCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTotal: {
    paddingHorizontal: spacing[2],
  },
  heroTotalAmount: {
    fontVariant: ['tabular-nums'],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    minWidth: 48,
    alignItems: 'center',
  },
  scrollList: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[8],
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
    paddingHorizontal: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
