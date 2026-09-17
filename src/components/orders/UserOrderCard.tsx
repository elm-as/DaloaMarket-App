import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { KeyRound, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { formatDate, formatFCFA, resolveListingPhoto, Haptics } from '@daloa/utils';

interface UserOrderCardProps {
  order: any;
  role: 'buyer' | 'seller';
}

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

export const UserOrderCard: React.FC<UserOrderCardProps> = ({ order, role }) => {
  const router = useRouter();
  const accent = useAccent();
  const [isOtpRevealed, setIsOtpRevealed] = useState(false);

  // Domaine réel de `orders.status` (contrainte CHECK) : les anciens `case`
  // portaient sur des valeurs jamais écrites, donc `pending` et `paid` — les plus
  // fréquentes — s'affichaient en anglais brut dans la liste des commandes.
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', bg: colors.status.warningLight, text: colors.status.warningDark };
      case 'paid':
        return { label: 'Paiement sécurisé', bg: colors.status.infoLight, text: colors.status.infoDark };
      case 'in_transit':
        return { label: 'En livraison', bg: accent[50], text: accent[700] };
      case 'delivered':
      case 'completed':
        return { label: 'Livrée', bg: colors.status.successLight, text: colors.status.successDark };
      case 'disputed':
        return { label: 'Litige', bg: colors.status.warningLight, text: colors.status.warningDark };
      case 'cancelled':
        return { label: 'Annulée', bg: colors.status.errorLight, text: colors.status.errorDark };
      default:
        return { label: 'En cours', bg: colors.bg.subtle, text: colors.text.body };
    }
  };

  const badge = getStatusBadge(order.status);
  const listing = order.listing || order.order_items?.[0]?.listing;
  // `photos[0]` pouvait être une URI locale d'appareil (téléversement échoué) :
  // la vignette restait alors désespérément blanche.
  const photo = resolveListingPhoto(listing?.photos, FALLBACK_PHOTO);
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
        {/*
          Le code de réception était affiché en clair dans la liste, alors qu'il est
          masqué partout ailleurs (web `BuyerSection`, écran de suivi mobile).
          Quiconque jetait un œil à l'écran pouvait le lire, et il suffit à faire
          valider une livraison. Il est désormais révélé à la demande, comme sur le web.
        */}
        {role === 'buyer' && order.delivery_otp && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.selection();
              setIsOtpRevealed((prev) => !prev);
            }}
            style={[styles.otpPill, { backgroundColor: accent[50] }]}
            accessibilityRole="button"
            accessibilityLabel={isOtpRevealed ? 'Masquer le code OTP' : 'Révéler le code OTP'}
          >
            <KeyRound size={12} color={accent[600]} />
            <AppText
              variant="caption"
              color={accent[700]}
              // `typography.families` n'expose pas de police monospace ; les chiffres
              // tabulaires suffisent à aligner le code proprement.
              style={isOtpRevealed ? { fontFamily: typography.families.bold, letterSpacing: 1.5 } : undefined}
            >
              {isOtpRevealed ? `Code : ${order.delivery_otp}` : 'Code : ••••'}
            </AppText>
            {isOtpRevealed ? (
              <EyeOff size={12} color={accent[600]} />
            ) : (
              <Eye size={12} color={accent[600]} />
            )}
          </TouchableOpacity>
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
