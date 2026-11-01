import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Zap, Rocket, MapPin, Clock } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { formatFCFA, resolveListingPhoto } from '@daloa/utils';
import { ListingFull } from '@daloa/types';
import { listingFlashDealsService } from '@daloa/api';
import { usePhase } from '../../context/PhaseContext';

function computeSecondsToMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}h : ${minutes}m : ${seconds}s`;
}

export const HomeFlashDeals: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();
  const { enableBoost } = usePhase();
  const [deals, setDeals] = useState<ListingFull[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(computeSecondsToMidnight);

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
    } catch {
      // Échec silencieux
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    if (deals.length === 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(computeSecondsToMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, [deals.length]);

  if (deals.length === 0) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#DC2626', '#EA580C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerHeader}
      >
        <View style={styles.headerLeft}>
          <View style={styles.zapBadge}>
            <Zap size={13} color="#DC2626" fill="#DC2626" />
          </View>
          <View>
            <AppText variant="subtitle" color="#FFFFFF" style={styles.headerTitle}>
              VENTES FLASH & VEDETTES
            </AppText>
            <View style={styles.timerRow}>
              <Clock size={11} color="#FEF08A" />
              <AppText variant="caption" color="#FEF08A" style={styles.timerText}>
                {formatCountdown(secondsLeft)}
              </AppText>
            </View>
          </View>
        </View>

        {enableBoost ? (
          <AppPressable
            haptic="light"
            onPress={() => router.push('/pro/packs' as any)}
            style={styles.boostPill}
            accessibilityRole="button"
            accessibilityLabel="Booster une annonce vendeur"
          >
            <Rocket size={11} color="#DC2626" />
            <AppText variant="caption" color="#DC2626" style={styles.boostPillText}>
              Booster
            </AppText>
          </AppPressable>
        ) : null}
      </LinearGradient>

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
                    <AppText variant="caption" color="#DC2626" style={styles.discountText}>
                      -{discountPercent}%
                    </AppText>
                  </View>
                ) : (
                  <View style={[styles.featuredBadge, { backgroundColor: accent[600] }]}>
                    <AppText variant="caption" color="#FFFFFF" style={styles.featuredText}>
                      VEDETTE
                    </AppText>
                  </View>
                )}
              </View>

              <View style={styles.cardInfo}>
                <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={1} style={styles.cardTitle}>
                  {item.title}
                </AppText>

                <View style={styles.priceRow}>
                  <AppText variant="label" color="#DC2626" style={styles.salePrice}>
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
  container: { marginVertical: spacing[2] },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing[3],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: 9,
    borderRadius: radii.xl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  zapBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: typography.families.black, fontSize: 12.5, letterSpacing: 0.3 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  timerText: { fontSize: 10.5, fontFamily: typography.families.extrabold, fontVariant: ['tabular-nums'] },
  boostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  boostPillText: { fontSize: 11, fontFamily: typography.families.extrabold },
  scrollContent: { paddingHorizontal: spacing[3], gap: 10, paddingBottom: 4 },
  dealCard: {
    width: 144,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  discountText: { fontSize: 10, fontFamily: typography.families.black, fontVariant: ['tabular-nums'] },
  featuredBadge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.sm },
  featuredText: { fontSize: 9, fontFamily: typography.families.extrabold, letterSpacing: 0.5 },
  cardInfo: { padding: 8, gap: 3 },
  cardTitle: { fontSize: 12, lineHeight: 16, fontFamily: typography.families.semibold },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  salePrice: { fontVariant: ['tabular-nums'], fontSize: 13, fontFamily: typography.families.extrabold },
  originalPrice: { textDecorationLine: 'line-through', fontVariant: ['tabular-nums'], fontSize: 10 },
  districtRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  districtText: { fontSize: 10 },
});
