import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { Haptics, getBoostDestination } from '@daloa/utils';
import { PromoBanner } from '@daloa/types';
import { promoBannersService } from '@daloa/api';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - spacing[3] * 2, 420);
const BANNER_HEIGHT = 158;
const AUTO_PLAY_MS = 4500;

const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: 'default-express',
    title: 'Coursier Express Daloa',
    subtitle: 'Colis, plis & repas livrés en 30 min entre quartiers dès 500 F',
    image_url:
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=80',
    badge_text: 'EXPRESS · DÈS 500 F',
    badge_color: '#EA580C',
    sponsor_name: 'DaloaDelivery',
    link_type: 'express',
    link_target: null,
    is_active: true,
    priority: 10,
    views_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-boost',
    title: 'Vendez 3x plus vite à Daloa',
    subtitle: 'Placez vos articles en tête d’accueil ou passez Vendeur Pro vérifié',
    image_url:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
    badge_text: 'VISIBILITÉ N°1',
    badge_color: '#D97706',
    sponsor_name: 'DaloaMarket Pro',
    link_type: 'none',
    link_target: '/pro/packs',
    is_active: true,
    priority: 5,
    views_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const HomeBannerCarousel: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();
  const { isAuthenticated, profile } = useAuth();
  const boostDestination = getBoostDestination(isAuthenticated, profile, {
    login: '/auth/login',
    myListings: '/seller/my-listings',
    packs: '/pro/packs',
  });
  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_BANNERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const active = await promoBannersService.getActiveBanners();
      const filtered = (active || []).filter((b: PromoBanner) => b.link_type !== 'referral');
      if (filtered.length === 1) {
        const companion = DEFAULT_BANNERS.find((d) => d.link_type !== filtered[0].link_type) ?? DEFAULT_BANNERS[1];
        setBanners([filtered[0], companion]);
      } else if (filtered.length > 1) {
        setBanners(filtered);
      }
    } catch {
      // Conserver les bannières par défaut
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    if (banners.length <= 1 || isDragging) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({
          x: next * (BANNER_WIDTH + spacing[2]),
          animated: true,
        });
        return next;
      });
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, isDragging]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (BANNER_WIDTH + spacing[2]));
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner: PromoBanner) => {
    Haptics.selection();
    promoBannersService.trackBannerClick(banner.id);

    switch (banner.link_type) {
      case 'express':
        router.push('/express' as any);
        return;
      case 'listing':
        if (banner.link_target) router.push(`/listing/${banner.link_target}` as any);
        return;
      case 'seller':
        if (banner.link_target) router.push(`/seller/${banner.link_target}` as any);
        return;
      case 'external':
        if (banner.link_target) Linking.openURL(banner.link_target).catch(() => {});
        return;
      default:
        if (banner.link_target === '/pro/packs') {
          router.push(boostDestination as any);
          return;
        }
        if (banner.link_target) router.push(banner.link_target as any);
        return;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + spacing[2]}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={() => setIsDragging(true)}
        onScrollEndDrag={() => setIsDragging(false)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollList}
      >
        {banners.map((b, idx) => (
          <AppPressable
            key={b.id}
            haptic="medium"
            onPress={() => handleBannerPress(b)}
            style={styles.bannerCard}
            accessibilityRole="button"
            accessibilityLabel={`${b.title}. ${b.subtitle || ''}`}
          >
            <ExpoImage
              source={{ uri: b.image_url }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={250}
            />

            <LinearGradient
              colors={['rgba(15,23,42,0.10)', 'rgba(15,23,42,0.45)', 'rgba(15,23,42,0.92)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.cardContent}>
              <View style={styles.topRow}>
                {b.badge_text ? (
                  <View style={[styles.badgeChip, { backgroundColor: b.badge_color || accent.DEFAULT }]}>
                    <AppText variant="overline" color="#FFFFFF" style={styles.badgeText}>
                      {b.badge_text}
                    </AppText>
                  </View>
                ) : (
                  <View />
                )}

                <View style={styles.topRightRow}>
                  {b.sponsor_name ? (
                    <View style={styles.sponsorChip}>
                      <AppText variant="caption" color="#F8FAFC" style={styles.sponsorText} numberOfLines={1}>
                        {b.sponsor_name}
                      </AppText>
                    </View>
                  ) : null}
                  {banners.length > 1 ? (
                    <View style={styles.counterChip}>
                      <AppText variant="caption" color="#FFFFFF" style={styles.counterText}>
                        {idx + 1}/{banners.length}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.textGroup}>
                  <AppText variant="h2" color="#FFFFFF" numberOfLines={1} style={styles.title}>
                    {b.title}
                  </AppText>
                  {b.subtitle ? (
                    <AppText variant="caption" color="rgba(255,255,255,0.92)" numberOfLines={2} style={styles.subtitle}>
                      {b.subtitle}
                    </AppText>
                  ) : null}
                </View>

                <View style={[styles.ctaPill, { backgroundColor: accent.DEFAULT }]}>
                  <AppText variant="caption" color="#FFFFFF" style={styles.ctaText}>
                    Voir
                  </AppText>
                  <ArrowRight size={12} color="#FFFFFF" strokeWidth={2.8} />
                </View>
              </View>
            </View>
          </AppPressable>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((b, i) => (
            <AppPressable
              key={`dot-${b.id}-${i}`}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => {
                setActiveIndex(i);
                scrollRef.current?.scrollTo({ x: i * (BANNER_WIDTH + spacing[2]), animated: true });
              }}
              accessibilityLabel={`Afficher la bannière ${b.title}`}
            >
              <View
                style={[
                  styles.dot,
                  i === activeIndex
                    ? { backgroundColor: accent.DEFAULT, width: 18 }
                    : { backgroundColor: colors.border.DEFAULT, width: 6 },
                ]}
              />
            </AppPressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: spacing[2], marginBottom: spacing[1] },
  scrollList: { paddingHorizontal: spacing[3], gap: spacing[2] },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  cardContent: { flex: 1, justifyContent: 'space-between', padding: spacing[3] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  badgeText: { fontSize: 9, fontFamily: typography.families.extrabold, letterSpacing: 0.4 },
  sponsorChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    maxWidth: 130,
  },
  sponsorText: { fontSize: 10, fontFamily: typography.families.semibold },
  counterChip: { backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.full },
  counterText: { fontSize: 10, fontFamily: typography.families.bold, fontVariant: ['tabular-nums'] },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  textGroup: { flex: 1, gap: 2 },
  title: { fontSize: 16, lineHeight: 20, fontFamily: typography.families.black },
  subtitle: { fontSize: 11, lineHeight: 14 },
  ctaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.full, flexShrink: 0 },
  ctaText: { fontSize: 11, fontFamily: typography.families.extrabold },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 6 },
  dot: { height: 5, borderRadius: radii.full },
});
