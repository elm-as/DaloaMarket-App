import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, typography } from '@daloa/ui';
import { formatFCFA, resolveListingPhoto } from '@daloa/utils';
import { ListingFull } from '@daloa/types';
import { listingFlashDealsService } from '@daloa/api';

/**
 * Carrousel horizontal des articles en promotion ou mis en avant sur l'accueil mobile.
 */
export const HomeFlashDeals: React.FC = () => {
  const router = useRouter();
  const [deals, setDeals] = useState<ListingFull[]>([]);

  const fetchDeals = useCallback(async () => {
    try {
      const items = await listingFlashDealsService.getFlashDeals(8);
      const nowIso = new Date().toISOString();
      const realDeals = (items || []).filter(
        (item: ListingFull) =>
          (item.boosted_until && item.boosted_until > nowIso) ||
          (item.original_price != null && item.original_price > item.price)
      );
      setDeals(realDeals);
    } catch (err) {
      console.warn('HomeFlashDeals load warning:', err);
    }
  }, []);

  useEffect(() => {
    void fetchDeals();
  }, [fetchDeals]);

  if (deals.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deals.map((item) => {
          const photo = resolveListingPhoto(item.photos, '');
          const hasDiscount = item.original_price != null && item.original_price > item.price;
          const discountPercent = hasDiscount
            ? Math.min(90, Math.max(5, Math.round(((item.original_price! - item.price) / item.original_price!) * 100)))
            : null;

          return (
            <AppPressable
              key={`flash-${item.id}`}
              haptic="selection"
              onPress={() => router.push(`/listing/${item.id}` as any)}
              style={styles.dealCard}
              accessibilityLabel={`Offre: ${item.title}`}
            >
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

                {discountPercent ? (
                  <View style={styles.discountBadge}>
                    <AppText variant="caption" color="#065F46" style={styles.discountText}>
                      -{discountPercent}%
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.featuredBadge}>
                    <AppText variant="caption" color="#FFFFFF" style={styles.featuredText}>
                      Vedette
                    </AppText>
                  </View>
                )}
              </View>

              <View style={styles.cardInfo}>
                <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={1} style={styles.cardTitle}>
                  {item.title}
                </AppText>

                <View style={styles.priceRow}>
                  <AppText variant="label" color={colors.text.DEFAULT} style={styles.salePrice}>
                    {formatFCFA(item.price)}
                  </AppText>
                  {hasDiscount ? (
                    <AppText variant="caption" color={colors.text.subtle} style={styles.originalPrice}>
                      {formatFCFA(item.original_price!)}
                    </AppText>
                  ) : null}
                </View>

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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: spacing[2], marginBottom: spacing[1] },
  scrollContent: { paddingHorizontal: spacing[3], gap: 10, paddingBottom: 4 },
  dealCard: {
    width: 144,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  photoContainer: { width: '100%', height: 112, backgroundColor: colors.grey[200], position: 'relative' },
  fallbackPhoto: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.grey[200] },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  discountText: { fontSize: 10, fontFamily: typography.families.bold, fontVariant: ['tabular-nums'] },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  featuredText: { fontSize: 9, fontFamily: typography.families.bold, letterSpacing: 0.3 },
  cardInfo: { padding: 8, gap: 3 },
  cardTitle: { fontSize: 12, lineHeight: 16, fontFamily: typography.families.semibold },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  salePrice: { fontVariant: ['tabular-nums'], fontSize: 13, fontFamily: typography.families.bold },
  originalPrice: { textDecorationLine: 'line-through', fontVariant: ['tabular-nums'], fontSize: 10 },
  districtRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  districtText: { fontSize: 10 },
});
