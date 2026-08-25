import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { PRICING_CONFIG } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Card,
  Button,
  Badge,
  CurrencyText,
} from '@daloa/ui';
import {
  Sparkles,
  CheckCircle2,
  Percent,
  ShieldCheck,
  Zap,
  Star,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function BecomeProScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [billingPlan, setBillingPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const perks = [
    { title: 'Badge PRO Certifié', desc: 'Renforcez la confiance des acheteurs sur toutes vos annonces.' },
    { title: 'Commission Réduite (2.5%)', desc: 'Économisez 1% sur toutes vos ventes par rapport aux vendeurs standards.' },
    { title: 'Vitrine Boutique Personnalisée', desc: 'Bannière personnalisée, logo et lien exclusif daloamarket.com/shop/votrenom.' },
    { title: 'Remontée Prioritaire', desc: 'Vos annonces apparaissent au-dessus des annonces standards dans la recherche.' },
    { title: 'Statistiques Détaillées', desc: 'Suivi du nombre de vues, clics et contacts sur votre catalogue.' },
    { title: 'Support Prioritaire VIP', desc: 'Ligne directe WhatsApp avec notre équipe d’assistance à Daloa.' },
  ];

  const handleSubscribe = async () => {
    Haptics.success();
    setIsUpgrading(true);
    setTimeout(async () => {
      setIsUpgrading(false);
      Alert.alert(
        'Félicitations ! 🎉',
        'Votre compte est désormais Vendeur Pro. Vos privilèges sont immédiatement actifs.',
        [{ text: 'Super !', onPress: () => router.replace('/(tabs)/profile') }]
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Devenir Vendeur Pro" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.proIconBox}>
            <Sparkles size={28} color="#F59E0B" />
          </View>
          <Text style={styles.heroTitle}>Propulsez vos ventes à Daloa avec le statut PRO</Text>
          <Text style={styles.heroSub}>
            Rejoignez les meilleurs commerçants et boutiques professionnelles de la ville.
          </Text>
        </View>

        {/* Sélection du Plan */}
        <Text style={styles.sectionTitle}>Choisissez votre formule</Text>
        <View style={styles.plansRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selection();
              setBillingPlan('monthly');
            }}
            style={[styles.planCard, billingPlan === 'monthly' && styles.planCardActive]}
          >
            <Text style={[styles.planTitle, billingPlan === 'monthly' && styles.planTitleActive]}>
              Mensuel
            </Text>
            <CurrencyText
              amount={PRICING_CONFIG.proSubscription.monthlyPrice}
              size="lg"
              weight="bold"
              color={billingPlan === 'monthly' ? '#F59E0B' : colors.dark.text}
            />
            <Text style={styles.planPeriod}>Par mois</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selection();
              setBillingPlan('annual');
            }}
            style={[styles.planCard, billingPlan === 'annual' && styles.planCardActive]}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>2 MOIS OFFERTS</Text>
            </View>
            <Text style={[styles.planTitle, billingPlan === 'annual' && styles.planTitleActive]}>
              Annuel
            </Text>
            <CurrencyText
              amount={PRICING_CONFIG.proSubscription.annualPrice}
              size="lg"
              weight="bold"
              color={billingPlan === 'annual' ? '#F59E0B' : colors.dark.text}
            />
            <Text style={styles.planPeriod}>Par an (25 000 FCFA)</Text>
          </TouchableOpacity>
        </View>

        {/* Avantages Vendeur Pro */}
        <Text style={styles.sectionTitle}>Les Privilèges Vendeur Pro</Text>
        <Card style={styles.perksCard}>
          {perks.map((p, idx) => (
            <View key={idx} style={styles.perkRow}>
              <CheckCircle2 size={18} color="#10B981" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.perkTitle}>{p.title}</Text>
                <Text style={styles.perkDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* CTA d'activation */}
        <Button
          title={
            billingPlan === 'monthly'
              ? 'Activer pour 2 500 FCFA / mois'
              : 'Activer pour 25 000 FCFA / an'
          }
          variant="market"
          size="lg"
          loading={isUpgrading}
          onPress={handleSubscribe}
          style={styles.subscribeBtn}
        />

        <View style={{ height: 40 }} />
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
  heroCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: spacing[4],
    alignItems: 'center',
    textAlign: 'center',
  },
  proIconBox: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  heroTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  heroSub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  plansRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    padding: spacing[3],
    alignItems: 'center',
    gap: 4,
  },
  planCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  saveBadge: {
    backgroundColor: colors.status.success,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
  },
  planTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  planTitleActive: {
    color: '#F59E0B',
  },
  planPeriod: {
    color: colors.dark.textDim,
    fontSize: 10,
  },
  perksCard: {
    padding: spacing[4],
    gap: spacing[3],
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  perkTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  perkDesc: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: 1,
  },
  subscribeBtn: {
    marginTop: spacing[2],
  },
});
