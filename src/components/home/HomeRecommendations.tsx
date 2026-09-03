import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Sparkles, MapPin, Heart, Plus, Zap, TrendingUp, Star, Tag } from 'lucide-react-native';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import { formatFCFA, getListingPriceRange } from '@daloa/utils';
import { ScoredRecommendation } from '../../lib/recommendationEngine';

interface HomeRecommendationsProps {
  recommendations: ScoredRecommendation<any>[];
  onPressItem: (item: any) => void;
  onAddToCart: (item: any) => void;
  onToggleFavorite: (itemId: string) => void;
  isFavorited: (itemId: string) => boolean;
}

function renderReasonIcon(reason: string) {
  if (reason.includes('vedette')) return <Zap size={11} color="#fff" />;
  if (reason.includes('Populaire')) return <TrendingUp size={11} color="#fff" />;
  if (reason.includes('Catégorie')) return <Star size={11} color="#fff" />;
  if (reason.includes('budget')) return <Tag size={11} color="#fff" />;
  if (reason.includes('Quartier')) return <MapPin size={11} color="#fff" />;
  return <Sparkles size={11} color="#fff" />;
}

export const HomeRecommendations: React.FC<HomeRecommendationsProps> = ({
  recommendations,
  onPressItem,
  onAddToCart,
  onToggleFavorite,
  isFavorited,
}) => {
  const accent = useAccent();

  const displayItems = (recommendations || []).slice(0, 8);
  if (displayItems.length === 0) return null;

  const isPersonalized = displayItems.some((r) => r.isPersonalized);

  return (
    <View style={styles.container}>
      {/* En-tête de section */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.iconWrap, { backgroundColor: accent[50] }]}>
            <Sparkles size={16} color={accent[600]} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <AppText variant="subtitle" style={styles.sectionTitle}>
                Pour vous
              </AppText>
              <View style={[styles.badgePill, { backgroundColor: isPersonalized ? accent[50] : colors.bg.subtle }]}>
                <AppText variant="caption" color={isPersonalized ? accent[700] : colors.text.muted} style={styles.badgeText}>
                  {isPersonalized ? 'Personnalisé' : 'Tendance'}
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.text.subtle}>
              {isPersonalized
                ? 'Sélectionné selon vos préférences & favoris'
                : 'Les pépites du moment à Daloa'}
            </AppText>
          </View>
        </View>
      </View>

      {/* Carrousel horizontal strictement limité à 8 éléments */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {displayItems.map(({ item, matchReason }) => {
          const favorited = isFavorited(item.id);
          const priceInfo = getListingPriceRange(item.price, item.variants);
          const photo = item.photos && item.photos.length > 0 ? item.photos[0] : null;

          return (
            <AppPressable
              key={`rec-${item.id}`}
              haptic="selection"
              onPress={() => onPressItem(item)}
              style={styles.card}
              accessibilityLabel={item.title}
            >
              {/* Photo & badges */}
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

                {/* Badge de recommandation avec icône professionnelle */}
                <View style={styles.reasonBadge}>
                  {renderReasonIcon(matchReason)}
                  <AppText variant="caption" color="#fff" style={styles.reasonText} numberOfLines={1}>
                    {matchReason}
                  </AppText>
                </View>

                {/* Bouton Cœur favori */}
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
                    fill={favorited ? colors.status.error : 'rgba(0,0,0,0.25)'}
                  />
                </AppPressable>
              </View>

              {/* Détails */}
              <View style={styles.infoContainer}>
                {/* Prix net sans Dès */}
                <AppText variant="label" color={accent[600]} style={styles.priceText} numberOfLines={1}>
                  {priceInfo.label}
                </AppText>

                {/* Titre */}
                <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={2} style={styles.title}>
                  {item.title}
                </AppText>

                {/* Pied de carte : Quartier & Ajout rapide */}
                <View style={styles.bottomRow}>
                  <View style={styles.districtWrap}>
                    <MapPin size={11} color={accent.DEFAULT} />
                    <AppText variant="caption" color={colors.text.muted} numberOfLines={1} style={styles.districtText}>
                      {item.district || 'Daloa'}
                    </AppText>
                  </View>

                  <AppPressable
                    haptic="light"
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      onAddToCart(item);
                    }}
                    style={[styles.addCartBtn, { backgroundColor: accent[50], borderColor: accent[200] }]}
                    accessibilityLabel="Ajouter au panier"
                  >
                    <Plus size={13} color={accent[600]} />
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    paddingBottom: spacing[1],
  },
  card: {
    width: 172,
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
    height: 125,
    backgroundColor: colors.grey[200],
    position: 'relative',
  },
  fallbackImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.grey[200],
  },
  reasonBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 130,
  },
  reasonText: {
    fontSize: 10,
    fontWeight: '700',
  },
  favBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: 10,
    gap: 4,
  },
  priceText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 12.5,
    lineHeight: 16,
    height: 32,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  districtWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  districtText: {
    fontSize: 11,
    flexShrink: 1,
  },
  addCartBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
