import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ListingFull } from '@daloa/types';
import { ListingCard as UIListingCard, ListingCardItem } from '@daloa/ui';

export interface ListingCardProps {
  listing: ListingFull;
  onPress: () => void;
  cartQty?: number;
  onAddToCart?: (id: string) => void;
  onUpdateCartQty?: (id: string, qty: number) => void;
  onToggleFavorite?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  cartQty,
  onAddToCart,
  onUpdateCartQty,
  onToggleFavorite,
  style,
}) => {
  const item: ListingCardItem = {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    originalPrice: listing.original_price,
    photos: listing.photos || [],
    district: listing.district,
    createdAt: listing.created_at,
    isBoosted: Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date()),
    isPro: Boolean(listing.seller?.pro_until && new Date(listing.seller.pro_until) > new Date()),
    acceptsDelivery: listing.accepts_delivery,
    stock: listing.stock,
    cartQty,
  };

  return (
    <UIListingCard
      listing={item}
      onPress={onPress}
      onAddToCart={onAddToCart}
      onUpdateCartQty={onUpdateCartQty}
      onToggleFavorite={onToggleFavorite}
      style={style as any}
    />
  );
};
