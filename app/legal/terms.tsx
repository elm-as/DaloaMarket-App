import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ShieldCheck, Store, Bike, AlertCircle, Lock, ArrowLeft } from 'lucide-react-native';

const TERMS_SECTIONS = [
  {
    id: 'escrow',
    title: '1. Séquestre & paiements 100% garantis',
    icon: ShieldCheck,
    color: colors.status.successDark,
    bg: colors.status.successLight,
    content:
      'Tous les paiements sur DaloaMarket transitent par notre compte séquestre bloqué. Les fonds ne sont libérés au commerçant que lorsque vous avez vérifié le produit et remis votre code OTP secret au livreur.',
  },
  {
    id: 'sellers',
    title: '2. Responsabilité & authenticité des vendeurs',
    icon: Store,
    color: colors.primary[700],
    bg: colors.primary[50],
    content:
      "Chaque commerçant s'engage sur l'authenticité, la conformité et l'état réel des articles publiés. Toute tentative de contrefaçon ou de fraude entraîne le gel immédiat du compte et des fonds.",
  },
  {
    id: 'delivery',
    title: '3. Livraison locale via DaloaDelivery',
    icon: Bike,
    color: colors.status.infoDark,
    bg: colors.status.infoLight,
    content:
      'Les livraisons sont assurées par les coursiers indépendants agréés de DaloaDelivery. Les colis sont traçables en direct avec validation obligatoire par coordonnées GPS à moins de 100m du point de livraison.',
  },
  {
    id: 'disputes',
    title: '4. Résolution des litiges sous 24h',
    icon: AlertCircle,
    color: colors.secondary[700],
    bg: colors.secondary[50],
    content:
      "En cas de non-conformité, ne transmettez jamais votre code OTP au livreur. Signalez immédiatement le litige dans l'application : notre service client local intervient sous 24h pour arbitrage ou remboursement intégral.",
  },
  {
    id: 'privacy',
    title: '5. Confidentialité & protection des données',
    icon: Lock,
    color: colors.status.warningDark,
    bg: colors.status.warningLight,
    content:
      "Vos numéros de téléphone et coordonnées personnelles restent strictement confidentiels et ne sont partagés qu'avec le coursier chargé de votre commande.",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
              Règles de la plateforme
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Conditions d'utilisation
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <ShieldCheck size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {TERMS_SECTIONS.map((section) => {
          const IconComp = section.icon;
          return (
            <View key={section.id} style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: section.bg }]}>
                  <IconComp size={18} color={section.color} />
                </View>
                <AppText variant="bodyStrong" style={styles.cardTitle}>
                  {section.title}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.text.body} style={styles.cardText}>
                {section.content}
              </AppText>
            </View>
          );
        })}

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
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: spacing[2],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
  },
  cardText: {
    lineHeight: 18,
  },
});
