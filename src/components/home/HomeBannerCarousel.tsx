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
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { PromoBanner } from '@daloa/types';
import { promoBannersService } from '@daloa/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.min(SCREEN_WIDTH - spacing[3] * 2, 420);
const BANNER_HEIGHT = 164;

const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: 'default-express',
    title: 'Coursier Express Daloa',
    subtitle: 'Envoi direct de colis, plis et repas entre quartiers dès 500 F',
    image_url:
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=80',
    badge_text: 'NOUVEAU',
    badge_color: '#FF9800',
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
    subtitle: 'Gagnez 500 FCFA pour chaque ami invité sur l’application',
    image_url:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80',
    badge_text: 'BON PLAN',
    badge_color: '#16A34A',
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
  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_BANNERS);
  const [activeIndex, setActiveIndex] = useState(0);
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
        break;
      case 'referral':
        router.push('/profile/referral' as any);
        break;
      case 'listing':
        if (banner.link_target) {
          router.push(`/listing/${banner.link_target}` as any);
        }
        break;
      case 'seller':
        if (banner.link_target) {
          router.push(`/seller/${banner.link_target}` as any);
        }
        break;
      case 'external':
        if (banner.link_target) {
          Linking.openURL(banner.link_target).catch(() => {});
        }
        break;
      default:
        break;
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
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollList}
      >
        {banners.map((b) => (
          <AppPressable
            key={b.id}
            haptic="medium"
            onPress={() => handleBannerPress(b)}
            style={styles.bannerCard}
            accessibilityRole="button"
            accessibilityLabel={`${b.title}. ${b.subtitle || ''}`}
          >
            {/* Image de fond HD */}
            <ExpoImage
              source={{ uri: b.image_url }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={300}
            />

            {/* Dégradé sombre pour lisibilité absolue du texte */}
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Contenu de l'affiche */}
            <View style={styles.cardContent}>
              {/* Badge publicitaire / informatif */}
              {b.badge_text ? (
                <View
                  style={[
                    styles.badgeChip,
                    { backgroundColor: b.badge_color || accent.DEFAULT },
                  ]}
                >
                  <AppText variant="overline" color="#FFFFFF" style={styles.badgeText}>
                    {b.badge_text}
                  </AppText>
                </View>
              ) : null}

              {/* Titre et sous-titre */}
              <View style={styles.textGroup}>
                <AppText variant="h2" color="#FFFFFF" numberOfLines={1} style={styles.title}>
                  {b.title}
                </AppText>
                {b.subtitle ? (
                  <AppText variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={2} style={styles.subtitle}>
                    {b.subtitle}
                  </AppText>
                ) : null}
              </View>

              {/* CTA discret */}
              <View style={styles.ctaRow}>
                <AppText variant="caption" color="#FFFFFF" style={styles.ctaText}>
                  Découvrir
                </AppText>
                <ArrowRight size={13} color="#FFFFFF" />
              </View>
            </View>
          </AppPressable>
        ))}
      </ScrollView>

      {/* Indicateur de pagination (dots) */}
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View
              key={`dot-${i}`}
              style={[
                styles.dot,
                i === activeIndex
                  ? { backgroundColor: accent.DEFAULT, width: 18 }
                  : { backgroundColor: colors.border.DEFAULT, width: 6 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  scrollList: {
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing[3],
  },
  badgeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: typography.families.extrabold,
    letterSpacing: 0.6,
  },
  textGroup: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.families.extrabold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 11,
    fontFamily: typography.families.bold,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: radii.full,
  },
});
