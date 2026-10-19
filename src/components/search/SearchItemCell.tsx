import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ListingCard } from '@daloa/ui';

interface SearchItemCellProps {
  item: any;
  isOwner: boolean;
  cartQty: number;
  isFavorite: boolean;
  onPress: () => void;
  onAddToCart: () => void;
  onUpdateCartQty: (listingId: string, qty: number) => void;
  onToggleFavorite: () => void;
  onManage: () => void;
}

export const SearchItemCell = memo(function SearchItemCell({
  item,
  isOwner,
  cartQty,
  isFavorite,
  onPress,
  onAddToCart,
  onUpdateCartQty,
  onToggleFavorite,
  onManage,
}: SearchItemCellProps) {
  return (
    <View style={styles.cell}>
      <ListingCard
        listing={{
          id: item.id,
          title: item.title,
          price: item.price,
          originalPrice: item.original_price,
          photos: item.photos || [],
          district: item.district,
          createdAt: item.created_at,
          stock: item.stock,
          boostedUntil: item.boosted_until,
          cartQty,
          isFavorite,
          variants: item.variants || [],
          hasVariants: Boolean(item.variants && item.variants.length > 0),
          isOwner,
        }}
        onPress={onPress}
        onAddToCart={onAddToCart}
        onUpdateCartQty={onUpdateCartQty}
        onToggleFavorite={onToggleFavorite}
        isOwner={isOwner}
        onManage={onManage}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    paddingHorizontal: 5,
  },
});
