import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRICING_CONFIG } from '@daloa/config';
import { colors, radii, spacing, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';

const PERKS = [
  { title: 'Badge PRO certifié', desc: 'Renforcez la confiance des acheteurs sur toutes vos annonces.' },
  { title: 'Commission réduite (2.5%)', desc: 'Économisez 1% sur toutes vos ventes par rapport aux vendeurs standards.' },
  { title: 'Vitrine boutique personnalisée', desc: 'Bannière, logo et lien exclusif daloamarket.com/shop/votrenom.' },
  { title: 'Remontée prioritaire', desc: 'Vos annonces apparaissent au-dessus des annonces standards.' },
  { title: 'Statistiques détaillées', desc: 'Suivi du nombre de vues, clics et contacts sur votre catalogue.' },
  { title: 'Support prioritaire VIP', desc: 'Ligne directe WhatsApp avec notre équipe d’assistance à Daloa.' },
];

export default function BecomeProScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [billingPlan, setBillingPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleSubscribe = async () => {
    Haptics.success();
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      Alert.alert(
        'Félicitations !',
        'Votre compte est désormais Vendeur Pro. Vos privilèges sont immédiatement actifs.',
        [{ text: 'Super !', onPress: () => router.replace('/(tabs)/profile' as any) }]
      );
    }, 1200);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Abonnement marchand
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Vendeur Pro
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <Sparkles size={18} color={accent[200]} />
          </View>
        </View>

        <AppText variant="caption" color="rgba(255,255,255,0.85)" style={styles.heroSub}>
          Propulsez vos ventes à Daloa avec des outils professionnels et une visibilité maximale.
        </AppText>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Plans */}
        <AppText variant="subtitle">Choisissez votre formule</AppText>
        <View style={styles.plansRow}>
          <AppPressable
            haptic="selection"
            onPress={() => setBillingPlan('monthly')}
            style={[styles.planCard, billingPlan === 'monthly' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] }]}
          >
            <AppText variant="bodyStrong" color={billingPlan === 'monthly' ? accent[700] : colors.text.DEFAULT}>
              Mensuel
            </AppText>
            <AppText variant="bodyStrong" color={billingPlan === 'monthly' ? accent[600] : colors.text.DEFAULT}>
              {formatFCFA(PRICING_CONFIG.proSubscription.monthlyPrice)}
            </AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              Par mois
            </AppText>
          </AppPressable>

          <AppPressable
            haptic="selection"
            onPress={() => setBillingPlan('annual')}
            style={[styles.planCard, billingPlan === 'annual' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] }]}
          >
            <View style={styles.saveBadge}>
              <AppText variant="overline" color={colors.text.inverse}>
                2 MOIS OFFERTS
              </AppText>
            </View>
            <AppText variant="bodyStrong" color={billingPlan === 'annual' ? accent[700] : colors.text.DEFAULT}>
              Annuel
            </AppText>
            <AppText variant="bodyStrong" color={billingPlan === 'annual' ? accent[600] : colors.text.DEFAULT}>
              {formatFCFA(PRICING_CONFIG.proSubscription.annualPrice)}
            </AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              Par an (25 000 FCFA)
            </AppText>
          </AppPressable>
        </View>

        {/* Privilèges */}
        <AppText variant="subtitle">Les privilèges Vendeur Pro</AppText>
        <View style={styles.perksCard}>
          {PERKS.map((p) => (
            <View key={p.title} style={styles.perkRow}>
              <CheckCircle2 size={18} color={colors.status.successDark} style={styles.perkIcon} />
              <View style={styles.flex1}>
                <AppText variant="bodyStrong">{p.title}</AppText>
                <AppText variant="caption" color={colors.text.muted} style={styles.perkDesc}>
                  {p.desc}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Button
          title={billingPlan === 'monthly' ? 'Activer pour 2 500 FCFA / mois' : 'Activer pour 25 000 FCFA / an'}
          variant="market"
          size="lg"
          loading={isUpgrading}
          onPress={handleSubscribe}
          fullWidth
        />

        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  hero: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: spacing[2],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSub: {
    lineHeight: 18,
    paddingHorizontal: spacing[1],
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  plansRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  saveBadge: {
    backgroundColor: colors.status.success,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  perksCard: {
    padding: spacing[4],
    gap: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  perkIcon: {
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
  perkDesc: {
    marginTop: 1,
  },
});
