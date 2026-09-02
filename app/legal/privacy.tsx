import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Shield, ArrowLeft } from 'lucide-react-native';

const SECTIONS = [
  {
    title: 'Collecte des données',
    text: 'Nous collectons votre numéro de téléphone, votre nom et votre quartier à Daloa pour permettre la livraison de vos commandes et la sécurisation des transactions.',
  },
  {
    title: 'Géolocalisation',
    text: "La position GPS n'est demandée que pour estimer précisément la distance de livraison et valider la proximité du livreur lors du ramassage et de la livraison.",
  },
  {
    title: 'Sécurité des paiements',
    text: "DaloaMarket ne stocke aucun code secret de compte Mobile Money. Toutes les transactions sont opérées via l'API sécurisée.",
  },
];

export default function PrivacyScreen() {
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
              Vos données
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Confidentialité
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <Shield size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {SECTIONS.map((s) => (
            <View key={s.title} style={styles.section}>
              <AppText variant="bodyStrong" style={styles.title}>
                {s.title}
              </AppText>
              <AppText variant="caption" color={colors.text.muted}>
                {s.text}
              </AppText>
            </View>
          ))}
        </View>
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
  },
  card: {
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  section: {
    gap: 4,
  },
  title: {
    marginTop: spacing[2],
  },
});
