import React from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ShieldCheck, MapPin, Users, Rocket, ArrowLeft } from 'lucide-react-native';

const VALUES = [
  { icon: ShieldCheck, title: 'Confiance avant tout', desc: 'Le paiement séquestre protège chaque transaction, du premier clic à la livraison.' },
  { icon: MapPin, title: '100% local à Daloa', desc: 'Une marketplace pensée pour les commerçants et habitants de Daloa, pas une copie générique.' },
  { icon: Users, title: 'Communauté', desc: 'Acheteurs, vendeurs et livreurs avancent ensemble, avec des règles claires et un support local.' },
  { icon: Rocket, title: 'Simplicité', desc: 'Publier, acheter, se faire livrer : quelques gestes, sans complexité inutile.' },
];

export default function AboutScreen() {
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
              La marketplace de Daloa
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              DaloaMarket
            </AppText>
          </View>
          <View style={styles.logoBadgeHero}>
            <Image source={require('../../assets/logo.png')} style={styles.logoHeroImg} resizeMode="contain" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText variant="body" color={colors.text.body}>
            DaloaMarket connecte les habitants et commerçants de Daloa : achetez et vendez près de
            chez vous, payez en toute sécurité grâce au séquestre, et faites livrer par les coursiers
            DaloaDelivery. Notre mission est simple : rendre le commerce local plus sûr, plus rapide
            et plus juste.
          </AppText>
        </View>

        <AppText variant="subtitle" style={styles.sectionTitle}>
          Nos valeurs
        </AppText>
        {VALUES.map((v) => {
          const Icon = v.icon;
          return (
            <View key={v.title} style={styles.valueCard}>
              <View style={[styles.valueIcon, { backgroundColor: accent[50] }]}>
                <Icon size={18} color={accent.DEFAULT} />
              </View>
              <View style={styles.valueText}>
                <AppText variant="bodyStrong">{v.title}</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  {v.desc}
                </AppText>
              </View>
            </View>
          );
        })}

        <AppText variant="caption" color={colors.text.subtle} center style={styles.version}>
          Version 1.0.0 · Fièrement construit à Daloa 🇨🇮
        </AppText>

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
  logoBadgeHero: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoHeroImg: {
    width: 26,
    height: 26,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
  },
  sectionTitle: {
    marginTop: spacing[2],
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
  },
  valueIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    flex: 1,
    gap: 2,
  },
  version: {
    marginTop: spacing[4],
  },
});
