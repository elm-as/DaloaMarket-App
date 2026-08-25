import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useListingDetail, ordersService, paymentService } from '@daloa/api';
import { DALOA_DISTRICTS, MOBILE_MONEY_NETWORKS } from '@daloa/config';
import { calculateOrderBreakdown } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Input,
  Button,
  Card,
  CurrencyText,
  Badge,
} from '@daloa/ui';
import {
  ShieldCheck,
  Truck,
  MapPin,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function CheckoutScreen() {
  const { listingId, variantId, quantity: qtyParam } = useLocalSearchParams<{
    listingId: string;
    variantId?: string;
    quantity?: string;
  }>();

  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuth();
  const { data: listing, isLoading } = useListingDetail(listingId);

  const quantity = parseInt(qtyParam || '1', 10) || 1;
  const variant = listing?.variants?.find((v) => v.id === variantId);
  const activePrice = variant?.price ?? listing?.price ?? 0;

  // Form State
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(profile?.district || 'Lobia');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(profile?.address || '');
  const [buyerPhone, setBuyerPhone] = useState<string>(profile?.phone || '');
  const [buyerNotes, setBuyerNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov' | 'cash_on_delivery'>('wave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPro = Boolean(listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date());
  const breakdown = calculateOrderBreakdown({
    productPrice: activePrice,
    quantity,
    distanceKm: 2.5, // Distance moyenne standard
    isProSeller: isPro,
    deliveryMode,
    deliveryFeeOverride: listing?.delivery_fee_override,
  });

  const handleConfirmOrder = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (!buyerPhone.trim() || buyerPhone.length < 8) {
      setErrorMsg('Veuillez renseigner votre numéro de téléphone de contact');
      return;
    }

    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Veuillez préciser votre adresse ou un repère à Daloa');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // 1. Création de la commande Escrow
      const order = await ordersService.createOrder(user.id, {
        listing_id: listingId,
        variant_id: variantId || null,
        variant_label: variant?.label || null,
        quantity,
        delivery_mode: deliveryMode,
        payment_method: paymentMethod,
        delivery_address: deliveryAddress.trim() || 'Remise en main propre',
        delivery_district: deliveryDistrict,
        buyer_phone: buyerPhone.trim(),
        buyer_notes: buyerNotes.trim() || undefined,
      });

      // 2. Déclenchement de l'intention de paiement si Mobile Money
      if (paymentMethod !== 'cash_on_delivery') {
        await paymentService.createPaymentIntent({
          orderId: order.id,
          amount: breakdown.totalAmount,
          customerPhone: buyerPhone.trim(),
          customerName: profile?.full_name || 'Client DaloaMarket',
          network: paymentMethod as any,
        });
      }

      Haptics.success();
      router.replace(`/order/${order.id}`);
    } catch (err: any) {
      console.error('Erreur commande:', err);
      setErrorMsg(err.message || 'Échec de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !listing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Commander" onBack={() => router.back()} />
        <View style={{ padding: spacing[4] }}>
          <Text style={{ color: colors.dark.text }}>Chargement de la commande...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photoUrl = listing.photos?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Tunnel de Commande Sécurisé" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Résumé de l'article commandé */}
        <Card style={styles.listingCard}>
          <Image source={{ uri: photoUrl }} style={styles.listingImage} resizeMode="cover" />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            {variant && <Text style={styles.variantTag}>Option : {variant.label}</Text>}
            <View style={styles.priceRow}>
              <CurrencyText amount={activePrice} size="base" weight="bold" color={colors.market.primary} />
              <Text style={styles.qtyText}>x{quantity}</Text>
            </View>
          </View>
        </Card>

        {/* Mode de Réception */}
        <Text style={styles.sectionTitle}>Mode de réception</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selection();
              setDeliveryMode('delivery');
            }}
            style={[styles.modeCard, deliveryMode === 'delivery' && styles.modeCardActive]}
          >
            <Truck size={20} color={deliveryMode === 'delivery' ? colors.market.primary : colors.dark.textDim} />
            <Text style={[styles.modeTitle, deliveryMode === 'delivery' && styles.modeTitleActive]}>
              Livraison à Daloa
            </Text>
            <Text style={styles.modeSub}>Par un coursier DaloaDelivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selection();
              setDeliveryMode('pickup');
            }}
            style={[styles.modeCard, deliveryMode === 'pickup' && styles.modeCardActive]}
          >
            <MapPin size={20} color={deliveryMode === 'pickup' ? colors.market.primary : colors.dark.textDim} />
            <Text style={[styles.modeTitle, deliveryMode === 'pickup' && styles.modeTitleActive]}>
              Retrait boutique
            </Text>
            <Text style={styles.modeSub}>Chez le vendeur directement</Text>
          </TouchableOpacity>
        </View>

        {/* Adresse de Livraison */}
        {deliveryMode === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quartier de livraison à Daloa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {DALOA_DISTRICTS.slice(0, 15).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    Haptics.selection();
                    setDeliveryDistrict(d);
                  }}
                  style={[styles.chip, deliveryDistrict === d && styles.chipActive]}
                >
                  <Text style={[styles.chipText, deliveryDistrict === d && styles.chipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              label="Adresse précise ou point de repère *"
              placeholder="Ex: Près de la Pharmacie Lobia, Maison clôturée bleue"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
            />
          </View>
        )}

        {/* Contact Acheteur */}
        <Input
          label="Numéro de téléphone pour la livraison *"
          placeholder="Ex: 07 01 02 03 04"
          value={buyerPhone}
          onChangeText={setBuyerPhone}
          keyboardType="phone-pad"
        />

        {/* Mode de Paiement */}
        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        <View style={styles.paymentGrid}>
          {MOBILE_MONEY_NETWORKS.map((net) => {
            const isSelected = paymentMethod === net.id;
            return (
              <TouchableOpacity
                key={net.id}
                onPress={() => {
                  Haptics.selection();
                  setPaymentMethod(net.id as any);
                }}
                style={[styles.paymentCard, isSelected && styles.paymentCardActive]}
              >
                <View style={[styles.networkDot, { backgroundColor: net.color }]} />
                <Text style={[styles.paymentText, isSelected && styles.paymentTextActive]}>
                  {net.name}
                </Text>
                {isSelected && <CheckCircle2 size={16} color={colors.market.primary} />}
              </TouchableOpacity>
            );
          })}

          {listing.seller?.cash_on_delivery_enabled && (
            <TouchableOpacity
              onPress={() => {
                Haptics.selection();
                setPaymentMethod('cash_on_delivery');
              }}
              style={[styles.paymentCard, paymentMethod === 'cash_on_delivery' && styles.paymentCardActive]}
            >
              <Text style={styles.paymentText}>Paiement à la livraison (Espèces)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Récapitulatif Tarifaire Escrow */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ShieldCheck size={18} color="#10B981" />
            <Text style={styles.summaryTitle}>Garantie Séquestre Escrow</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total article</Text>
            <CurrencyText amount={breakdown.productSubtotal} size="sm" color={colors.dark.text} />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <CurrencyText amount={breakdown.deliveryFee} size="sm" color={colors.dark.text} />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de protection Escrow (3%)</Text>
            <CurrencyText amount={breakdown.buyerServiceFee} size="sm" color={colors.dark.text} />
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <CurrencyText amount={breakdown.totalAmount} size="xl" weight="extrabold" color={colors.market.primary} />
          </View>
        </Card>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        {/* Bouton de Validation */}
        <Button
          title={`Payer ${breakdown.totalAmount} FCFA en Séquestre`}
          variant="market"
          size="lg"
          loading={isSubmitting}
          onPress={handleConfirmOrder}
          leftIcon={<Lock size={18} color="#FFFFFF" />}
          style={styles.confirmBtn}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
  },
  listingCard: {
    flexDirection: 'row',
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  listingImage: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.dark.surfaceRaised,
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  listingTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  variantTag: {
    color: colors.dark.textDim,
    fontSize: 11,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  section: {
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    padding: spacing[3],
    gap: 4,
  },
  modeCardActive: {
    borderColor: colors.market.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  modeTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  modeTitleActive: {
    color: colors.market.primary,
    fontWeight: typography.weights.bold,
  },
  modeSub: {
    color: colors.dark.textDim,
    fontSize: 11,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  chip: {
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  chipActive: {
    backgroundColor: colors.market.primary,
    borderColor: colors.market.primary,
  },
  chipText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  paymentGrid: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    gap: spacing[3],
  },
  paymentCardActive: {
    borderColor: colors.market.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  paymentText: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  paymentTextActive: {
    fontWeight: typography.weights.bold,
  },
  summaryCard: {
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: spacing[2],
  },
  summaryTitle: {
    color: '#10B981',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: spacing[2],
  },
  totalLabel: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  confirmBtn: {
    marginTop: spacing[2],
  },
});
