import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, Header, Card } from '@daloa/ui';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Conditions Générales (CGU)" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.title}>1. Objet de la plateforme</Text>
          <Text style={styles.text}>
            DaloaMarket est une plateforme mobile de mise en relation d'acheteurs et de vendeurs opérant sur le territoire de Daloa, Côte d'Ivoire.
          </Text>

          <Text style={styles.title}>2. Séquestre & Paiement</Text>
          <Text style={styles.text}>
            Tous les paiements électroniques transitent par le service de séquestre DaloaPay / Money Fusion. Les fonds ne sont libérés au vendeur qu'après confirmation par code OTP de livraison.
          </Text>

          <Text style={styles.title}>3. Responsabilité des Vendeurs</Text>
          <Text style={styles.text}>
            Les vendeurs garantissent l'exactitude des informations et photos publiées. Tout article contrefait ou illégal entraîne le bannissement immédiat du compte.
          </Text>

          <Text style={styles.title}>4. Résolution des Litiges</Text>
          <Text style={styles.text}>
            En cas de litige signalé avant remise du code OTP, notre équipe intervient sous 24h pour analyser le dossier et procéder au remboursement ou à la libération des fonds.
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
