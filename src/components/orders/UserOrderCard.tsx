import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { KeyRound, ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { formatDate, formatFCFA } from '@daloa/utils';

interface UserOrderCardProps {
  order: any;
  role: 'buyer' | 'seller';
}

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

export const UserOrderCard: React.FC<UserOrderCardProps> = ({ order, role }) => {
  const router = useRouter();
  const accent = useAccent();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'En attente', bg: colors.status.warningLight, text: colors.status.warningDark };
      case 'paid_escrow':
      case 'awaiting_pickup':
        return { label: 'Séquestre payé', bg: colors.status.infoLight, text: colors.status.infoDark };
      case 'in_transit':
      case 'picked_up':
        return { label: 'En livraison', bg: accent[50], text: accent[700] };
      case 'delivered':
        return { label: 'Livrée ✓', bg: colors.status.successLight, text: colors.status.successDark };
      case 'cancelled':
        return { label: 'Annulée', bg: colors.status.errorLight, text: colors.status.errorDark };
      default:
        return { label: status, bg: colors.bg.subtle, text: colors.text.body };
    }
  };

  const badge = getStatusBadge(order.status);
  const listing = order.listing || order.order_items?.[0]?.listing;
  const photo = listing?.photos?.[0] || FALLBACK_PHOTO;
  const otherItemsCount = (order.order_items?.length || 1) - 1;

  return (
    <AppPressable onPress={() => router.push(`/order/${order.id}` as any)} style={styles.card} accessibilityLabel={`Commande ${order.id.slice(0, 8)}`}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <AppText variant="caption" color={colors.text.muted}>
          Réf: #{order.id.slice(0, 8).toUpperCase()}
        </AppText>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <AppText variant="overline" color={badge.text}>
            {badge.label}
          </AppText>
        </View>
      </View>

      {/* Corps */}
      <View style={styles.cardBody}>
        <Image source={{ uri: photo }} style={styles.thumbnail} contentFit="cover" transition={180} cachePolicy="memory-disk" />
        <View style={styles.bodyDetails}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {listing?.title || 'Commande DaloaMarket'}
          </AppText>
          {otherItemsCount > 0 && (
            <AppText variant="caption" color={colors.text.subtle}>
              +{otherItemsCount} autre(s) article(s)
            </AppText>
          )}
          <View style={styles.priceRow}>
            <AppText variant="bodyStrong" color={accent[600]} style={styles.tnum}>
              {formatFCFA(order.total_amount || 0)}
            </AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              {formatDate(order.created_at)}
            </AppText>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        {role === 'buyer' && order.delivery_otp && (
          <View style={[styles.otpPill, { backgroundColor: accent[50] }]}>
            <KeyRound size={12} color={accent[600]} />
            <AppText variant="caption" color={accent[700]} style={styles.tnum}>
              OTP Réception: {order.delivery_otp}
            </AppText>
          </View>
        )}
        <View style={styles.detailsBtn}>
          <AppText variant="label" color={accent[600]}>
            Voir le suivi
          </AppText>
          <ChevronRight size={14} color={accent[600]} />
        </View>
      </View>
    </AppPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    marginBottom: spacing[2],
    gap: spacing[2],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  cardBody: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
  },
  bodyDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tnum: {
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.md,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
});
