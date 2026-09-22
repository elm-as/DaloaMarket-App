import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Sparkles, MapPin, Heart, Plus, Check, Target, Compass } from 'lucide-react-native';
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

  return (
    <View style={styles.container}>
      {/* En-tête Curation & Recommandation Personnelle */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.curationIconBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Sparkles size={17} color="#16A34A" />
          </View>
          <View style={styles.headerTexts}>
            <View style={styles.titleLine}>
              <AppText variant="subtitle" style={styles.headingTitle}>
                Pour vous
              </AppText>
              <View style={styles.affinityPill}>
                <Target size={11} color="#15803D" />
                <AppText variant="caption" color="#15803D" style={styles.affinityPillText}>
                  Sur-mesure
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.text.subtle}>
              Sélectionné d’après vos favoris et vos recherches
            </AppText>
          </View>
        </View>
      </View>

      {/* Carrousel Horizontal de Fiches Paysage (Split Image / Infos) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {displayItems.map(({ item, matchReason, similarityPercent }) => {
          const favorited = isFavorited(item.id);
          const itemCartQty = getCartQty ? getCartQty(item.id) : 0;
          const priceInfo = getListingPriceRange(item.price, item.variants);
          const photo = item.photos && item.photos.length > 0 ? item.photos[0] : null;

          // Libellé d'affinité contextuel
          const affinityLabel = similarityPercent && similarityPercent > 70
            ? `${similarityPercent}% affinité`
            : (matchReason || 'Suggéré pour vous');

          return (
            <AppPressable
              key={`foryou-${item.id}`}
              haptic="selection"
              onPress={() => onPressItem(item)}
              style={styles.horizontalCard}
              accessibilityLabel={`Pour vous: ${item.title}`}
            >
              {/* Image carrée gauche 90x90 */}
              <View style={styles.thumbWrap}>
                {photo ? (
                  <ExpoImage
                    source={{ uri: photo }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.fallbackThumb} />
                )}

                {/* Bouton favori discret */}
                <AppPressable
                  haptic="light"
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    onToggleFavorite(item.id);
                  }}
                  style={styles.thumbFavBtn}
                  accessibilityLabel="Favori"
                >
                  <Heart
                    size={13}
                    color={favorited ? colors.status.error : '#ffffff'}
                    fill={favorited ? colors.status.error : 'rgba(0,0,0,0.35)'}
                  />
                </AppPressable>
              </View>

              {/* Contenu droit fiche d'affinité */}
              <View style={styles.detailsCol}>
                {/* Badge d'affinité vert émeraude / doux */}
                <View style={styles.matchTag}>
                  <Compass size={10} color="#15803D" />
                  <AppText variant="caption" color="#166534" style={styles.matchTagText} numberOfLines={1}>
                    {affinityLabel}
                  </AppText>
                </View>

                {/* Titre */}
                <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={2} style={styles.itemTitle}>
                  {item.title}
                </AppText>

                {/* Prix net & Action */}
                <View style={styles.bottomRow}>
                  <View style={styles.priceAndDistrict}>
                    <AppText variant="label" color={accent[700]} style={styles.priceText} numberOfLines={1}>
                      {priceInfo.label}
                    </AppText>
                    <View style={styles.districtRow}>
                      <MapPin size={10} color={colors.text.muted} />
                      <AppText variant="caption" color={colors.text.muted} numberOfLines={1} style={styles.districtLabel}>
                        {item.district || 'Daloa'}
                      </AppText>
                    </View>
                  </View>

                  <AppPressable
                    haptic="light"
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      onAddToCart(item);
                    }}
                    style={[
                      styles.addCartMiniBtn,
                      itemCartQty > 0
                        ? { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT, width: 'auto', paddingHorizontal: 6 }
                        : { backgroundColor: '#F8FAFC', borderColor: colors.border.DEFAULT },
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
                      <Plus size={13} color={colors.text.DEFAULT} />
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
    paddingVertical: spacing[2],
    backgroundColor: '#FAFBFB',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
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
  curationIconBox: {
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
  affinityPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  affinityPillText: {
    fontSize: 10,
    fontFamily: typography.families.bold,
  },
  scrollList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    paddingBottom: 2,
  },
  horizontalCard: {
    width: 278,
    height: 108,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: 8,
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  thumbWrap: {
    width: 90,
    height: 90,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.grey[200],
    position: 'relative',
  },
  fallbackThumb: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.grey[200],
  },
  thumbFavBtn: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  matchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    maxWidth: 165,
  },
  matchTagText: {
    fontSize: 9.5,
    fontFamily: typography.families.bold,
  },
  itemTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: typography.families.semibold,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceAndDistrict: {
    gap: 1,
    flex: 1,
  },
  priceText: {
    fontFamily: typography.families.extrabold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  districtLabel: {
    fontSize: 10,
    flexShrink: 1,
  },
  addCartMiniBtn: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
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
