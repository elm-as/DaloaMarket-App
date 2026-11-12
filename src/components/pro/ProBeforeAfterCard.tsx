import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, AppText } from '@daloa/ui';
import { XCircle, CheckCircle2, Users } from 'lucide-react-native';

const BEFORE_ITEMS = [
  'Annonces noyées derrière les boutiques mises en avant',
  'Pas de lien de vitrine personnalisé pour vos statuts WhatsApp',
  'Commission standard de 3,5 % sur chaque vente',
];

const AFTER_ITEMS = [
  'En tête des recherches des acheteurs à Daloa',
  'Vitrine Pro complète partageable sur WhatsApp',
  'Commission réduite à 2,5 % — vous gardez plus sur vos ventes',
];

/**
 * Carte comparative Avant / Après (leviers Aspiration, Appartenance et réduction de Frustration)
 * affichée sur l'écran d'abonnement Vendeur Pro mobile.
 */
export const ProBeforeAfterCard: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Bandeau Appartenance */}
      <View style={styles.communityBanner}>
        <View style={styles.communityIcon}>
          <Users size={16} color={colors.text.inverse} />
        </View>
        <View style={styles.flex1}>
          <AppText variant="bodyStrong" color="#78350F">
            Rejoignez le cercle des vendeurs Pro vérifiés de Daloa
          </AppText>
          <AppText variant="caption" color="#92400E">
            Les acheteurs de Daloa font 3× plus confiance aux boutiques certifiées Pro.
          </AppText>
        </View>
      </View>

      <AppText variant="bodyStrong">Avant / Après le Pass Vendeur Pro</AppText>

      <View style={styles.compareBox}>
        <AppText variant="overline" color={colors.text.muted}>
          AVANT · COMPTE STANDARD
        </AppText>
        {BEFORE_ITEMS.map((item) => (
          <View key={item} style={styles.row}>
            <XCircle size={15} color={colors.text.subtle} style={styles.icon} />
            <AppText variant="caption" color={colors.text.muted} style={styles.flex1}>
              {item}
            </AppText>
          </View>
        ))}
      </View>

      <View style={[styles.compareBox, styles.afterBox]}>
        <AppText variant="overline" color="#065F46">
          APRÈS · BOUTIQUE PRO VÉRIFIÉE ⭐
        </AppText>
        {AFTER_ITEMS.map((item) => (
          <View key={item} style={styles.row}>
            <CheckCircle2 size={15} color="#059669" style={styles.icon} />
            <AppText variant="caption" color="#064E3B" style={styles.flex1}>
              {item}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    gap: spacing[3],
  },
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.lg,
    padding: spacing[3],
  },
  communityIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareBox: {
    backgroundColor: colors.grey[50],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[3],
    gap: 6,
  },
  afterBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
});

