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

/**
 * Affichage des étoiles de notation fidèle à la réalité des avis.
 * Évite rigoureusement les fausses notes par défaut (pas de 5.0 fictif avec 0 avis).
 */
export const RatingStars: React.FC<RatingStarsProps> = ({
  rating = 0,
  totalReviews,
  size = 14,
  interactive = false,
  onRatingChange,
  showText = true,
}) => {
  const hasReviews = totalReviews != null && totalReviews > 0;
  const currentRating = hasReviews ? (rating ?? 0) : (interactive ? (rating ?? 0) : 0);

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
                color={hasReviews || interactive ? '#F59E0B' : colors.grey[300]}
                fill={isFilled ? '#F59E0B' : 'transparent'}
                strokeWidth={1.8}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {showText && (
        <Text style={styles.ratingText}>
          {hasReviews ? (
            <>
              <Text style={styles.tabularNums}>{currentRating.toFixed(1)}</Text>
              <Text style={styles.subtleText}>{` (${totalReviews})`}</Text>
            </>
          ) : (
            <Text style={styles.subtleText}>Nouveau (0 avis)</Text>
          )}
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
    color: colors.grey[600],
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.medium,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
    fontFamily: typography.families.extrabold,
    color: '#D97706',
  },
  subtleText: {
    color: colors.grey[400],
    fontSize: 11,
  },
});

export default RatingStars;
