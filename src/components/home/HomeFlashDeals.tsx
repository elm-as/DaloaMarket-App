import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Zap, Rocket, MapPin, Clock, ShieldCheck, Bike } from 'lucide-react-native';
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
      setDeals(items);
    } catch {
      // Échec silencieux
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(computeSecondsToMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (deals.length === 0) return null;

  const handleOpenListing = (id: string) => {
    router.push(`/listing/${id}` as any);
  };

  const handleOpenBoost = () => {
    router.push('/pro/packs' as any);
  };

  return (
    <View style={styles.container}>
      {/* Bandeau supérieur Rouge/Orange façon Jumia Ventes Flash */}
      <LinearGradient
        colors={['#DC2626', '#EA580C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.jumiaBannerHeader}
      >
        <View style={styles.headerLeft}>
          <View style={styles.zapBadge}>
            <Zap size={14} color="#DC2626" fill="#DC2626" />
          </View>
          <View>
            <AppText variant="subtitle" color="#FFFFFF" style={styles.headerTitle}>
              VENTES FLASH & PROMOS
            </AppText>
            <View style={styles.timerRow}>
              <Clock size={11} color="#FEF08A" />
              <AppText variant="caption" color="#FEF08A" style={styles.timerText}>
                Termine dans : {formatCountdown(secondsLeft)}
              </AppText>
            </View>
          </View>
        </View>

        {enableBoost ? (
          <AppPressable
            haptic="light"
            onPress={handleOpenBoost}
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

      {/* Carrousel horizontal de cartes Flash */}
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
          const stock = Math.max(1, Number((item as any).stock ?? 1));
          const stockRatio = stock === 1 ? 0.88 : stock <= 3 ? 0.72 : 0.45;
          const stockLabel = stock === 1 ? 'Dernière pièce !' : `Plus que ${stock} dispo`;

          return (
            <AppPressable
              key={`flash-${item.id}`}
              haptic="selection"
              onPress={() => handleOpenListing(item.id)}
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
                    <AppText variant="caption" color="#FFFFFF" style={styles.discountText}>
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

                {/* Jauge de stock façon Jumia */}
                <View style={styles.stockBarTrack}>
                  <View style={[styles.stockBarFill, { width: `${Math.round(stockRatio * 100)}%` }]} />
                  <AppText variant="caption" color="#FFFFFF" style={styles.stockBarLabel} numberOfLines={1}>
                    {stockLabel}
                  </AppText>
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

        {enableBoost ? (
          <AppPressable
            haptic="medium"
            onPress={handleOpenBoost}
            style={[styles.sellerPromoCard, { borderColor: accent[200], backgroundColor: accent[50] }]}
          >
            <View style={[styles.sellerIconBox, { backgroundColor: accent[500] }]}>
              <Rocket size={18} color={colors.text.inverse} />
            </View>
            <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.sellerCtaTitle}>
              Vendez 3x plus vite
            </AppText>
            <AppText variant="caption" color={colors.text.muted} style={styles.sellerCtaSub}>
              Placez votre article dans les Ventes Flash dès 100 FCFA.
            </AppText>
            <View style={[styles.sellerBtn, { backgroundColor: accent[600] }]}>
              <AppText variant="caption" color={colors.text.inverse} style={styles.sellerBtnText}>
                Booster un article
              </AppText>
            </View>
          </AppPressable>
        ) : null}
      </ScrollView>

      {/* Bandeau de réassurance compact */}
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
            Livraison express à Daloa
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: spacing[2] },
  jumiaBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing[3],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    borderRadius: radii.xl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  zapBadge: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.families.black,
    fontSize: 13.5,
    letterSpacing: 0.4,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  timerText: {
    fontSize: 11,
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
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
    width: 150,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  photoContainer: { width: '100%', height: 118, backgroundColor: colors.grey[200], position: 'relative' },
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
  discountText: {
    fontSize: 10,
    color: '#DC2626',
    fontFamily: typography.families.black,
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
  featuredText: { fontSize: 9, fontFamily: typography.families.extrabold, letterSpacing: 0.5 },
  cardInfo: { padding: 8, gap: 3 },
  cardTitle: { fontSize: 12, lineHeight: 16, fontFamily: typography.families.semibold },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  salePrice: { fontVariant: ['tabular-nums'], fontSize: 13, fontFamily: typography.families.extrabold },
  originalPrice: { textDecorationLine: 'line-through', fontVariant: ['tabular-nums'], fontSize: 10 },
  stockBarTrack: {
    height: 15,
    borderRadius: radii.full,
    backgroundColor: '#FED7AA',
    overflow: 'hidden',
     justifyContent: 'center',
    marginTop: 2,
  },
  stockBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#EA580C',
    borderRadius: radii.full,
  },
  stockBarLabel: {
    fontSize: 9,
    textAlign: 'center',
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
  districtRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  districtText: { fontSize: 10 },
  sellerPromoCard: {
    width: 152,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sellerIconBox: { width: 36, height: 36, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  sellerCtaTitle: { fontSize: 12, textAlign: 'center' },
  sellerCtaSub: { fontSize: 10, textAlign: 'center', lineHeight: 13 },
  sellerBtn: { marginTop: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.full },
  sellerBtnText: { fontSize: 10, fontFamily: typography.families.bold },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11 },
});
