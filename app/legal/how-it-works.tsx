import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, typography, Header, Card } from '@daloa/ui';
import { ShieldCheck, Truck, KeyRound, CheckCircle2, Lock } from 'lucide-react-native';

export default function HowItWorksScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Comment ça marche" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.heroBox}>
          <ShieldCheck size={36} color="#10B981" />
          <Text style={styles.heroTitle}>Le Séquestre Escrow DaloaMarket</Text>
          <Text style={styles.heroSub}>
            Un système 100% sécurisé qui protège à la fois l'acheteur, le vendeur et le livreur à Daloa.
          </Text>
        </View>

        <StepItem
          number="1"
          title="L'acheteur commande & paye en séquestre"
          desc="Le paiement Mobile Money (Wave, Orange, MTN, Moov) est placé sous séquestre sécurisé. Le vendeur est notifié pour préparer le colis."
        />

        <StepItem
          number="2"
          title="Un livreur DaloaDelivery prend en charge la course"
          desc="Le livreur se rend chez le vendeur. Le vendeur transmet son code secret OTP Pickup et le livreur prend une photo de contrôle."
        />

        <StepItem
          number="3"
          title="Livraison à l'acheteur & Inspection"
          desc="Le livreur apporte le colis à l'adresse de l'acheteur. L'acheteur inspecte son article en main propre."
        />

        <StepItem
          number="4"
          title="Validation OTP & Déblocage des fonds"
          desc="L'acheteur donne son code secret OTP Delivery au livreur. Le séquestre est immédiatement libéré et le vendeur reçoit ses gains."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{number}</Text>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepDesc}>{desc}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  heroBox: {
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: spacing[5],
    gap: spacing[2],
  },
  heroTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  heroSub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  stepCard: {
    padding: spacing[4],
    gap: spacing[2],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.market.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  stepTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  stepDesc: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginLeft: 40,
  },
});
