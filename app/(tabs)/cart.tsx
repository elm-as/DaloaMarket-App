import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { colors, radii, spacing, typography, Button, EmptyState, CurrencyText, Card } from '@daloa/ui';
import { Plus, Minus, Trash2, ShieldCheck, ShoppingBag, Truck } from 'lucide-react-native';
import { PRICING_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';

export default function CartScreen() {
  const router = useRouter();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();

  const buyerServiceFee = Math.round(totalAmount * PRICING_CONFIG.marketplace.buyerServiceFeeRate);
  const estimatedDeliveryFee = items.length > 0 ? PRICING_CONFIG.delivery.baseFee : 0;
  const grandTotal = totalAmount + buyerServiceFee + estimatedDeliveryFee;

  const handleCheckout = () => {
    if (items.length === 0) return;
    Haptics.lightImpact();
    // Utiliser le premier article pour le tunnel de commande escrow
    const firstItem = items[0];
    router.push({
      pathname: '/checkout',
      params: {
        listingId: firstItem.listing.id,
        variantId: firstItem.variant?.id || '',
        quantity: firstItem.quantity.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Mon Panier</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
            <Text style={styles.clearText}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={32} color={colors.market.primary} />}
          title="Votre panier est vide"
          description="Découvrez des milliers d'articles neufs et d'occasion disponibles près de chez vous à Daloa."
          actionTitle="Explorer les annonces"
          onActionPress={() => router.push('/(tabs)/index')}
        />
      ) : (
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
            {/* Liste des articles */}
            {items.map((item) => {
              const unitPrice = item.variant?.price ?? item.listing.price;
              const photoUrl = item.listing.photos?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

              return (
                <Card key={item.id} style={styles.itemCard}>
                  <Image source={{ uri: photoUrl }} style={styles.itemImage} resizeMode="cover" />

                  <View style={styles.itemDetails}>
                    <View style={styles.itemTop}>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.listing.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeFromCart(item.id)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} color={colors.status.error} />
                      </TouchableOpacity>
                    </View>

                    {item.variant && (
                      <Text style={styles.variantText}>
                        Option : {item.variant.label}
                      </Text>
                    )}

                    <View style={styles.itemBottom}>
                      <CurrencyText
                        amount={unitPrice}
                        size="base"
                        weight="bold"
                        color={colors.market.primary}
                      />

                      {/* Sélecteur de Quantité */}
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                          style={styles.qtyBtn}
                        >
                          <Minus size={14} color={colors.dark.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                          style={styles.qtyBtn}
                        >
                          <Plus size={14} color={colors.dark.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}

            {/* Garantie Séquestre */}
            <View style={styles.guaranteeBox}>
              <ShieldCheck size={20} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>Garantie Séquestre Escrow DaloaMarket</Text>
                <Text style={styles.guaranteeSub}>
                  Votre argent est conservé en lieu sûr. Le vendeur et le livreur ne sont payés qu'après votre confirmation de livraison par code OTP.
                </Text>
              </View>
            </View>

            {/* Récapitulatif Financier */}
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Détail de la commande</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total articles</Text>
                <CurrencyText amount={totalAmount} size="sm" weight="semibold" color={colors.dark.text} />
              </View>

              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Truck size={14} color={colors.dark.textDim} />
                  <Text style={styles.summaryLabel}>Frais de livraison estimé</Text>
                </View>
                <CurrencyText amount={estimatedDeliveryFee} size="sm" weight="semibold" color={colors.dark.text} />
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de service Escrow (3%)</Text>
                <CurrencyText amount={buyerServiceFee} size="sm" weight="semibold" color={colors.dark.text} />
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <CurrencyText amount={grandTotal} size="xl" weight="bold" color={colors.market.primary} />
              </View>
            </Card>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Action Sticky Bottom */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.bottomTotalLabel}>Total TTC</Text>
              <CurrencyText amount={grandTotal} size="lg" weight="bold" color={colors.market.primary} />
            </View>
            <Button
              title="Passer commande"
              variant="market"
              size="lg"
              onPress={handleCheckout}
              style={styles.checkoutBtn}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  clearText: {
    color: colors.status.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  content: {
    flex: 1,
  },
  scrollList: {
    padding: spacing[4],
  },
  itemCard: {
    flexDirection: 'row',
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    backgroundColor: colors.dark.surfaceRaised,
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing[3],
    justifyContent: 'space-between',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
    marginRight: spacing[2],
  },
  deleteBtn: {
    padding: 4,
  },
  variantText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    paddingHorizontal: 6,
  },
  guaranteeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: radii.xl,
    padding: spacing[3],
    gap: spacing[3],
    marginVertical: spacing[3],
  },
  guaranteeTitle: {
    color: '#10B981',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  guaranteeSub: {
    color: colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  summaryCard: {
    padding: spacing[4],
    gap: spacing[3],
  },
  summaryTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: spacing[3],
    marginTop: spacing[1],
  },
  totalLabel: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  bottomTotalLabel: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  checkoutBtn: {
    minWidth: 180,
  },
});
