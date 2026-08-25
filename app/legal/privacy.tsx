import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, Header, Card } from '@daloa/ui';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Politique de Confidentialité" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.title}>Collecte des données</Text>
          <Text style={styles.text}>
            Nous collectons votre numéro de téléphone, votre nom et votre quartier à Daloa pour permettre la livraison de vos commandes et la sécurisation des transactions.
          </Text>

          <Text style={styles.title}>Géolocalisation</Text>
          <Text style={styles.text}>
            La position GPS n'est demandée que pour estimer précisément la distance de livraison et valider la proximité du livreur lors du ramassage et de la livraison.
          </Text>

          <Text style={styles.title}>Sécurité des paiements</Text>
          <Text style={styles.text}>
            DaloaMarket ne stocke aucun code secret de compte Mobile Money. Toutes les transactions sont opérées via l'API sécurisée Money Fusion.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
  },
  card: {
    padding: spacing[4],
    gap: spacing[2],
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: spacing[2],
  },
  text: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
