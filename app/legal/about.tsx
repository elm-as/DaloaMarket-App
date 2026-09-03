import React from 'react';
import { View, ScrollView, StyleSheet, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  ShieldCheck, MapPin, Users, Rocket, ArrowLeft, Truck, Lock, ShoppingBag, Zap, Phone, Mail
} from 'lucide-react-native';
import { ENV_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';

const METRICS = [
  { value: '100%', label: 'Local Daloa' },
  { value: 'Double OTP', label: 'Sécurité physique' },
  { value: '< 10 min', label: 'Reversement gains' },
];

const FOUNDING_TEAM = [
  {
    initials: 'OE', name: 'OULOBO Elmas Tresor', role: 'Fondateur & Concepteur',
    desc: 'Architecte logiciel et lead développeur de l’écosystème DaloaMarket & DaloaDelivery.',
  },
  {
    initials: 'AJ', name: 'Armand J.', role: 'Co-fondateur · Relations Terrain',
    desc: 'Partenariats commerçants, réseau de coursiers et déploiement opérationnel à Daloa.',
  },
  {
    initials: 'DN', name: 'Diomandé (DNPH)', role: 'Co-fondateur · Médias & Com',
    desc: 'Animation communautaire, communication digitale et stratégie d’acquisition.',
  },
];

const PILLARS = [
  { icon: Lock, title: 'Paiement séquestre garanti', desc: 'Fonds bloqués jusqu’à l’inspection physique du produit par l’acheteur.' },
  { icon: Truck, title: 'Coursiers DaloaDelivery', desc: 'Les livreurs touchent 90% du prix de livraison avec traçabilité GPS.' },
  { icon: ShoppingBag, title: 'Vitrines marchands dédiées', desc: 'Boutiques personnalisables avec gestion de stock et avis réels.' },
  { icon: Zap, title: 'Reversements instantanés', desc: 'Gains virés vers Wave, Orange, MTN et Moov en moins de 10 minutes.' },
];

export default function AboutScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  const handlePhone = () => {
    Haptics.lightImpact();
    Linking.openURL(`tel:${ENV_CONFIG.SUPPORT_PHONE}`);
  };

  const handleMail = (email: string) => {
    Haptics.lightImpact();
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[accent[400], accent[600], accent[700]]} style={styles.hero}>
        <View style={styles.heroTop}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>Histoire & Vision</AppText>
            <AppText variant="title" color={colors.text.inverse}>À propos de DaloaMarket</AppText>
          </View>
          <View style={styles.logoBadgeHero}>
            <Image source={require('../../assets/logo.png')} style={styles.logoHeroImg} resizeMode="contain" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Rocket size={18} color={accent.DEFAULT} />
            <AppText variant="subtitle">Digitaliser le commerce de proximité</AppText>
          </View>
          <AppText variant="body" color={colors.text.body} style={styles.lineH20}>
            À Daloa, le commerce informel manquait de sécurité et d’outils adaptés. DaloaMarket offre une passerelle de confiance reliant acheteurs, commerçants et coursiers DaloaDelivery sous protection séquestre.
          </AppText>
          <View style={styles.metricsRow}>
            {METRICS.map((m) => (
              <View key={m.label} style={styles.metricBox}>
                <AppText variant="subtitle" color={accent[600]}>{m.value}</AppText>
                <AppText variant="caption" color={colors.text.muted} center>{m.label}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Users size={18} color={accent.DEFAULT} />
            <AppText variant="subtitle">L'Équipe Fondatrice</AppText>
          </View>
          <View style={styles.gap3}>
            {FOUNDING_TEAM.map((member) => (
              <View key={member.name} style={styles.teamCard}>
                <View style={[styles.avatarInitials, { backgroundColor: accent[50] }]}>
                  <AppText variant="bodyStrong" color={accent[700]}>{member.initials}</AppText>
                </View>
                <View style={styles.flex1}>
                  <AppText variant="bodyStrong">{member.name}</AppText>
                  <AppText variant="caption" color={accent[600]} style={styles.bold}>{member.role}</AppText>
                  <AppText variant="caption" color={colors.text.muted}>{member.desc}</AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <ShieldCheck size={18} color={accent.DEFAULT} />
            <AppText variant="subtitle">Nos Piliers de Confiance</AppText>
          </View>
          <View style={styles.gap3}>
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <View key={p.title} style={styles.pillarRow}>
                  <View style={[styles.pillarIcon, { backgroundColor: accent[50] }]}>
                    <Icon size={16} color={accent.DEFAULT} />
                  </View>
                  <View style={styles.flex1}>
                    <AppText variant="bodyStrong">{p.title}</AppText>
                    <AppText variant="caption" color={colors.text.muted}>{p.desc}</AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MapPin size={18} color={accent.DEFAULT} />
            <AppText variant="subtitle">Coordonnées Officielles</AppText>
          </View>
          <View style={styles.gap2}>
            <View>
              <AppText variant="caption" color={colors.text.subtle}>Siège opérationnel</AppText>
              <AppText variant="bodyStrong">Daloa / Abidjan, Côte d'Ivoire</AppText>
            </View>
            <AppPressable onPress={handlePhone} style={styles.actionContactRow}>
              <Phone size={15} color={accent[600]} />
              <AppText variant="caption" color={accent[600]} style={styles.bold}>+225 07 88 00 08 31</AppText>
            </AppPressable>
            <AppPressable onPress={() => handleMail('support@daloamarket.com')} style={styles.actionContactRow}>
              <Mail size={15} color={accent[600]} />
              <AppText variant="caption" color={accent[600]} style={styles.bold}>support@daloamarket.com</AppText>
            </AppPressable>
          </View>
        </View>

        <AppText variant="caption" color={colors.text.subtle} center style={styles.version}>
          DaloaMarket · Plateforme officielle de la Cité des Antilopes
        </AppText>
        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  hero: { paddingHorizontal: spacing[3], paddingTop: spacing[2], paddingBottom: spacing[5], borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitles: { flex: 1, marginLeft: spacing[2] },
  logoBadgeHero: { width: 36, height: 36, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  logoHeroImg: { width: 26, height: 26 },
  scrollContent: { padding: spacing[4], gap: spacing[3] },
  card: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, padding: spacing[4], gap: spacing[3] },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineH20: { lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },
  metricBox: { flex: 1, paddingVertical: spacing[3], paddingHorizontal: 6, backgroundColor: colors.bg.subtle, borderRadius: radii.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle, gap: 3 },
  gap3: { gap: spacing[3] },
  gap2: { gap: spacing[2] },
  flex1: { flex: 1 },
  bold: { fontWeight: '700' },
  teamCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: colors.bg.subtle, padding: spacing[3], borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border.subtle },
  avatarInitials: { width: 36, height: 36, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  pillarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  pillarIcon: { width: 32, height: 32, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  actionContactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  version: { marginTop: spacing[2] },
});
