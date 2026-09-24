import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PlusCircle, Package, Truck, Store, Share2, Tag } from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable, useAccent, typography } from '@daloa/ui';

interface ProfileQuickActionsProps {
  onPublishListing: () => void;
  onOpenMyListings: () => void;
  onOpenOrders: () => void;
  onOpenDeliverers: () => void;
  onOpenShop: () => void;
  onShareShopWhatsApp: () => void;
  /** Achats en cours + ventes à traiter (0 = pas de pastille). */
  activeOrdersCount?: number;
}

export const ProfileQuickActions: React.FC<ProfileQuickActionsProps> = ({
  onPublishListing,
  onOpenMyListings,
  onOpenOrders,
  onOpenDeliverers,
  onOpenShop,
  onShareShopWhatsApp,
  activeOrdersCount = 0,
}) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* « Publier » est l'onglet central « Vendre » : pas de second bouton ici. */}
      {/* Grille des raccourcis marchands */}
      <View style={styles.grid}>
        {/* 1. Mes Annonces */}
        <AppPressable
          onPress={onOpenMyListings}
          style={styles.gridCard}
          accessibilityLabel="Gérer mes annonces"
        >
          <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Tag size={18} color="#D97706" />
          </View>
          <View style={styles.cardTexts}>
            <AppText variant="bodyStrong" color={colors.text.body} style={styles.cardTitle}>
              Mes Annonces
            </AppText>
            <AppText variant="caption" color={colors.text.subtle} style={styles.cardSubtitle}>
              Gérer & vendre
            </AppText>
          </View>
        </AppPressable>

        {/* 2. Mes commandes */}
        <AppPressable
          onPress={onOpenOrders}
          style={styles.gridCard}
          accessibilityLabel={
            activeOrdersCount > 0
              ? `Mes commandes, ${activeOrdersCount} en cours`
              : 'Mes commandes'
          }
        >
          <View style={[styles.cardIconBox, { backgroundColor: accent[50] }]}>
            <Package size={18} color={accent[600]} />
            {activeOrdersCount > 0 && (
              <View style={styles.cardBadge}>
                <AppText variant="caption" color={colors.text.inverse} style={styles.cardBadgeText}>
                  {activeOrdersCount > 9 ? '9+' : activeOrdersCount}
                </AppText>
              </View>
            )}
          </View>
          <View style={styles.cardTexts}>
            <AppText variant="bodyStrong" color={colors.text.body} style={styles.cardTitle}>
              Commandes
            </AppText>
            <AppText variant="caption" color={colors.text.subtle} style={styles.cardSubtitle}>
              {activeOrdersCount > 0
                ? `${activeOrdersCount} en cours`
                : 'Suivi & ventes'}
            </AppText>
          </View>
        </AppPressable>

        {/* 2. Mes livreurs */}
        <AppPressable
          onPress={onOpenDeliverers}
          style={styles.gridCard}
          accessibilityLabel="Mes livreurs affiliés"
        >
          <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Truck size={18} color="#2563EB" />
          </View>
          <View style={styles.cardTexts}>
            <AppText variant="bodyStrong" color={colors.text.body} style={styles.cardTitle}>
              Mes Livreurs
            </AppText>
            <AppText variant="caption" color={colors.text.subtle} style={styles.cardSubtitle}>
              Coursiers affiliés
            </AppText>
          </View>
        </AppPressable>

        {/* 3. Ma boutique */}
        <AppPressable
          onPress={onOpenShop}
          style={styles.gridCard}
          accessibilityLabel="Paramètres de ma boutique"
        >
          <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
            <Store size={18} color="#16A34A" />
          </View>
          <View style={styles.cardTexts}>
            <AppText variant="bodyStrong" color={colors.text.body} style={styles.cardTitle}>
              Ma Boutique
            </AppText>
            <AppText variant="caption" color={colors.text.subtle} style={styles.cardSubtitle}>
              Vitrine & logo
            </AppText>
          </View>
        </AppPressable>
      </View>

      {/* 5. Partager sur WhatsApp (Centré pleine largeur) */}
      <AppPressable
        onPress={onShareShopWhatsApp}
        style={styles.shareCard}
        accessibilityLabel="Partager ma boutique sur WhatsApp"
      >
        <View style={[styles.cardIconBox, { backgroundColor: '#FDF2F8' }]}>
          <Share2 size={16} color="#DB2777" />
        </View>
        <AppText variant="bodyStrong" color={colors.text.body} style={styles.cardTitle}>
          Partager boutique (WhatsApp)
        </AppText>
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.xl,
    marginBottom: spacing[3],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  publishText: {
    fontFamily: typography.families.extrabold,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  gridCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing[2],
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: radii.full,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg.surface,
  },
  cardBadgeText: {
    fontSize: 9.5,
    fontFamily: typography.families.black,
  },
  cardTexts: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: typography.families.extrabold,
    fontSize: 13,
  },
  cardSubtitle: {
    fontSize: 10,
    color: colors.text.subtle,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing[2],
    marginTop: spacing[2],
  },
});
