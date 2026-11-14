import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { radii, spacing, AppText, AppPressable, typography } from '@daloa/ui';
import { PromoBanner } from '@daloa/types';
import { BANNER_HEIGHT } from './homeBannerConfig';

interface HomeBannerSlideProps {
  banner: PromoBanner;
  realIndex: number;
  total: number;
  width: number;
  accentColor: string;
  onPress: (banner: PromoBanner) => void;
}

/**
 * Carte visuelle d'une bannière du carrousel d'accueil mobile.
 */
export const HomeBannerSlide: React.FC<HomeBannerSlideProps> = ({
  banner,
  realIndex,
  total,
  width,
  accentColor,
  onPress,
}) => (
  <AppPressable
    haptic="medium"
    onPress={() => onPress(banner)}
    style={[styles.bannerCard, { width }]}
    accessibilityRole="button"
    accessibilityLabel={`${banner.title}. ${banner.subtitle || ''}`}
  >
    <ExpoImage
      source={{ uri: banner.image_url }}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      transition={0}
    />

    <LinearGradient
      colors={['rgba(15,23,42,0.10)', 'rgba(15,23,42,0.45)', 'rgba(15,23,42,0.92)']}
      locations={[0, 0.45, 1]}
      style={StyleSheet.absoluteFillObject}
    />

    <View style={styles.cardContent}>
      <View style={styles.topRow}>
        {banner.badge_text ? (
          <View style={[styles.badgeChip, { backgroundColor: banner.badge_color || accentColor }]}>
            <AppText variant="overline" color="#FFFFFF" style={styles.badgeText}>
              {banner.badge_text}
            </AppText>
          </View>
        ) : (
          <View />
        )}

        <View style={styles.topRightRow}>
          {banner.sponsor_name ? (
            <View style={styles.sponsorChip}>
              <AppText variant="caption" color="#F8FAFC" style={styles.sponsorText} numberOfLines={1}>
                {banner.sponsor_name}
              </AppText>
            </View>
          ) : null}
          {total > 1 ? (
            <View style={styles.counterChip}>
              <AppText variant="caption" color="#FFFFFF" style={styles.counterText}>
                {realIndex + 1}/{total}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.textGroup}>
          <AppText variant="h2" color="#FFFFFF" numberOfLines={1} style={styles.title}>
            {banner.title}
          </AppText>
          {banner.subtitle ? (
            <AppText variant="caption" color="rgba(255,255,255,0.92)" numberOfLines={2} style={styles.subtitle}>
              {banner.subtitle}
            </AppText>
          ) : null}
        </View>

        <View style={[styles.ctaPill, { backgroundColor: accentColor }]}>
          <AppText variant="caption" color="#FFFFFF" style={styles.ctaText}>
            Voir
          </AppText>
          <ArrowRight size={12} color="#FFFFFF" strokeWidth={2.8} />
        </View>
      </View>
    </View>
  </AppPressable>
);

const styles = StyleSheet.create({
  bannerCard: {
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
});
