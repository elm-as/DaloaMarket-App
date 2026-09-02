import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star, Package } from 'lucide-react-native';
import { Avatar, AppText, colors, radii, spacing } from '@daloa/ui';
import { formatDate } from '@daloa/utils';

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer: { full_name: string; avatar_url?: string | null };
}

interface ListingReviewsSectionProps {
  reviews: Review[];
  avgRating: number;
}

export const ListingReviewsSection: React.FC<ListingReviewsSectionProps> = ({ reviews, avgRating }) => (
  <View style={styles.section}>
    <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
      Avis des acheteurs
    </AppText>

    <View style={styles.card}>
      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Package size={22} color={colors.text.subtle} />
          </View>
          <AppText variant="bodyStrong" color={colors.text.body} center>
            Aucun avis pour le moment
          </AppText>
          <AppText variant="caption" color={colors.text.muted} center>
            Soyez le premier à donner votre avis après votre achat.
          </AppText>
        </View>
      ) : (
        <>
          {/* Résumé note globale */}
          <View style={styles.ratingHeader}>
            <View style={styles.ratingScore}>
              <AppText variant="h1" color="#F59E0B" style={styles.scoreText}>
                {avgRating.toFixed(1)}
              </AppText>
              <AppText variant="overline" color={colors.text.muted}>
                SUR 5
              </AppText>
            </View>
            <View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    color="#F59E0B"
                    fill={s <= Math.round(avgRating) ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </View>
              <AppText variant="caption" color={colors.text.subtle} style={styles.reviewCount}>
                {reviews.length} évaluation{reviews.length > 1 ? 's' : ''} vérifiée{reviews.length > 1 ? 's' : ''}
              </AppText>
            </View>
          </View>

          {/* Liste avis */}
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerRow}>
                  <Avatar
                    name={review.reviewer.full_name}
                    uri={review.reviewer.avatar_url || undefined}
                    size={28}
                  />
                  <AppText variant="label" color={colors.text.body}>
                    {review.reviewer.full_name}
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.text.muted}>
                  {formatDate(review.created_at)}
                </AppText>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    color="#F59E0B"
                    fill={s <= review.rating ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </View>
              {review.comment ? (
                <AppText variant="body" color={colors.grey[600]} style={styles.comment}>
                  {review.comment}
                </AppText>
              ) : null}
            </View>
          ))}
        </>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginTop: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[2],
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[3],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[1],
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: '#FFFBEB',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  ratingScore: {
    alignItems: 'center',
  },
  scoreText: {
    lineHeight: 36,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    marginTop: 3,
  },
  reviewItem: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginTop: spacing[2],
    gap: spacing[1],
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  comment: {
    marginTop: 4,
    lineHeight: 18,
  },
});
