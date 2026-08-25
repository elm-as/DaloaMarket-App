import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, typography, Header, StatCard, Card } from '@daloa/ui';
import { Eye, TrendingUp, Users, ShoppingBag } from 'lucide-react-native';

export default function StatsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Mes Statistiques" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <StatCard
            label="Vues des annonces"
            value="1 420"
            icon={<Eye size={16} color={colors.market.primary} />}
            trend="+18% ce mois"
          />
          <StatCard
            label="Articles vendus"
            value="34"
            icon={<ShoppingBag size={16} color="#10B981" />}
            trend="+8 cette semaine"
          />
        </View>

        <View style={styles.kpiGrid}>
          <StatCard
            label="Contacts WhatsApp"
            value="89"
            icon={<Users size={16} color="#3B82F6" />}
          />
          <StatCard
            label="Taux de conversion"
            value="4.2%"
            icon={<TrendingUp size={16} color="#F59E0B" />}
          />
        </View>

        <Text style={styles.sectionTitle}>Conseils pour vendre plus vite</Text>
        <Card style={styles.tipsCard}>
          <Text style={styles.tipTitle}>📸 Photos nettes et lumineuses</Text>
          <Text style={styles.tipDesc}>
            Les annonces avec 3 photos ou plus et un fond dégagé reçoivent 3 fois plus de contacts.
          </Text>

          <View style={{ height: spacing[3] }} />

          <Text style={styles.tipTitle}>📲 Partagez sur WhatsApp</Text>
          <Text style={styles.tipDesc}>
            Partagez le lien de votre vitrine dans votre statut le matin entre 8h30 et 10h pour capter les acheteurs.
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
    gap: spacing[4],
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  tipsCard: {
    padding: spacing[4],
  },
  tipTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  tipDesc: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
});
