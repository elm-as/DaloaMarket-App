import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent, Button } from '@daloa/ui';
import {
  ShieldCheck, ArrowLeft, Lock, PackageCheck, Truck, CheckCircle2,
  AlertTriangle, RotateCcw, MessageCircle
} from 'lucide-react-native';
import { ENV_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';

const STEPS = [
  {
    number: '1', icon: Lock,
    title: "L'acheteur commande & paye en séquestre",
    desc: "Le montant est débité via Mobile Money (Wave, Orange, MTN, Moov) et placé sous séquestre bloqué. 0 FCFA de frais pour l'acheteur.",
  },
  {
    number: '2', icon: PackageCheck,
    title: 'Ramassage sécurisé (OTP Retrait)',
    desc: "Le coursier se rend chez le commerçant. Le vendeur transmet son OTP Pickup et le livreur prend une photo de contrôle.",
  },
  {
    number: '3', icon: Truck,
    title: 'Acheminement géolocalisé GPS',
    desc: "La course est suivie en direct. Validation autorisée uniquement à moins de 100 mètres des coordonnées GPS de destination.",
  },
  {
    number: '4', icon: CheckCircle2,
    title: 'Inspection physique & OTP Livraison',
    desc: "L'acheteur inspecte l'article. S'il est conforme, il remet son OTP Delivery, ce qui déclenche le virement immédiat au vendeur.",
  },
];

const DISPUTES = [
  {
    title: 'Produit non conforme ou abîmé',
    desc: "Refusez le colis et ne donnez pas votre code OTP. Les fonds restent bloqués et vous êtes remboursé à 100%.",
  },
  {
    title: 'Vol, perte ou casse en cours de route',
    desc: "Que la course soit assurée par DaloaDelivery ou un coursier affilié au vendeur, l'acheteur est intégralement remboursé.",
  },
  {
    title: 'Annulation avant ramassage',
    desc: "Si le vendeur n'expédie pas ou si vous annulez avant le ramassage du livreur, les fonds sont restitués sous 24h.",
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  const handleSupport = () => {
    Haptics.success();
    Linking.openURL(`https://wa.me/${ENV_CONFIG.SUPPORT_WHATSAPP}?text=Bonjour%20Support%20DaloaMarket%2C%20litige%20commande`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[accent[400], accent[600], accent[700]]} style={styles.hero}>
        <View style={styles.heroTop}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>Protection Anti-Arnaque</AppText>
            <AppText variant="title" color={colors.text.inverse}>Garantie séquestre & litiges</AppText>
          </View>
          <View style={styles.iconCircle}>
            <ShieldCheck size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.escrowHeaderCard}>
          <View style={[styles.shieldBox, { backgroundColor: colors.status.successLight }]}>
            <ShieldCheck size={24} color={colors.status.successDark} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color={colors.status.successDark}>Protocole Escrow DaloaMarket</AppText>
            <AppText variant="caption" color={colors.text.body}>L’argent est consigné sur un compte bloqué. Il ne peut être versé sans accord explicite de l’acheteur.</AppText>
          </View>
        </View>

        <AppText variant="subtitle" style={styles.sectionHeading}>Le cycle sécurisé en 4 étapes</AppText>
        <View style={styles.gap2}>
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <View key={step.number} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: accent.DEFAULT }]}>
                    <AppText variant="label" color={colors.text.inverse}>{step.number}</AppText>
                  </View>
                  <View style={[styles.stepIconBox, { backgroundColor: accent[50] }]}>
                    <Icon size={14} color={accent.DEFAULT} />
                  </View>
                  <AppText variant="bodyStrong" style={styles.flex1}>{step.title}</AppText>
                </View>
                <AppText variant="caption" color={colors.text.muted} style={styles.stepDesc}>{step.desc}</AppText>
              </View>
            );
          })}
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={18} color={colors.status.warningDark} />
            <AppText variant="bodyStrong" color={colors.status.warningDark}>La Règle d'or de l'acheteur</AppText>
          </View>
          <AppText variant="caption" color={colors.text.body} style={styles.lineH19}>
            Ne donnez JAMAIS votre code secret OTP au livreur avant d’avoir ouvert votre colis et vérifié son état.
            La remise du code OTP vaut validation définitive et libère irréversiblement les fonds au vendeur.
          </AppText>
        </View>

        <AppText variant="subtitle" style={styles.sectionHeading}>Gestion des litiges & Remboursements</AppText>
        <View style={styles.disputeCard}>
          {DISPUTES.map((pt, idx) => (
            <View key={pt.title} style={[styles.disputeItem, idx > 0 && styles.disputeBorder]}>
              <View style={styles.disputeItemHeader}>
                <RotateCcw size={14} color={accent.DEFAULT} />
                <AppText variant="bodyStrong">{pt.title}</AppText>
              </View>
              <AppText variant="caption" color={colors.text.muted}>{pt.desc}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.actionCard}>
          <AppText variant="bodyStrong">Un problème sur une commande ?</AppText>
          <AppText variant="caption" color={colors.text.muted}>Notre arbitrage local intervient sous 24h pour étudier votre situation.</AppText>
          <Button
            title="Contacter le Support Litiges"
            variant="whatsapp"
            size="md"
            leftIcon={<MessageCircle size={18} color={colors.text.inverse} />}
            onPress={handleSupport}
          />
        </View>
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
  iconCircle: { width: 36, height: 36, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing[4], gap: spacing[3] },
  flex1: { flex: 1 },
  gap2: { gap: spacing[2] },
  escrowHeaderCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: colors.bg.surface, padding: spacing[4], borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT },
  shieldBox: { width: 40, height: 40, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { marginTop: spacing[1] },
  stepCard: { backgroundColor: colors.bg.surface, padding: spacing[3], borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, gap: spacing[2] },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  stepNumberBadge: { width: 20, height: 20, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  stepIconBox: { width: 24, height: 24, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  stepDesc: { paddingLeft: 28, lineHeight: 18 },
  warningCard: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', borderRadius: radii.xl, padding: spacing[4], gap: spacing[2] },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineH19: { lineHeight: 19 },
  disputeCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, padding: spacing[4], gap: spacing[3] },
  disputeItem: { gap: 4 },
  disputeBorder: { paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.border.subtle },
  disputeItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, padding: spacing[4], gap: spacing[2], marginTop: spacing[1] },
});
