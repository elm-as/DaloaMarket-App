import React from 'react';
import { View, StyleSheet, Linking, StyleProp, ViewStyle } from 'react-native';
import { Clock, Phone, Navigation, CheckCircle2 } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { useAccent } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';
import { formatFCFA, formatRelativeTime, Haptics } from '@daloa/utils';

export interface DeliveryOrderCardData {
  id: string;
  status: string;
  delivery_price: number;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  seller_phone?: string | null;
  buyer_phone?: string | null;
  created_at: string;
}

export interface DeliveryOrderCardProps {
  order: DeliveryOrderCardData;
  onPress: () => void;
  onAccept?: (id: string) => void;
  onVerifyPickupOtp?: (order: DeliveryOrderCardData) => void;
  onVerifyDeliveryOtp?: (order: DeliveryOrderCardData) => void;
  style?: StyleProp<ViewStyle>;
}

export const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  onPress,
  onAccept,
  onVerifyPickupOtp,
  onVerifyDeliveryOtp,
  style,
}) => {
  const accent = useAccent();

  const isAwaitingPickup = order.status === 'awaiting_pickup';
  const isAccepted = order.status === 'accepted';
  const isPickedUp = ['picked_up', 'in_transit'].includes(order.status);

  const netEarnings = Math.round(order.delivery_price * 0.9);

  const getStatusLabel = () => {
    switch (order.status) {
      case 'awaiting_pickup':
        return 'Disponible';
      case 'accepted':
        return 'En ramassage';
      case 'picked_up':
      case 'in_transit':
        return 'En livraison';
      case 'delivered':
        return 'Livrée';
      default:
        return order.status;
    }
  };

  const getStatusStyle = () => {
    switch (order.status) {
      case 'awaiting_pickup':
        return { bg: accent[50], text: accent[700] };
      case 'accepted':
        return { bg: colors.status.warningLight, text: colors.status.warningDark };
      case 'picked_up':
      case 'in_transit':
        return { bg: accent[50], text: accent[700] };
      case 'delivered':
        return { bg: colors.status.successLight, text: colors.status.successDark };
      default:
        return { bg: colors.bg.subtle, text: colors.text.body };
    }
  };

  const statusStyle = getStatusStyle();

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    Haptics.lightImpact();
    Linking.openURL(`tel:${phone}`);
  };

  const handleNav = () => {
    Haptics.lightImpact();
    const isPickup = isAccepted;
    const lat = isPickup ? order.pickup_lat : order.dropoff_lat;
    const lng = isPickup ? order.pickup_lng : order.dropoff_lng;
    const loc = isPickup ? order.pickup_location : order.dropoff_location;

    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(`${loc}, Daloa, Côte d'Ivoire`);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=two_wheeler`);
  };

  return (
    <AppPressable
      onPress={onPress}
      haptic="none"
      pressedOpacity={0.95}
      style={[styles.container, style]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="bodyStrong">Course #{order.id.slice(0, 6)}</AppText>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <AppText variant="overline" color={statusStyle.text}>
                {getStatusLabel()}
              </AppText>
            </View>
            <View style={styles.timeMeta}>
              <Clock size={11} color={colors.text.subtle} />
              <AppText variant="caption" color={colors.text.subtle}>
                {formatRelativeTime(order.created_at)}
              </AppText>
            </View>
          </View>
        </View>

        {/* Gain net — le héros de la carte (accent de l'app) */}
        <View style={[styles.earningsBadge, { backgroundColor: accent.DEFAULT }]}>
          <AppText variant="bodyStrong" color={colors.text.inverse} style={styles.earningsAmount}>
            {formatFCFA(netEarnings)}
          </AppText>
          <AppText variant="overline" color="rgba(255,255,255,0.85)">
            Gain Net
          </AppText>
        </View>
      </View>

      {/* Itinéraire */}
      <View style={styles.routeContainer}>
        <View style={styles.routeLine} />

        {/* Point Ramassage (Vendeur) */}
        <View style={styles.routeStep}>
          <View style={[styles.dot, { backgroundColor: colors.status.warning }]} />
          <View style={styles.stepContent}>
            <AppText variant="overline" color={colors.text.subtle}>
              Récupération (vendeur)
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.stepLocation}>
              {order.pickup_location}
            </AppText>
            {order.seller_phone && (
              <AppPressable
                haptic="none"
                onPress={() => handleCall(order.seller_phone)}
                style={styles.callLink}
                accessibilityRole="button"
                accessibilityLabel={`Appeler le vendeur ${order.seller_phone}`}
              >
                <Phone size={12} color={colors.status.success} />
                <AppText variant="caption" color={colors.status.successDark}>
                  {order.seller_phone}
                </AppText>
              </AppPressable>
            )}
          </View>
        </View>

        {/* Point Livraison (Acheteur) */}
        <View style={[styles.routeStep, { marginTop: spacing[3] }]}>
          <View style={[styles.dot, { backgroundColor: accent.DEFAULT }]} />
          <View style={styles.stepContent}>
            <AppText variant="overline" color={colors.text.subtle}>
              Livraison (acheteur)
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.stepLocation}>
              {order.dropoff_location}
            </AppText>
            {order.buyer_phone && (
              <AppPressable
                haptic="none"
                onPress={() => handleCall(order.buyer_phone)}
                style={styles.callLink}
                accessibilityRole="button"
                accessibilityLabel={`Appeler l'acheteur ${order.buyer_phone}`}
              >
                <Phone size={12} color={accent.DEFAULT} />
                <AppText variant="caption" color={accent[700]}>
                  {order.buyer_phone}
                </AppText>
              </AppPressable>
            )}
          </View>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionsBar}>
        {isAwaitingPickup && onAccept && (
          <AppPressable
            haptic="medium"
            onPress={() => onAccept(order.id)}
            rippleColor="rgba(255,255,255,0.24)"
            style={[styles.primaryAction, { backgroundColor: accent.DEFAULT }]}
            accessibilityRole="button"
            accessibilityLabel="Accepter la course"
          >
            <AppText variant="label" color={colors.text.inverse}>
              Accepter la course
            </AppText>
          </AppPressable>
        )}

        {isAccepted && onVerifyPickupOtp && (
          <AppPressable
            haptic="medium"
            onPress={() => onVerifyPickupOtp(order)}
            rippleColor="rgba(255,255,255,0.24)"
            style={[styles.primaryAction, { backgroundColor: accent.DEFAULT }]}
            accessibilityRole="button"
            accessibilityLabel="Valider la récupération avec le code OTP"
          >
            <CheckCircle2 size={15} color={colors.text.inverse} />
            <AppText variant="label" color={colors.text.inverse}>
              Valider récupération (OTP)
            </AppText>
          </AppPressable>
        )}

        {isPickedUp && onVerifyDeliveryOtp && (
          <AppPressable
            haptic="medium"
            onPress={() => onVerifyDeliveryOtp(order)}
            rippleColor="rgba(255,255,255,0.24)"
            style={[styles.primaryAction, { backgroundColor: colors.status.success }]}
            accessibilityRole="button"
            accessibilityLabel="Valider la remise au client avec le code OTP"
          >
            <CheckCircle2 size={15} color={colors.text.inverse} />
            <AppText variant="label" color={colors.text.inverse}>
              Valider remise client (OTP)
            </AppText>
          </AppPressable>
        )}

        {/* Bouton GPS */}
        {(isAccepted || isPickedUp) && (
          <AppPressable
            haptic="light"
            onPress={handleNav}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'itinéraire GPS"
          >
            <Navigation size={15} color={colors.text.body} />
          </AppPressable>
        )}
      </View>
    </AppPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  earningsBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  earningsAmount: {
    fontVariant: ['tabular-nums'],
  },
  routeContainer: {
    position: 'relative',
    paddingLeft: 4,
    paddingVertical: 4,
  },
  routeLine: {
    position: 'absolute',
    left: 9,
    top: 14,
    bottom: 14,
    width: 2,
    backgroundColor: colors.border.DEFAULT,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  stepContent: {
    flex: 1,
  },
  stepLocation: {
    marginTop: 1,
  },
  callLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  primaryAction: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
