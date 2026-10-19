import React from 'react';
import { View, Linking, StyleProp, ViewStyle } from 'react-native';
import { Clock, Phone, Navigation, CheckCircle2, Zap, Package, Store } from 'lucide-react-native';
import { colors, spacing } from '../tokens';
import { useAccent } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';
import { formatFCFA, formatRelativeTime, Haptics } from '@daloa/utils';
import { deliveryOrderCardStyles as styles } from './deliveryOrderCardStyles';
import { BuyerReliabilityBadge } from './BuyerReliabilityBadge';

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
  is_express?: boolean;
  package_description?: string | null;
  package_type?: string | null;
  sender_name?: string | null;
  recipient_name?: string | null;
  payer_role?: 'sender' | 'recipient' | string | null;
  is_cod?: boolean;
  buyer_cod_reliability_score?: number | null;
  buyer_cod_delivered_count?: number | null;
  buyer_cod_refused_count?: number | null;
  is_grouped?: boolean;
  group_total_stops?: number;
  group_completed_stops?: number;
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
  const isExpress = Boolean(order.is_express);
  const isGrouped = Boolean(order.is_grouped);
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
      style={[styles.container, isExpress && styles.expressBorder, style]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong">Course #{order.id.slice(0, 6)}</AppText>
            {isExpress && (
              <View style={[styles.expressBadge, { backgroundColor: accent[50] }]}>
                <Zap size={11} color={accent.DEFAULT} />
                <AppText variant="overline" color={accent[700]}>
                  EXPRESS
                </AppText>
              </View>
            )}
            {isGrouped && (
              <View style={[styles.expressBadge, { backgroundColor: colors.status.infoLight }]}>
                <Store size={11} color={colors.status.infoDark} />
                <AppText variant="overline" color={colors.status.infoDark}>
                  TOURNÉE ({order.group_total_stops || 2})
                </AppText>
              </View>
            )}
          </View>
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

        {/* Gain net livreur */}
        <View style={[styles.earningsBadge, { backgroundColor: accent.DEFAULT }]}>
          <AppText variant="bodyStrong" color={colors.text.inverse} style={styles.earningsAmount} numberOfLines={1}>
            {formatFCFA(netEarnings)}
          </AppText>
          <AppText variant="overline" color="rgba(255,255,255,0.85)">
            Gain Net
          </AppText>
        </View>
      </View>

      {/* Description du colis si express */}
      {isExpress && order.package_description && (
        <View style={styles.packageBanner}>
          <Package size={12} color={colors.text.muted} />
          <AppText variant="caption" color={colors.text.body} numberOfLines={1}>
            {order.package_description}
          </AppText>
        </View>
      )}

      {/* Itinéraire */}
      <View style={styles.routeContainer}>
        <View style={styles.routeLine} />

        {/* Point Ramassage */}
        <View style={styles.routeStep}>
          <View style={[styles.dot, { backgroundColor: colors.status.warning }]} />
          <View style={styles.stepContent}>
            <AppText variant="overline" color={colors.text.subtle}>
              {isExpress ? 'Expéditeur (ramassage)' : 'Récupération (vendeur)'}
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
                accessibilityLabel={`Appeler ${order.seller_phone}`}
              >
                <Phone size={12} color={colors.status.success} />
                <AppText variant="caption" color={colors.status.successDark}>
                  {order.seller_phone}
                </AppText>
              </AppPressable>
            )}
          </View>
        </View>

        {/* Point Dépôt */}
        <View style={[styles.routeStep, { marginTop: spacing[3] }]}>
          <View style={[styles.dot, { backgroundColor: accent.DEFAULT }]} />
          <View style={styles.stepContent}>
            <AppText variant="overline" color={colors.text.subtle}>
              {isExpress ? 'Destinataire (remise)' : 'Livraison (acheteur)'}
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.stepLocation}>
              {order.dropoff_location}
            </AppText>
            {Boolean(order.is_cod) && (
              <BuyerReliabilityBadge
                compact
                score={order.buyer_cod_reliability_score}
                tier={
                  ((order.buyer_cod_refused_count ?? 0) >= 2)
                    ? 'at_risk'
                    : ((order.buyer_cod_refused_count ?? 0) === 1)
                    ? 'warning'
                    : ((order.buyer_cod_delivered_count ?? 0) === 0)
                    ? 'new_client'
                    : 'verified'
                }
                style={{ marginTop: 3 }}
              />
            )}
            {order.buyer_phone && (
              <AppPressable
                haptic="none"
                onPress={() => handleCall(order.buyer_phone)}
                style={styles.callLink}
                accessibilityRole="button"
                accessibilityLabel={`Appeler ${order.buyer_phone}`}
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
            accessibilityLabel="Valider la remise avec le code OTP"
          >
            <CheckCircle2 size={15} color={colors.text.inverse} />
            <AppText variant="label" color={colors.text.inverse}>
              Valider remise (OTP)
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

