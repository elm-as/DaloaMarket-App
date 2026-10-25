import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Flame,
  Rocket,
  MapPin,
  Clock,
  ShieldCheck,
  Bike,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';
import { ListingFull } from '@daloa/types';
import { listingFlashDealsService } from '@daloa/api';

export const HomeFlashDeals: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();
  const [deals, setDeals] = useState<ListingFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await listingFlashDealsService.getFlashDeals(8);
      setDeals(items);
    } catch {
      // Échec silencieux
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleOpenListing = (id: string) => {
    router.push(`/listing/${id}` as any);
  };

  const handleOpenBoost = () => {
    router.push('/pro/plans' as any);
  };

  return (
    <View style={styles.container}>
      {/* En-tête Ventes Flash & Promos */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.flameIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Flame size={17} color="#DC2626" />
          </View>
          <View>
            <View style={styles.titleBadgeRow}>
              <AppText variant="subtitle" style={styles.sectionTitle}>
                Ventes Flash & Promos
              </AppText>
              <View style={[styles.liveBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Clock size={10} color="#DC2626" />
                <AppText variant="caption" color="#DC2626" style={styles.liveText}>
                  Aujourd'hui
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.text.muted}>
              Bons plans & annonces vedettes à Daloa
            </AppText>
          </View>
        </View>

        {/* Bouton pour les vendeurs */}
        <AppPressable
          haptic="light"
          onPress={handleOpenBoost}
          style={[styles.boostButton, { backgroundColor: accent[50], borderColor: accent[200] }]}
          accessibilityRole="button"
          accessibilityLabel="Booster une annonce vendeur"
        >
          <Rocket size={12} color={accent[700]} />
          <AppText variant="caption" color={accent[900]} style={styles.boostText}>
            Booster
          </AppText>
        </AppPressable>
      </View>

      {/* Carrousel d'annonces */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deals.map((item) => {
          const photo = item.photos && item.photos.length > 0 ? item.photos[0] : null;
          const hasDiscount = item.original_price != null && item.original_price > item.price;
          const discountPercent = hasDiscount
            ? Math.min(90, Math.max(5, Math.round(((item.original_price! - item.price) / item.original_price!) * 100)))
            : null;

          return (
            <AppPressable
              key={`flash-${item.id}`}
              haptic="selection"
              onPress={() => handleOpenListing(item.id)}
              style={styles.dealCard}
              accessibilityLabel={`Offre: ${item.title}`}
            >
              {/* Vignette photo carrée avec badges superposés */}
              <View style={styles.photoContainer}>
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

                {/* Badge Réduction ou Vedette */}
                {discountPercent ? (
                  <View style={styles.discountBadge}>
                    <AppText variant="caption" color="#FFFFFF" style={styles.discountText}>
                      -{discountPercent}%
                    </AppText>
                  </View>
                ) : (
                  <View style={[styles.featuredBadge, { backgroundColor: accent[500] }]}>
                    <AppText variant="caption" color="#FFFFFF" style={styles.featuredText}>
                      VEDETTE
                    </AppText>
                  </View>
                )}
              </View>

              {/* Infos article */}
              <View style={styles.cardInfo}>
                <AppText
                  variant="body"
                  color={colors.text.DEFAULT}
                  numberOfLines={1}
                  style={styles.cardTitle}
                >
                  {item.title}
                </AppText>

                {/* Prix & Remise */}
                <View style={styles.priceRow}>
                  <AppText variant="label" color={accent[700]} style={styles.salePrice}>
                    {formatFCFA(item.price)}
                  </AppText>
                  {hasDiscount ? (
                    <AppText variant="caption" color={colors.text.subtle} style={styles.originalPrice}>
                      {formatFCFA(item.original_price!)}
                    </AppText>
                  ) : null}
                </View>

                {/* Quartier */}
                <View style={styles.districtRow}>
                  <MapPin size={10} color={colors.text.muted} />
                  <AppText variant="caption" color={colors.text.muted} numberOfLines={1} style={styles.districtText}>
                    {item.district || 'Daloa'}
                  </AppText>
                </View>
              </View>
            </AppPressable>
          );
        })}

        {/* Carte de fin : CTA vendeur */}
        <AppPressable
          haptic="medium"
          onPress={handleOpenBoost}
          style={[styles.sellerPromoCard, { borderColor: accent[200], backgroundColor: accent[50] }]}
        >
          <View style={[styles.sellerIconBox, { backgroundColor: accent[500] }]}>
            <Rocket size={18} color={colors.text.inverse} />
          </View>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.sellerCtaTitle}>
            Vous vendez à Daloa ?
          </AppText>
          <AppText variant="caption" color={colors.text.muted} style={styles.sellerCtaSub}>
            Placez vos articles en tête d'affiche et vendez 3x plus vite.
          </AppText>
          <View style={[styles.sellerBtn, { backgroundColor: accent[500] }]}>
            <AppText variant="caption" color={colors.text.inverse} style={styles.sellerBtnText}>
              Booster maintenant
            </AppText>
          </View>
        </AppPressable>
      </ScrollView>

      {/* Rassurance & Sécurité compacte */}
      <View style={styles.trustRow}>
        <View style={styles.trustItem}>
          <ShieldCheck size={13} color={colors.status.successDark} />
          <AppText variant="caption" color={colors.text.muted} style={styles.trustText}>
            Paiement séquestre garanti
          </AppText>
        </View>
        <AppText variant="caption" color={colors.border.DEFAULT}>•</AppText>
        <View style={styles.trustItem}>
          <Bike size={13} color={accent[700]} />
          <AppText variant="caption" color={colors.text.muted} style={styles.trustText}>
            Livraison express locale
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flameIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.families.extrabold,
    fontSize: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  liveText: {
    fontSize: 9,
    fontFamily: typography.families.bold,
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  boostText: {
    fontSize: 11,
    fontFamily: typography.families.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing[3],
    gap: 10,
    paddingBottom: 4,
  },
  dealCard: {
    width: 146,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  photoContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.grey[200],
    position: 'relative',
  },
  fallbackPhoto: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.grey[200],
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  discountText: {
    fontSize: 10,
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  featuredText: {
    fontSize: 9,
    fontFamily: typography.families.extrabold,
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 8,
    gap: 2,
  },
  cardTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.families.semibold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginVertical: 2,
  },
  salePrice: {
    fontVariant: ['tabular-nums'],
    fontSize: 13,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
    fontSize: 10,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  districtText: {
    fontSize: 10,
  },
  sellerPromoCard: {
    width: 154,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  sellerIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerCtaTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  sellerCtaSub: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  sellerBtn: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  sellerBtnText: {
    fontSize: 10,
    fontFamily: typography.families.bold,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
  },
});
