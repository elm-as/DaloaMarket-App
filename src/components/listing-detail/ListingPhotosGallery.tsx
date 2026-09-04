import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Share2, Heart, Flag, Home } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable } from '@daloa/ui';

interface ListingPhotosGalleryProps {
  photos: string[];
  screenWidth: number;
  isFavorite: boolean;
  onBack: () => void;
  onGoHome?: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onReport: () => void;
}

const FALLBACK = 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=600';

export const ListingPhotosGallery: React.FC<ListingPhotosGalleryProps> = ({
  photos: rawPhotos,
  screenWidth,
  isFavorite,
  onBack,
  onGoHome,
  onShare,
  onToggleFavorite,
  onReport,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photos = rawPhotos && rawPhotos.length > 0 ? rawPhotos : [FALLBACK];

  return (
    <View style={styles.galleryContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const slide = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setActivePhotoIndex(slide);
        }}
        scrollEventThrottle={16}
      >
        {photos.map((photo: string, index: number) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={[styles.galleryImage, { width: screenWidth || '100%' }]}
            contentFit="cover"
            transition={Platform.OS === 'web' ? 0 : 220}
            cachePolicy="memory-disk"
          />
        ))}
      </ScrollView>

      {/* Floating top-left: back and home buttons */}
      <View style={styles.floatLeft}>
        <AppPressable
          onPress={onBack}
          rippleBorderless
          haptic="light"
          style={styles.floatBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={20} color={colors.text.inverse} />
        </AppPressable>

        {onGoHome && (
          <AppPressable
            onPress={onGoHome}
            rippleBorderless
            haptic="light"
            style={styles.floatBtn}
            accessibilityRole="button"
            accessibilityLabel="Retour à l'accueil"
          >
            <Home size={17} color={colors.text.inverse} />
          </AppPressable>
        )}
      </View>

      {/* Floating top-right: share, heart, report */}
      <View style={styles.floatRight}>
        <AppPressable
          onPress={onShare}
          rippleBorderless
          haptic="light"
          style={styles.floatBtn}
          accessibilityLabel="Partager"
        >
          <Share2 size={16} color={colors.text.inverse} />
        </AppPressable>
        <AppPressable
          onPress={onToggleFavorite}
          rippleBorderless
          haptic="light"
          style={styles.floatBtn}
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            size={16}
            color={isFavorite ? colors.status.error : colors.text.inverse}
            fill={isFavorite ? colors.status.error : 'transparent'}
          />
        </AppPressable>
        <AppPressable
          onPress={onReport}
          rippleBorderless
          haptic="light"
          style={styles.floatBtn}
          accessibilityLabel="Signaler l'annonce"
        >
          <Flag size={16} color={colors.text.inverse} />
        </AppPressable>
      </View>

      {/* Dots pagination */}
      {photos.length > 1 && (
        <View style={styles.dotsRow}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activePhotoIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* "X / Y" badge when no dots (single photo) */}
      {photos.length === 1 && (
        <View style={styles.singleBadge}>
          <AppText variant="caption" color={colors.text.inverse}>
            1 photo
          </AppText>
        </View>
      )}
    </View>
  );
};

const FROSTED = 'rgba(0,0,0,0.42)';

const styles = StyleSheet.create({
  galleryContainer: {
    width: '100%',
    height: 320,
    backgroundColor: colors.bg.subtle,
    position: 'relative',
  },
  galleryImage: {
    height: 320,
  },
  floatLeft: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  floatRight: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.xl,
    backgroundColor: FROSTED,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing[3],
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  dot: {
    height: 6,
    borderRadius: radii.full,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary.DEFAULT,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  singleBadge: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
  },
});
