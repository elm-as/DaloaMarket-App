import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Package, Truck, Store, Share2, Tag } from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable, useAccent } from '@daloa/ui';

interface ProfileQuickActionsProps {
  onPublishListing?: () => void;
  onOpenMyListings: () => void;
  onOpenOrders: () => void;
  onOpenDeliverers: () => void;
  onOpenShop: () => void;
  onShareShopWhatsApp: () => void;
  /** Achats en cours + ventes à traiter (0 = pas de pastille). */
  activeOrdersCount?: number;
}

/**
 * Raccourcis du profil : une seule carte qui déborde sur le bandeau, en
 * colonnes égales — tout est visible sans défiler. « Publier » n'y figure pas :
 * c'est l'onglet central « Vendre ».
 */
export const ProfileQuickActions: React.FC<ProfileQuickActionsProps> = ({
  onOpenMyListings,
  onOpenOrders,
  onOpenDeliverers,
  onOpenShop,
  onShareShopWhatsApp,
  activeOrdersCount = 0,
}) => {
  const accent = useAccent();
  const items = [
    { label: 'Annonces', icon: Tag, onPress: onOpenMyListings, badge: 0 },
    { label: 'Commandes', icon: Package, onPress: onOpenOrders, badge: activeOrdersCount },
    { label: 'Livreurs', icon: Truck, onPress: onOpenDeliverers, badge: 0 },
    { label: 'Boutique', icon: Store, onPress: onOpenShop, badge: 0 },
    { label: 'Partager', icon: Share2, onPress: onShareShopWhatsApp, badge: 0 },
  ];

  return (
    <View style={styles.card}>
      {items.map(({ label, icon: Icon, onPress, badge }) => (
        <AppPressable key={label} onPress={onPress} style={styles.item} accessibilityLabel={label}>
          <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
            <Icon size={20} color={accent.DEFAULT} />
            {badge > 0 && (
              <View style={[styles.badge, { backgroundColor: accent.DEFAULT }]}>
                <AppText variant="caption" color={colors.text.inverse} style={styles.badgeText}>
                  {badge > 9 ? '9+' : badge}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" color={colors.text.body} numberOfLines={1} style={styles.label}>
            {label}
          </AppText>
        </AppPressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginTop: -spacing[10],
    marginBottom: spacing[3],
    padding: spacing[2],
    borderRadius: radii['2xl'],
    backgroundColor: colors.bg.surface,
    shadowColor: '#7C2D12',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  label: {
    fontSize: 11,
  },
});
