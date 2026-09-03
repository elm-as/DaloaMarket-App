import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import { MapPin, Heart, ShoppingCart, Plus, Minus, Zap } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { useAccent } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';
import { formatFCFA, formatRelativeTime, getListingPriceRange } from '@daloa/utils';

export interface ListingCardItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  photos?: string[];
  district?: string;
  condition?: string;
  category?: string;
  boostedUntil?: string | null;
  isBoosted?: boolean;
  isPro?: boolean;
  acceptsDelivery?: boolean;
  stock?: number;
  isFavorite?: boolean;
  cartQty?: number;
  hasVariants?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  variants?: Array<{ price?: number | null; active?: boolean; [key: string]: any }>;
  createdAt?: string;
}

export interface ListingCardProps {
  listing: ListingCardItem;
  onPress: () => void;
  onToggleFavorite?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  onUpdateCartQty?: (id: string, qty: number) => void;
  style?: StyleProp<ViewStyle>;
}

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  onToggleFavorite,
  onAddToCart,
  onUpdateCartQty,
  style,
}) => {
  const accent = useAccent();

  const isBoosted = listing.boostedUntil
    ? new Date(listing.boostedUntil) > new Date()
    : Boolean(listing.isBoosted);
  const hasDiscount = listing.originalPrice != null && listing.originalPrice > listing.price;
  const discountPercent =
    hasDiscount && listing.originalPrice
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : 0;

  const priceInfo = React.useMemo(() => {
    if (listing.minPrice != null && listing.maxPrice != null) {
      const min = Number(listing.minPrice);
      const max = Number(listing.maxPrice);
      const hasRange = min < max;
      return {
        minPrice: min,
        maxPrice: max,
        hasRange,
        label: hasRange ? `${formatFCFA(min)} - ${formatFCFA(max)}` : formatFCFA(min),
      };
    }
    return getListingPriceRange(listing.price, listing.variants);
  }, [listing.price, listing.variants, listing.minPrice, listing.maxPrice]);

  const mainPhoto =
    listing.photos && listing.photos.length > 0 && listing.photos[0]
      ? listing.photos[0]
      : FALLBACK_PHOTO;

  const cartQty = listing.cartQty || 0;
  const maxStock = listing.stock ?? 1;
  const isOutOfStock = maxStock <= 0;

  const handleAdd = (e?: any) => {
    e?.stopPropagation?.();
    if (isOutOfStock) return;
    if (onAddToCart) onAddToCart(listing.id);
    else if (onUpdateCartQty) onUpdateCartQty(listing.id, 1);
  };

  const handleIncrement = (e?: any) => {
    e?.stopPropagation?.();
    if (cartQty >= maxStock) return;
    onUpdateCartQty?.(listing.id, cartQty + 1);
  };

  const handleDecrement = (e?: any) => {
    e?.stopPropagation?.();
    onUpdateCartQty?.(listing.id, Math.max(0, cartQty - 1));
  };

  return (
    <AppPressable onPress={onPress} haptic="none" pressedOpacity={0.95} style={[styles.container, style]}>
      {/* 1. Visuel Produit (Ratio 4/3) */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: mainPhoto }} style={styles.image} resizeMode="cover" />

        {/* Badges superposés à gauche */}
        <View style={styles.badgesOverlay}>
          {hasDiscount ? (
            <View style={[styles.badge, { backgroundColor: colors.status.error }]}>
              <AppText variant="overline" color={colors.text.inverse}>
                -{discountPercent}%
              </AppText>
            </View>
          ) : isBoosted ? (
            <View style={[styles.badge, styles.boostBadge, { backgroundColor: colors.status.warning }]}>
              <Zap size={10} color={colors.text.inverse} />
              <AppText variant="overline" color={colors.text.inverse}>
                BOOST
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Bouton Favori */}
        {onToggleFavorite && (
          <AppPressable
            haptic="light"
            rippleBorderless
            onPress={(e) => {
              (e as any)?.stopPropagation?.();
              onToggleFavorite(listing.id);
            }}
            style={styles.favoriteButton}
            accessibilityRole="button"
            accessibilityLabel={listing.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              size={15}
              color={listing.isFavorite ? colors.status.error : colors.text.inverse}
              fill={listing.isFavorite ? colors.status.error : 'transparent'}
            />
          </AppPressable>
        )}

        {/* Overlay rupture de stock */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <AppText variant="label" style={styles.outOfStockText}>
              Épuisé
            </AppText>
          </View>
        )}
      </View>

      {/* 2. Bloc Détails & Prix */}
      <View style={styles.content}>
        {/* Prix & Réduction */}
        <View style={styles.priceRow}>
          <AppText
            variant={priceInfo.hasRange ? 'label' : 'title'}
            color={accent[600]}
            style={[styles.priceText, priceInfo.hasRange && styles.priceRangeText]}
            numberOfLines={1}
          >
            {priceInfo.label}
          </AppText>
          {hasDiscount && listing.originalPrice && !priceInfo.hasRange ? (
            <AppText
              variant="caption"
              color={colors.text.subtle}
              style={styles.originalPriceText}
              numberOfLines={1}
            >
              {formatFCFA(listing.originalPrice)}
            </AppText>
          ) : null}
        </View>

        {/* Titre — hauteur fixe 2 lignes pour aligner toutes les cartes */}
        <AppText variant="body" color={colors.text.body} numberOfLines={2} style={styles.title}>
          {listing.title}
        </AppText>

        {/* Localisation & Heure */}
        <View style={styles.metaRow}>
          <MapPin size={11} color={accent.DEFAULT} style={styles.mapPin} />
          <AppText variant="caption" color={colors.text.muted} numberOfLines={1} style={styles.districtText}>
            {listing.district || 'Daloa'}
          </AppText>
          {listing.createdAt && (
            <>
              <AppText variant="caption" color={colors.border.strong} style={styles.metaDot}>
                ·
              </AppText>
              <AppText variant="caption" color={colors.text.subtle} numberOfLines={1} style={styles.districtText}>
                {formatRelativeTime(listing.createdAt)}
              </AppText>
            </>
          )}
        </View>

        {/* 3. Action Panier Rapide — toujours rendu pour hauteur uniforme */}
        {(onAddToCart || onUpdateCartQty) && (
          <View style={styles.cartActionContainer}>
            {isOutOfStock ? (
              <View style={[styles.addToCartBtn, styles.outOfStockBtn]}>
                <AppText variant="label" color={colors.text.subtle}>
                  Épuisé
                </AppText>
              </View>
            ) : cartQty > 0 ? (
              <View style={[styles.stepperBox, { backgroundColor: accent[50], borderColor: accent[100] }]}>
                <AppPressable
                  haptic="light"
                  rippleBorderless
                  onPress={handleDecrement}
                  style={styles.stepperBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Retirer une unité"
                >
                  <Minus size={13} color={accent.DEFAULT} strokeWidth={2.5} />
                </AppPressable>

                <AppText variant="bodyStrong" style={styles.stepperCount}>
                  {cartQty}
                </AppText>

                <AppPressable
                  haptic="light"
                  rippleBorderless
                  onPress={handleIncrement}
                  disabled={cartQty >= maxStock}
                  style={[styles.stepperBtn, cartQty >= maxStock && styles.stepperBtnDisabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter une unité"
                >
                  <Plus size={13} color={accent.DEFAULT} strokeWidth={2.5} />
                </AppPressable>
              </View>
            ) : (
              <AppPressable
                haptic="light"
                onPress={handleAdd}
                rippleColor="rgba(255,255,255,0.24)"
                style={[styles.addToCartBtn, listing.hasVariants
                  ? { backgroundColor: colors.grey[100], borderWidth: 1, borderColor: colors.border.DEFAULT }
                  : { backgroundColor: accent.DEFAULT }
                ]}
                accessibilityRole="button"
                accessibilityLabel={listing.hasVariants ? 'Voir les options' : 'Ajouter au panier'}
              >
                <ShoppingCart size={13} color={listing.hasVariants ? colors.grey[700] : colors.text.inverse} strokeWidth={2.2} />
                <AppText variant="label" color={listing.hasVariants ? colors.grey[700] : colors.text.inverse}>
                  {listing.hasVariants ? 'Options' : 'Ajouter'}
                </AppText>
              </AppPressable>
            )}
          </View>
        )}
      </View>
    </AppPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing[3],
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.bg.subtle,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  badgesOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
    gap: 4,
    zIndex: 2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  outOfStockText: {
    color: colors.text.DEFAULT,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  content: {
    padding: 10,
    height: 156, // Hauteur strictement identique pour aligner 100% des cartes
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    height: 22,
    overflow: 'hidden',
  },
  priceText: {
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  priceRangeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 0,
  },
  originalPriceText: {
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
    fontSize: 10.5,
    flexShrink: 1,
  },
  title: {
    marginTop: 3,
    lineHeight: 18,
    height: 36, // Strictement 2 lignes fixes
    overflow: 'hidden',
    fontSize: 12.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    height: 18,
    overflow: 'hidden',
  },
  mapPin: {
    marginRight: 2,
  },
  districtText: {
    flexShrink: 1,
  },
  metaDot: {
    marginHorizontal: 3,
  },
  cartActionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    height: 44,
    justifyContent: 'center',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: radii.lg,
    gap: 5,
    overflow: 'hidden',
  },
  outOfStockBtn: {
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.lg,
    height: 34,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperCount: {
    fontVariant: ['tabular-nums'],
  },
});
