import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors, spacing, typography } from '../tokens';
import { Haptics } from '@daloa/utils';

export interface RatingStarsProps {
  rating: number | null | undefined;
  totalReviews?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
  showText?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating = 5.0,
  totalReviews,
  size = 14,
  interactive = false,
  onRatingChange,
  showText = true,
}) => {
  const currentRating = rating ?? 5.0;

  const handleStarPress = (starIndex: number) => {
    if (!interactive) return;
    Haptics.selection();
    onRatingChange?.(starIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= Math.round(currentRating);
          return (
            <TouchableOpacity
              key={starIndex}
              disabled={!interactive}
              onPress={() => handleStarPress(starIndex)}
              activeOpacity={0.7}
              style={{ marginRight: 2 }}
            >
              <Star
                size={size}
                color="#F59E0B"
                fill={isFilled ? '#F59E0B' : 'transparent'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {showText && (
        <Text style={styles.ratingText}>
          {currentRating.toFixed(1)}
          {totalReviews != null && ` (${totalReviews})`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[1] + 2,
  },
  ratingText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
