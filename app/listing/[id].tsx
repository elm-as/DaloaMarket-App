import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListingDetail, useSimilarListings, useReviews } from '@daloa/api';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useAuth } from '../../src/context/AuthContext';
import { ListingVariant } from '@daloa/types';
import {
  colors,
  radii,
  spacing,
  Skeleton,
  ListingCard,
  AppText,
  AppPressable,
  useAccent,
  useResponsive,
} from '@daloa/ui';
import { Tag } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';
import { ListingPhotosGallery } from '../../src/components/listing-detail/ListingPhotosGallery';
import { ListingSellerBox } from '../../src/components/listing-detail/ListingSellerBox';
import { ListingStickyFooter } from '../../src/components/listing-detail/ListingStickyFooter';
import { ListingTrustBadges } from '../../src/components/listing-detail/ListingTrustBadges';
import { ListingReviewsSection } from '../../src/components/listing-detail/ListingReviewsSection';
import { VariantPickerSheet } from '../../src/components/listing-detail/VariantPickerSheet';

// ─── helpers ────────────────────────────────────────────────────────────────

const CONDITION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:      { label: 'Neuf',         color: colors.status.successDark, bg: colors.status.successLight },
  like_new: { label: 'Très bon état', color: colors.status.infoDark,   bg: colors.status.infoLight   },
  good:     { label: 'Bon état',      color: '#92400E',                  bg: '#FEF3C7'                 },
  used:     { label: 'Usagé',         color: colors.grey[600],           bg: colors.bg.subtle          },
};

function getCondition(raw: string | null | undefined) {
  return raw ? (CONDITION_LABELS[raw] ?? { label: raw, color: colors.grey[600], bg: colors.bg.subtle }) : null;
}

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=600';

const DESC_LIMIT = 220;

