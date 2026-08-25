import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { ListingFull } from '@daloa/types';
import { colors, radii, spacing, typography } from '@daloa/ui';
import { CurrencyText, Badge, RatingStars } from '@daloa/ui';
import { MapPin, Truck, Zap } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export interface ListingCardProps {
  listing: ListingFull;
  onPress: () => void;
  style?: ViewStyle;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onPress, style }) => {
  const photoUrl = listing.photos?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';
  const isBoosted = Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date());
  const isProSeller = Boolean(listing.seller?.pro_until && new Date(listing.seller.pro_until) > new Date());

  const hasDiscount =
    listing.original_price != null &&
    listing.original_price > listing.price;

  const discountPercent = hasDiscount
    ? Math.round(((listing.original_price! - listing.price) / listing.original_price!) * 100)
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        Haptics.lightImpact();
        onPress();
      }}
      style={[styles.card, isBoosted && styles.cardBoosted, style]}
    >
      {/* Photo & Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />

        {isBoosted && (
          <View style={styles.boostBadge}>
            <Zap size={10} color="#000000" fill="#000000" />
            <Text style={styles.boostText}>TOP</Text>
          </View>
        )}

        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Badge label={`-${discountPercent}%`} variant="discount" />
          </View>
        )}

        {listing.accepts_delivery && (
          <View style={styles.deliveryBadge}>
            <Truck size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.priceRow}>
          <CurrencyText
            amount={listing.price}
            size="lg"
            weight="bold"
            color={colors.market.primary}
          />
          {hasDiscount && (
            <Text style={styles.originalPrice}>
              {Math.round(listing.original_price!)} F
            </Text>
          )}
        </View>

        {/* Quartier & Vendeur */}
        <View style={styles.metaRow}>
          <View style={styles.districtContainer}>
            <MapPin size={11} color={colors.dark.textDim} />
            <Text style={styles.districtText} numberOfLines={1}>
              {listing.district || 'Daloa'}
            </Text>
          </View>

          {isProSeller && (
            <Badge label="PRO" variant="pro" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  cardBoosted: {
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.dark.surfaceRaised,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  boostBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    gap: 2,
  },
  boostText: {
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    color: '#000000',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  deliveryBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    padding: 4,
    borderRadius: radii.md,
  },
  content: {
    padding: spacing[3],
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginVertical: 4,
  },
  originalPrice: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  districtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  districtText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
});
