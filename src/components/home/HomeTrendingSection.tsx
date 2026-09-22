import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Flame, MapPin, Heart, Plus, Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { getListingPriceRange } from '@daloa/utils';
import { ScoredRecommendation } from '../../lib/recommendationEngine';

interface HomeTrendingSectionProps {
  recommendations: ScoredRecommendation<any>[];
  onPressItem: (item: any) => void;
  onAddToCart: (item: any) => void;
  onToggleFavorite: (itemId: string) => void;
  isFavorited: (itemId: string) => boolean;
  getCartQty?: (itemId: string) => number;
}

export const HomeTrendingSection: React.FC<HomeTrendingSectionProps> = ({
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

  return (
    <View style={styles.container}>
      {/* En-tête Top Chart / Tendance Urbaine */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.flameIconBox, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
            <Flame size={18} color="#EA580C" />
          </View>
          <View style={styles.headerTexts}>
            <View style={styles.titleLine}>
              <AppText variant="subtitle" style={styles.headingTitle}>
                Populaire à Daloa
              </AppText>
              <View style={styles.rankPill}>
                <AppText variant="caption" color="#C2410C" style={styles.rankPillText}>
                  Top 8
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.text.subtle}>
              Les articles avec la plus forte vélocité en ville
            </AppText>
          </View>
        </View>
      </View>

      {/* Carrousel Billboard avec Rank Badges numérotés */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {displayItems.map(({ item, matchReason }, index) => {
          const rank = index + 1;
          const rankStr = rank < 10 ? `0${rank}` : `${rank}`;
          const isTop3 = rank <= 3;
          const favorited = isFavorited(item.id);
          const itemCartQty = getCartQty ? getCartQty(item.id) : 0;
          const priceInfo = getListingPriceRange(item.price, item.variants);
          const photo = item.photos && item.photos.length > 0 ? item.photos[0] : null;

          return (
            <AppPressable
              key={`trending-${item.id}`}
              haptic="selection"
              onPress={() => onPressItem(item)}
              style={styles.card}
              accessibilityLabel={`${rankStr}. ${item.title}`}
            >
              {/* Image avec Badge Numéroté de Classement */}
              <View style={styles.imageContainer}>
                {photo ? (
                  <ExpoImage
                    source={{ uri: photo }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.fallbackImage} />
                )}

                {/* Badge de Rang Top Chart (#01, #02...) */}
                <View style={[styles.rankBadge, isTop3 ? styles.rankBadgeTop : styles.rankBadgeStandard]}>
                  <AppText
                    variant="caption"
                    style={[styles.rankNumber, isTop3 && styles.rankNumberTop]}
                  >
                    #{rankStr}
                  </AppText>
                </View>

                {/* Bouton Favori flottant */}
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
                    size={14}
                    color={favorited ? colors.status.error : '#ffffff'}
                    fill={favorited ? colors.status.error : 'rgba(0,0,0,0.3)'}
                  />
                </AppPressable>

                {/* Tag de vélocité discret */}
                {matchReason && (
                  <View style={styles.demandPill}>
                    <Flame size={10} color="#EA580C" />
                    <AppText variant="caption" color="#431407" style={styles.demandText} numberOfLines={1}>
                      {matchReason.replace('Populaire à Daloa', 'Forte demande')}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Informations chiffrées & précises */}
              <View style={styles.infoContainer}>
                <AppText variant="label" color={accent[600]} style={styles.priceText} numberOfLines={1}>
                  {priceInfo.label}
                </AppText>

                <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={2} style={styles.itemTitle}>
                  {item.title}
                </AppText>

                {/* Pied de carte : quartier & ajout panier */}
                <View style={styles.cardFooter}>
                  <View style={styles.districtRow}>
                    <MapPin size={11} color={colors.text.muted} />
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
                        ? { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT, width: 'auto', paddingHorizontal: 6 }
                        : { backgroundColor: accent[50], borderColor: accent[200] },
                    ]}
                    accessibilityLabel={itemCartQty > 0 ? `${itemCartQty} au panier` : 'Ajouter'}
                  >
                    {itemCartQty > 0 ? (
                      <View style={styles.cartCountBox}>
                        <Check size={11} color={colors.text.inverse} strokeWidth={3} />
                        <AppText variant="caption" color={colors.text.inverse} style={styles.cartCountText}>
                          {itemCartQty}
                        </AppText>
                      </View>
                    ) : (
                      <Plus size={13} color={accent[600]} />
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
    marginVertical: spacing[3],
  },
  headerRow: {
    paddingHorizontal: spacing[4],
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingTitle: {
    fontFamily: typography.families.extrabold,
    fontSize: 16,
  },
  rankPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radii.full,
  },
  rankPillText: {
    fontSize: 10,
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
  scrollList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    paddingBottom: 2,
  },
  card: {
    width: 164,
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: colors.grey[200],
    position: 'relative',
  },
  fallbackImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.grey[200],
  },
  rankBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  rankBadgeTop: {
    backgroundColor: '#1E293B',
    borderColor: '#F97316',
  },
  rankBadgeStandard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankNumber: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
  rankNumberTop: {
    color: '#FDBA74',
  },
  favBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demandPill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(255, 247, 237, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 0.5,
    borderColor: '#FED7AA',
    maxWidth: 140,
  },
  demandText: {
    fontSize: 9.5,
    fontFamily: typography.families.bold,
  },
  infoContainer: {
    padding: 10,
    gap: 3,
  },
  priceText: {
    fontFamily: typography.families.extrabold,
    fontSize: 13.5,
    fontVariant: ['tabular-nums'],
  },
  itemTitle: {
    fontSize: 12,
    lineHeight: 16,
    height: 32,
    fontFamily: typography.families.semibold,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  districtLabel: {
    fontSize: 10.5,
    flexShrink: 1,
  },
  addBtn: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cartCountText: {
    fontSize: 10,
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
});
