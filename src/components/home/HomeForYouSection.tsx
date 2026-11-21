import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MapPin, Heart, Plus, Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { getListingPriceRange } from '@daloa/utils';
import { ScoredRecommendation } from '../../lib/recommendationEngine';

interface HomeForYouSectionProps {
  recommendations: ScoredRecommendation<any>[];
  onPressItem: (item: any) => void;
  onAddToCart: (item: any) => void;
  onToggleFavorite: (itemId: string) => void;
  isFavorited: (itemId: string) => boolean;
  getCartQty?: (itemId: string) => number;
}

const TRENDING_REASONS = new Set(['Populaire à Daloa', 'En vedette']);

/**
 * Section « Pour vous » sur l'accueil mobile : cartes portrait compactes
 * (2+ cartes visibles à l'écran), hiérarchie Prix → Titre → Quartier et ajout panier direct.
 */
export const HomeForYouSection: React.FC<HomeForYouSectionProps> = ({
  recommendations,
  onPressItem,
  onAddToCart,
  onToggleFavorite,
  isFavorited,
  getCartQty,
}) => {
  const accent = useAccent();
  const displayItems = (recommendations || []).slice(0, 8);
  if (displayItems.length === 0) return null;

  const isPersonal = displayItems.some(
    (entry) => entry.matchReason && !TRENDING_REASONS.has(entry.matchReason),
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTexts}>
          <AppText variant="title" style={styles.headingTitle}>
            Pour vous
          </AppText>
          <AppText variant="caption" color={colors.text.muted} style={styles.headingSub}>
            {isPersonal ? 'Selon vos consultations récentes' : 'Sélection active à Daloa'}
          </AppText>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {displayItems.map(({ item }) => {
          const favorited = isFavorited(item.id);
          const itemCartQty = getCartQty ? getCartQty(item.id) : 0;
          const priceInfo = getListingPriceRange(item.price, item.variants);
          const photo = item.photos && item.photos.length > 0 ? item.photos[0] : null;

          return (
            <AppPressable
              key={`foryou-${item.id}`}
              haptic="selection"
              onPress={() => onPressItem(item)}
              style={styles.card}
              accessibilityLabel={`Pour vous : ${item.title}`}
            >
              <View style={styles.photoWrap}>
                {photo ? (
                  <ExpoImage
                    source={{ uri: photo }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.fallbackPhoto} />
                )}

                <AppPressable
                  haptic="light"
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    onToggleFavorite(item.id);
                  }}
                  style={styles.favBtn}
                  accessibilityLabel="Ajouter aux favoris"
                >
                  <Heart
                    size={13}
                    color={favorited ? colors.status.error : '#FFFFFF'}
                    fill={favorited ? colors.status.error : 'rgba(15,23,42,0.35)'}
                  />
                </AppPressable>
              </View>

              <View style={styles.body}>
                <AppText variant="label" color={accent[700]} style={styles.priceText} numberOfLines={1}>
                  {priceInfo.label}
                </AppText>

                <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={1} style={styles.itemTitle}>
                  {item.title}
                </AppText>

                <View style={styles.footerRow}>
                  <View style={styles.districtRow}>
                    <MapPin size={10} color={colors.text.muted} />
                    <AppText variant="caption" color={colors.text.muted} numberOfLines={1} style={styles.districtLabel}>
                      {item.district || 'Daloa'}
                    </AppText>
                  </View>

                  <AppPressable
                    haptic="light"
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      onAddToCart(item);
                    }}
                    style={[
                      styles.addBtn,
                      itemCartQty > 0
                        ? { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT, paddingHorizontal: 7 }
                        : { backgroundColor: colors.bg.subtle, borderColor: colors.border.DEFAULT },
                    ]}
                    accessibilityLabel={itemCartQty > 0 ? `${itemCartQty} au panier` : 'Ajouter au panier'}
                  >
                    {itemCartQty > 0 ? (
                      <View style={styles.qtyRow}>
                        <Check size={11} color={colors.text.inverse} strokeWidth={3} />
                        <AppText variant="caption" color={colors.text.inverse} style={styles.qtyText}>
                          {itemCartQty}
                        </AppText>
                      </View>
                    ) : (
                      <Plus size={14} color={colors.text.DEFAULT} />
                    )}
                  </AppPressable>
                </View>
              </View>
            </AppPressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  headerRow: {
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTexts: {
    flex: 1,
    gap: 1,
  },
  headingTitle: {
    fontFamily: typography.families.extrabold,
    fontSize: 17,
    lineHeight: 22,
  },
  headingSub: {
    fontSize: 12,
  },
  scrollList: {
    paddingHorizontal: spacing[3],
    gap: 10,
    paddingBottom: 4,
  },
  card: {
    width: 156,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  photoWrap: {
    width: '100%',
    height: 118,
    backgroundColor: colors.grey[200],
    position: 'relative',
  },
  fallbackPhoto: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.grey[200],
  },
  favBtn: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 9,
    gap: 3,
  },
  priceText: {
    fontFamily: typography.families.extrabold,
    fontSize: 13.5,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  itemTitle: {
    fontSize: 12.5,
    lineHeight: 16,
    fontFamily: typography.families.semibold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  districtLabel: {
    fontSize: 10.5,
    flexShrink: 1,
  },
  addBtn: {
    minWidth: 26,
    height: 26,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  qtyText: {
    fontSize: 10,
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
});
