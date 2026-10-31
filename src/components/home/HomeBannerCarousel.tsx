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
import { ArrowRight, Zap, Gift, Sparkles, Flame } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { PromoBanner } from '@daloa/types';
import { promoBannersService } from '@daloa/api';
import { usePhase } from '../../context/PhaseContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - spacing[3] * 2, 420);
const BANNER_HEIGHT = 176;
const AUTO_PLAY_MS = 4500;

const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: 'default-express',
    title: 'Coursier Express Daloa',
    subtitle: 'Colis, plis & repas livrés en 30 min entre quartiers dès 500 F',
    image_url:
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=80',
    badge_text: '⚡ EXPRESS · DÈS 500 F',
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
    id: 'default-referral',
    title: 'Programme Daloa Cash',
    subtitle: 'Invitez vos proches et gagnez 500 FCFA par ami inscrit',
    image_url:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80',
    badge_text: '🎁 BONUS +500 F',
    badge_color: '#16A34A',
    sponsor_name: 'DaloaMarket',
    link_type: 'referral',
    link_target: null,
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
  const { enableBoost, enableSellerBadge } = usePhase();
  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_BANNERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const active = await promoBannersService.getActiveBanners();
      if (active && active.length > 0) {
        setBanners(active);
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
      case 'referral':
        router.push('/profile/referral' as any);
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
        return;
    }
  };

  const quickPills = [
    {
      key: 'flash',
      label: 'Ventes Flash',
      icon: <Flame size={13} color="#DC2626" />,
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
      onPress: () => router.push('/(tabs)/search' as any),
    },
    {
      key: 'express',
      label: 'Coursier 500F',
      icon: <Zap size={13} color={accent[700]} />,
      bg: accent[50],
      border: accent[200],
      text: accent[900],
      onPress: () => router.push('/express' as any),
    },
    {
      key: 'cash',
      label: 'Daloa Cash',
      icon: <Gift size={13} color="#15803D" />,
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#14532D',
      onPress: () => router.push('/profile/referral' as any),
    },
    ...(enableBoost
      ? [
          {
            key: 'boost',
            label: 'Booster',
            icon: <Sparkles size={13} color="#B45309" />,
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#78350F',
            onPress: () => router.push('/pro/packs' as any),
          },
        ]
      : enableSellerBadge
        ? [
            {
              key: 'pro',
              label: 'Pass Pro',
              icon: <Sparkles size={13} color="#B45309" />,
              bg: '#FFFBEB',
              border: '#FDE68A',
              text: '#78350F',
              onPress: () => router.push('/pro/become-pro' as any),
            },
          ]
        : []),
  ];

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

            {/* Dégradé directionnel façon Jumia : préserve l'éclat du produit en haut/droite */}
            <LinearGradient
              colors={['rgba(15,23,42,0.10)', 'rgba(15,23,42,0.45)', 'rgba(15,23,42,0.92)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.cardContent}>
              {/* Ligne supérieure : Badge promo + Compteur / Sponsor */}
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

              {/* Bas d'affiche : Titre, Sous-titre + Bouton d'appel à l'action Jumia */}
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
                    J'en profite
                  </AppText>
                  <ArrowRight size={12} color="#FFFFFF" strokeWidth={2.8} />
                </View>
              </View>
            </View>
          </AppPressable>
        ))}
      </ScrollView>

      {/* Indicateurs de pagination Jumia */}
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((b, i) => (
            <View
              key={`dot-${b.id}-${i}`}
              style={[
                styles.dot,
                i === activeIndex
                  ? { backgroundColor: accent.DEFAULT, width: 20 }
                  : { backgroundColor: colors.border.DEFAULT, width: 6 },
              ]}
            />
          ))}
        </View>
      )}

      {/* Barre de raccourcis rapides façon Jumia */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickStrip}
      >
        {quickPills.map((pill) => (
          <AppPressable
            key={pill.key}
            haptic="selection"
            onPress={pill.onPress}
            style={[styles.quickPill, { backgroundColor: pill.bg, borderColor: pill.border }]}
          >
            {pill.icon}
            <AppText variant="caption" color={pill.text} style={styles.quickPillLabel}>
              {pill.label}
            </AppText>
          </AppPressable>
        ))}
      </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: { flex: 1, justifyContent: 'space-between', padding: spacing[3] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radii.full,
  },
  badgeText: { fontSize: 9.5, fontFamily: typography.families.extrabold, letterSpacing: 0.5 },
  sponsorChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radii.full,
    maxWidth: 130,
  },
  sponsorText: { fontSize: 10, fontFamily: typography.families.semibold },
  counterChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  counterText: { fontSize: 10, fontFamily: typography.families.bold, fontVariant: ['tabular-nums'] },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  textGroup: { flex: 1, gap: 2 },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.families.black,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 15,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  ctaText: { fontSize: 11, fontFamily: typography.families.extrabold },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 7 },
  dot: { height: 5, borderRadius: radii.full },
  quickStrip: {
    paddingHorizontal: spacing[3],
    paddingTop: 8,
    paddingBottom: 2,
    gap: 8,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  quickPillLabel: { fontSize: 11, fontFamily: typography.families.bold },
});
