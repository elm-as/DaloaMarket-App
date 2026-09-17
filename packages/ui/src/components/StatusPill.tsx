import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';

export type StatusPillType =
  | 'pending_payment'
  | 'awaiting_pickup'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'disputed'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'completed'
  | 'auto_released'
  | 'pending_seller_confirmation';

export interface StatusPillProps {
  status: StatusPillType | string;
  label?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, size = 'md', style }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'delivered':
      case 'completed':
      case 'auto_released':
        return {
          bg: colors.status.successLight,
          text: colors.status.successDark,
          defaultLabel: 'Livré',
          dotColor: colors.status.success,
        };
      case 'picked_up':
      case 'in_transit':
        return {
          bg: colors.primary[50],
          text: colors.primary[700],
          defaultLabel: 'En livraison',
          dotColor: colors.primary.DEFAULT,
        };
      case 'accepted':
        return {
          bg: colors.secondary[50],
          text: colors.secondary[700],
          defaultLabel: 'Livreur assigné',
          dotColor: colors.secondary.DEFAULT,
        };
      case 'awaiting_pickup':
        return {
          bg: colors.primary[50],
          text: colors.primary[600],
          defaultLabel: 'En attente ramassage',
          dotColor: colors.primary[600],
        };
      // `pending` est la valeur reellement ecrite dans `orders.status` ;
      // `pending_payment` n'existe dans aucun chemin d'ecriture mais reste accepte
      // pour les anciens appels.
      case 'pending':
      case 'pending_payment':
        return {
          bg: colors.status.warningLight,
          text: colors.status.warningDark,
          defaultLabel: 'Paiement en attente',
          dotColor: colors.status.warning,
        };
      case 'paid':
        return {
          bg: colors.status.infoLight,
          text: colors.status.infoDark,
          defaultLabel: 'Paiement securise',
          dotColor: colors.status.info,
        };
      case 'pending_seller_confirmation':
        return {
          bg: colors.status.warningLight,
          text: colors.status.warningDark,
          defaultLabel: 'En attente du vendeur',
          dotColor: colors.status.warning,
        };
      case 'disputed':
        return {
          bg: colors.status.errorLight,
          text: colors.status.errorDark,
          defaultLabel: 'Litige ouvert',
          dotColor: colors.status.error,
        };
      case 'cancelled':
        return {
          bg: colors.bg.subtle,
          text: colors.grey[600],
          defaultLabel: 'Annulé',
          dotColor: colors.grey[400],
        };
      default:
        // Ne jamais afficher le code brut : un statut inconnu reste lisible.
        return {
          bg: colors.bg.subtle,
          text: colors.text.body,
          defaultLabel: 'En cours',
          dotColor: colors.grey[400],
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? spacing[2] : spacing[3],
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text
        style={[
          styles.label,
          {
            color: config.text,
            fontSize: isSmall ? typography.sizes.xs : typography.sizes.sm,
            fontFamily: typography.families.semibold,
          },
        ]}
      >
        {label || config.defaultLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    letterSpacing: 0.2,
  },
});
