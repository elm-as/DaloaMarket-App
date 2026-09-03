import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle, MapPin, CreditCard, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable } from '@daloa/ui';

interface ProfileAlertsBannerProps {
  hasListings: boolean;
  hasShopGps: boolean;
  hasPayoutAccount: boolean;
  onDefineGps: () => void;
  onSetupPayout: () => void;
}

export const ProfileAlertsBanner: React.FC<ProfileAlertsBannerProps> = ({
  hasListings,
  hasShopGps,
  hasPayoutAccount,
  onDefineGps,
  onSetupPayout,
}) => {
  // Ne pas afficher d'alerte si le compte n'a aucune annonce en vente
  if (!hasListings) return null;

  return (
    <View style={styles.container}>
      {/* Alerte 1 : Position GPS boutique manquante */}
      {!hasShopGps && (
        <AppPressable
          onPress={onDefineGps}
          style={[styles.alertCard, styles.gpsAlert]}
          accessibilityLabel="Définir l'emplacement boutique"
        >
          <View style={[styles.alertIconBox, { backgroundColor: '#FEF3C7' }]}>
            <MapPin size={16} color="#D97706" />
          </View>
          <View style={styles.alertContent}>
            <AppText variant="bodyStrong" color="#92400E" style={styles.alertTitle}>
              Emplacement boutique manquant
            </AppText>
            <AppText variant="caption" color="#B45309" style={styles.alertDesc}>
              Positionnez votre boutique sur la carte pour calculer la livraison des coursiers.
            </AppText>
          </View>
          <ChevronRight size={16} color="#D97706" />
        </AppPressable>
      )}

      {/* Alerte 2 : Coordonnées de retrait Wave/OM manquantes */}
      {!hasPayoutAccount && (
        <AppPressable
          onPress={onSetupPayout}
          style={[styles.alertCard, styles.payoutAlert]}
          accessibilityLabel="Configurer le compte de retrait"
        >
          <View style={[styles.alertIconBox, { backgroundColor: '#FEE2E2' }]}>
            <CreditCard size={16} color="#DC2626" />
          </View>
          <View style={styles.alertContent}>
            <AppText variant="bodyStrong" color="#991B1B" style={styles.alertTitle}>
              Compte de retrait manquant
            </AppText>
            <AppText variant="caption" color="#B91C1C" style={styles.alertDesc}>
              Ajoutez votre numéro Wave ou Mobile Money pour encaisser vos gains de vente.
            </AppText>
          </View>
          <ChevronRight size={16} color="#DC2626" />
        </AppPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[3],
  },
  gpsAlert: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  payoutAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontWeight: '800',
    fontSize: 12,
  },
  alertDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
