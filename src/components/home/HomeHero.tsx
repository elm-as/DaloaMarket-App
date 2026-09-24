import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, AppText, colors } from '@daloa/ui';

/**
 * En-tête d'accueil sobre : deux lignes de texte. La recherche est dans la
 * barre du haut et la publication dans l'onglet central ; l'ancienne carte en
 * dégradé et la bande « confiance » repoussaient les articles hors de l'écran.
 */
export const HomeHero: React.FC = () => (
  <View style={styles.container}>
    <AppText variant="h2">Tout Daloa, au même endroit.</AppText>
    <AppText variant="body" color={colors.text.muted}>
      Achetez et vendez près de chez vous, paiement protégé.
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    gap: 2,
  },
});