// ─── screen ─────────────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = useAccent();
  const { addToCart, updateQuantity, removeFromCart, items } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const { width: screenWidth } = useResponsive();

  const [selectedVariant, setSelectedVariant] = useState<ListingVariant | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);

  const isFavorite = id ? isFavorited(id) : false;

  const { data: listing, isLoading } = useListingDetail(id);
  const { data: similarItems } = useSimilarListings(listing?.category, id);
  const { data: reviews = [] } = useReviews('seller', listing?.seller?.id);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (isLoading || !listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.skeletonHeader}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.iconBtn}>
            <AppText variant="body">←</AppText>
          </AppPressable>
          <Skeleton width={160} height={18} borderRadius={6} />
          <View style={styles.iconBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.skeletonScroll}>
          <Skeleton width="100%" height={320} borderRadius={0} />
          <View style={{ padding: spacing[4], gap: spacing[3] }}>
            <Skeleton width="40%" height={28} borderRadius={6} />
            <Skeleton width="75%" height={22} borderRadius={6} />
            <Skeleton width="60%" height={16} borderRadius={6} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [FALLBACK_PHOTO];
  const seller = listing.seller;
  const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());
  const activePrice = selectedVariant?.price ?? listing.price;
  const variants = listing.variants || [];
  const cartItemId = `${listing.id}_${selectedVariant?.id || 'base'}`;
  const cartItem = items.find((i) => i.id === cartItemId);
  const cartQty = cartItem?.quantity || 0;
  const isOwner = isAuthenticated && user?.id === seller?.id;

  const conditionInfo = getCondition(listing.condition);
  const hasDiscount = listing.original_price != null && listing.original_price > activePrice;
  const discountPct = hasDiscount && listing.original_price
    ? Math.round(((listing.original_price - activePrice) / listing.original_price) * 100)
    : 0;
  const descLong = (listing.description || '').length > DESC_LIMIT;

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleShare = async () => {
    Haptics.lightImpact();
    await Share.share({
      title: listing.title,
      message: `🛍️ ${listing.title} à ${formatFCFA(activePrice)} sur DaloaMarket !\n👉 https://daloamarket.com/l/${listing.id.slice(0, 8)}`,
    });
  };

  const handleReport = () => {
    Alert.alert(
      'Signaler l\'annonce',
      'Pensez-vous que cette annonce est problématique ou frauduleuse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Signaler', style: 'destructive', onPress: () => Haptics.warning() },
      ]
    );
  };

  const handleAddToCart = () => {
    if (variants.length > 0) {
      // Ouvrir le picker de variantes
      setShowVariantPicker(true);
      return;
    }
    Haptics.lightImpact();
    addToCart(listing, null, 1);
  };

  const handleVariantConfirm = (variant: ListingVariant) => {
    setSelectedVariant(variant);
    setShowVariantPicker(false);
    Haptics.success();
    addToCart(listing, variant, 1);
  };
  const handleBuyNow = () => {
    Haptics.success();
    router.push({ pathname: '/checkout' as any, params: { listingId: listing.id, variantId: selectedVariant?.id || '', quantity: '1' } });
  };

  const handleMarkSold = () => {
    Alert.alert('Marquer comme vendu', 'Cette annonce sera retirée du catalogue.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Marquer vendu', style: 'destructive', onPress: () => Haptics.success() },
    ]);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ① Galerie avec nav flottante intégrée */}
        <ListingPhotosGallery
          photos={photos}
          screenWidth={screenWidth}
          isFavorite={isFavorite}
          onBack={() => router.back()}
          onShare={handleShare}
          onToggleFavorite={() => id && toggleFavorite(id)}
          onReport={handleReport}
        />

        {/* ② Bloc info principal */}
        <View style={styles.detailsContainer}>

          {/* Prix + badge réduction */}
          <View style={styles.priceRow}>
            <AppText variant="h1" color={accent[600]} style={styles.priceText}>
              {formatFCFA(activePrice)}
            </AppText>
            {hasDiscount && listing.original_price && (
              <AppText variant="body" color={colors.text.subtle} style={styles.originalPrice}>
                {formatFCFA(listing.original_price)}
              </AppText>
            )}
            {hasDiscount && discountPct > 0 && (
              <View style={styles.discountBadge}>
                <Tag size={10} color={colors.text.inverse} />
                <AppText variant="overline" color={colors.text.inverse}>
                  -{discountPct}%
                </AppText>
              </View>
            )}
          </View>

          {/* Titre */}
          <AppText variant="title" style={styles.listingTitle}>
            {listing.title}
          </AppText>

          {/* Chips : condition + quartier + livraison */}
          <View style={styles.tagsRow}>
            {conditionInfo && (
              <View style={[styles.tag, { backgroundColor: conditionInfo.bg }]}>
                <AppText variant="caption" color={conditionInfo.color} style={styles.tagText}>
                  {conditionInfo.label}
                </AppText>
              </View>
            )}
            {listing.district && (
              <View style={styles.tag}>
                <AppText variant="caption" color={colors.grey[600]}>
                  📍 {listing.district}
                </AppText>
              </View>
            )}
            <View style={[styles.tag, styles.deliveryTag]}>
              <AppText variant="caption" color={colors.status.successDark}>
                🚚 Livraison Daloa
              </AppText>
            </View>
          </View>

          {/* Variantes — signal visuel si options dispo */}
          {variants.length > 0 && (
            <AppPressable
              haptic="selection"
              onPress={() => setShowVariantPicker(true)}
              style={[styles.variantBanner, { borderColor: accent[200], backgroundColor: accent[50] }]}
              accessibilityLabel="Choisir une option"
            >
              <View style={styles.variantBannerLeft}>
                <AppText variant="label" color={accent[700]}>
                  {selectedVariant ? `Option : ${selectedVariant.label}` : 'Choisir une option'}
                </AppText>
                {selectedVariant?.price != null && (
                  <AppText variant="caption" color={accent[600]}>
                    {formatFCFA(selectedVariant.price)}
                  </AppText>
                )}
                {!selectedVariant && (
                  <AppText variant="caption" color={accent[500] ?? accent[600]}>
                    {variants.length} option{variants.length > 1 ? 's' : ''} disponible{variants.length > 1 ? 's' : ''}
                  </AppText>
                )}
              </View>
              <View style={[styles.variantBannerBadge, { backgroundColor: accent.DEFAULT }]}>
                <AppText variant="overline" color={colors.text.inverse}>
                  {selectedVariant ? 'Modifier' : 'Choisir'}
                </AppText>
              </View>
            </AppPressable>
          )}

          {/* Description avec collapse */}
          {listing.description ? (
            <View style={styles.sectionCard}>
              <AppText variant="overline" color={colors.text.muted} style={styles.overline}>
                Description de l'article
              </AppText>
              <AppText variant="body" color={colors.grey[600]}>
                {descExpanded || !descLong
                  ? listing.description
                  : `${listing.description.slice(0, DESC_LIMIT)}...`}
              </AppText>
              {descLong && (
                <AppPressable
                  haptic="selection"
                  onPress={() => setDescExpanded((p) => !p)}
                  style={styles.readMoreBtn}
                >
                  <AppText variant="label" color={accent[600]}>
                    {descExpanded ? 'Voir moins ↑' : 'Lire toute la description ↓'}
                  </AppText>
                </AppPressable>
              )}
            </View>
          ) : null}

          {/* ③ Trust badges */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionOverline}>
            Garanties & livraison
          </AppText>
          <ListingTrustBadges />

          {/* ④ Seller card */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionOverline}>
            Le vendeur
          </AppText>
          <ListingSellerBox seller={seller} isPro={isPro} />

          {/* ⑤ Contrôles propriétaire */}
          {isOwner && (
            <View style={styles.ownerCard}>
              <AppText variant="label" color={colors.text.body} style={styles.sectionSubtitle}>
                Gestion de votre annonce
              </AppText>
              <View style={styles.ownerButtons}>
                <AppPressable
                  onPress={handleMarkSold}
                  style={[styles.ownerBtn, { backgroundColor: accent.DEFAULT }]}
                >
                  <AppText variant="label" color={colors.text.inverse}>
                    Marquer vendu
                  </AppText>
                </AppPressable>
                <AppPressable
                  onPress={() => router.push(`/listing/create?id=${listing.id}` as any)}
                  style={[styles.ownerBtn, styles.ownerBtnOutline, { borderColor: accent[300] }]}
                >
                  <AppText variant="label" color={accent[700]}>
                    Modifier
                  </AppText>
                </AppPressable>
              </View>
            </View>
          )}

          {/* ⑥ Avis acheteurs */}
          <ListingReviewsSection reviews={reviews} avgRating={avgRating} />

          {/* ⑦ Annonces similaires — grille 2 colonnes */}
          {similarItems && similarItems.length > 0 && (
            <View>
              <AppText variant="overline" color={colors.text.muted} style={styles.sectionOverline}>
                Dans la même catégorie
              </AppText>
              <View style={styles.similarGrid}>
                {similarItems.map((simItem: any) => (
                  <View key={simItem.id} style={styles.similarCell}>
                    <ListingCard
                      listing={{
                        id: simItem.id,
                        title: simItem.title,
                        price: simItem.price,
                        photos: simItem.photos,
                        district: simItem.district,
                        createdAt: simItem.created_at,
                      }}
                      onPress={() => router.push(`/listing/${simItem.id}` as any)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Picker variantes */}
      {variants.length > 0 && (
        <VariantPickerSheet
          visible={showVariantPicker}
          onClose={() => setShowVariantPicker(false)}
          onConfirm={handleVariantConfirm}
          variants={variants}
          listingTitle={listing.title}
          listingPhoto={photos[0]}
          basePrice={listing.price}
        />
      )}

      {/* Sticky footer */}
      <ListingStickyFooter
        cartQty={cartQty}
        cartItemId={cartItemId}
        onAddToCart={handleAddToCart}
        onUpdateQty={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onBuyNow={handleBuyNow}
        isOwner={isOwner}
      />
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.surface,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonScroll: {
    paddingBottom: spacing[8],
  },
  scrollContent: {
    backgroundColor: colors.bg.DEFAULT,
  },
  detailsContainer: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  priceText: {
    fontVariant: ['tabular-nums'],
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.status.error,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  listingTitle: {
    marginTop: spacing[1],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing[2],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.md,
    gap: 4,
  },
  tagText: {
    fontWeight: '600',
  },
  deliveryTag: {
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
  },
  variantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  variantBannerLeft: {
    flex: 1,
    gap: 2,
  },
  variantBannerBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.lg,
    flexShrink: 0,
  },
  sectionCard: {
    marginTop: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[3],
    gap: spacing[2],
  },
  overline: {
    paddingHorizontal: 2,
  },
  sectionOverline: {
    marginTop: spacing[4],
    marginBottom: spacing[1],
    paddingHorizontal: 2,
  },
  sectionSubtitle: {
    marginBottom: spacing[2],
  },
  readMoreBtn: {
    marginTop: spacing[2],
    alignSelf: 'flex-start',
  },
  ownerCard: {
    marginTop: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primary[100],
    padding: spacing[3],
    gap: spacing[2],
  },
  ownerButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  ownerBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ownerBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  similarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginHorizontal: -5,
  },
  similarCell: {
    width: '50%',
    paddingHorizontal: 5,
  },
  bottomSpacer: {
    height: spacing[6],
  },
});
