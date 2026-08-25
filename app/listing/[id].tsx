import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListingDetail, useSimilarListings, useReviews } from '@daloa/api';
import { useCart } from '../../src/context/CartContext';
import { ListingVariant } from '@daloa/types';
import {
  colors,
  radii,
  spacing,
  typography,
  Button,
  Avatar,
  RatingStars,
  CurrencyText,
  Badge,
  Skeleton,
  Header,
  Card,
} from '@daloa/ui';
import {
  ShieldCheck,
  Truck,
  MapPin,
  Share2,
  Heart,
  MessageCircle,
  ShoppingBag,
  Store,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { formatWhatsAppPhone, formatDate, Haptics } from '@daloa/utils';
import { ListingCard } from '../../src/components/ListingCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ListingVariant | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: listing, isLoading, error } = useListingDetail(id);
  const { data: similarItems } = useSimilarListings(listing?.category, id);
  const { data: reviews } = useReviews('listing', id);

  if (isLoading || !listing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Détail de l'annonce" onBack={() => router.back()} />
        <ScrollView style={{ padding: spacing[4] }}>
          <Skeleton height={300} borderRadius={radii['2xl']} />
          <View style={{ height: spacing[4] }} />
          <Skeleton height={30} width="70%" />
          <View style={{ height: spacing[2] }} />
          <Skeleton height={24} width="40%" />
          <View style={{ height: spacing[4] }} />
          <Skeleton height={80} borderRadius={radii.xl} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'];
  const seller = listing.seller;
  const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());
  const activePrice = selectedVariant?.price ?? listing.price;
  const variants = listing.variants || [];

  const handleShare = async () => {
    Haptics.lightImpact();
    const shareUrl = `https://daloamarket.com/l/${listing.id.slice(0, 8)}`;
    await Share.share({
      title: listing.title,
      message: `🛍️ ${listing.title} à ${activePrice} FCFA sur DaloaMarket !\n👉 ${shareUrl}`,
    });
  };

  const handleWhatsApp = () => {
    Haptics.success();
    const phone = formatWhatsAppPhone(seller?.phone);
    if (!phone) return;
    const text = encodeURIComponent(
      `Bonjour ${seller?.shop_name || seller?.full_name || 'Vendeur'}, je suis intéressé(e) par votre article "${listing.title}" à ${activePrice} FCFA sur DaloaMarket.`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${text}`);
  };

  const handleAddToCart = () => {
    addToCart(listing, selectedVariant, 1);
  };

  const handleBuyNow = () => {
    Haptics.success();
    router.push({
      pathname: '/checkout',
      params: {
        listingId: listing.id,
        variantId: selectedVariant?.id || '',
        quantity: '1',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <Header
        title={listing.title}
        onBack={() => router.back()}
        rightAction={
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
              <Share2 size={18} color={colors.dark.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.lightImpact();
                setIsFavorite(!isFavorite);
              }}
              style={styles.headerIconBtn}
            >
              <Heart
                size={18}
                color={isFavorite ? colors.status.error : colors.dark.text}
                fill={isFavorite ? colors.status.error : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Carrousel Photos */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActivePhotoIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Indicateur de pagination */}
          {photos.length > 1 && (
            <View style={styles.paginationBadge}>
              <Text style={styles.paginationText}>
                {activePhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}
        </View>

        {/* Détails Principaux */}
        <View style={styles.detailsContainer}>
          {/* Prix & Titre */}
          <View style={styles.priceRow}>
            <CurrencyText
              amount={activePrice}
              size="3xl"
              weight="extrabold"
              color={colors.market.primary}
            />
            {listing.original_price && listing.original_price > listing.price && (
              <Text style={styles.originalPrice}>
                {listing.original_price} FCFA
              </Text>
            )}
          </View>

          <Text style={styles.listingTitle}>{listing.title}</Text>

          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <MapPin size={12} color={colors.market.primary} />
              <Text style={styles.tagText}>{listing.district || 'Daloa'}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>État : {listing.condition}</Text>
            </View>
            {listing.accepts_delivery && (
              <View style={[styles.tag, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Truck size={12} color="#10B981" />
                <Text style={[styles.tagText, { color: '#10B981' }]}>Livraison Daloa</Text>
              </View>
            )}
          </View>

          {/* Variantes (Couleurs, Tailles) si existantes */}
          {variants.length > 0 && (
            <View style={styles.variantsSection}>
              <Text style={styles.sectionSubtitle}>Choisir une option :</Text>
              <View style={styles.variantsGrid}>
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => {
                        Haptics.selection();
                        setSelectedVariant(isSelected ? null : v);
                      }}
                      style={[styles.variantChip, isSelected && styles.variantChipActive]}
                    >
                      <Text style={[styles.variantText, isSelected && styles.variantTextActive]}>
                        {v.label}
                      </Text>
                      {v.price != null && (
                        <Text style={[styles.variantPrice, isSelected && styles.variantPriceActive]}>
                          ({v.price} F)
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionSubtitle}>Description</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          {/* Vendeur Profil Card */}
          <Card
            onPress={() => seller?.id && router.push(`/seller/${seller.id}`)}
            style={styles.sellerCard}
          >
            <View style={styles.sellerRow}>
              <Avatar
                uri={seller?.shop_logo_url || seller?.avatar_url}
                name={seller?.shop_name || seller?.full_name || 'Vendeur'}
                size={48}
                isPro={isPro}
              />
              <View style={styles.sellerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {seller?.shop_name || seller?.full_name || 'Boutique Daloa'}
                  </Text>
                  {isPro && <Badge label="PRO" variant="pro" />}
                </View>
                <RatingStars rating={seller?.rating || 5.0} totalReviews={seller?.review_count || 1} size={12} />
                <Text style={styles.sellerDistrict}>📍 {seller?.district || 'Daloa'}</Text>
              </View>
              <ChevronRight size={20} color={colors.dark.textDim} />
            </View>
          </Card>

          {/* Badge Garantie Séquestre */}
          <View style={styles.escrowGuaranteeCard}>
            <ShieldCheck size={24} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.escrowTitle}>Paiement par Séquestre Garanti</Text>
              <Text style={styles.escrowDesc}>
                Votre argent ne sera versé au vendeur qu’après la livraison et validation de votre code OTP.
              </Text>
            </View>
          </View>

          {/* Articles Similaires */}
          {similarItems && similarItems.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionSubtitle}>Articles similaires à Daloa</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similarItems.map((simItem) => (
                  <View key={simItem.id} style={{ width: 160, marginRight: spacing[3] }}>
                    <ListingCard
                      listing={simItem}
                      onPress={() => router.push(`/listing/${simItem.id}`)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleWhatsApp}
          style={styles.whatsappBtn}
        >
          <MessageCircle size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddToCart}
          style={styles.cartBtn}
        >
          <ShoppingBag size={20} color={colors.dark.text} />
        </TouchableOpacity>

        <Button
          title="Acheter avec Séquestre"
          variant="market"
          size="lg"
          onPress={handleBuyNow}
          style={styles.buyBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.dark.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    backgroundColor: colors.dark.surfaceRaised,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
  },
  paginationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  paginationText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  detailsContainer: {
    padding: spacing[4],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  originalPrice: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.base,
    textDecorationLine: 'line-through',
  },
  listingTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    lineHeight: 26,
    marginBottom: spacing[3],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  tagText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  sectionSubtitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  variantsSection: {
    marginBottom: spacing[4],
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    gap: 4,
  },
  variantChipActive: {
    borderColor: colors.market.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  variantText: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  variantTextActive: {
    color: colors.market.primary,
    fontWeight: typography.weights.bold,
  },
  variantPrice: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  variantPriceActive: {
    color: colors.market.primary,
  },
  descriptionSection: {
    marginBottom: spacing[4],
  },
  descriptionText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
  },
  sellerCard: {
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  sellerName: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  sellerDistrict: {
    color: colors.dark.textDim,
    fontSize: 11,
  },
  escrowGuaranteeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: radii['2xl'],
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  escrowTitle: {
    color: '#10B981',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  escrowDesc: {
    color: colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  similarSection: {
    marginBottom: spacing[4],
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  whatsappBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    flex: 1,
  },
});
