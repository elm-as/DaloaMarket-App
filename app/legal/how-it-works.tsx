import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';

export default function HowItWorksScreen() {
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
              Paiement séquestre
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Comment ça marche
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <ShieldCheck size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.escrowCard}>
          <ShieldCheck size={28} color={colors.status.successDark} />
          <View style={styles.escrowText}>
            <AppText variant="bodyStrong" color={colors.status.successDark}>
              Le séquestre Escrow DaloaMarket
            </AppText>
            <AppText variant="caption" color={colors.status.success}>
              Un système 100% sécurisé qui protège à la fois l'acheteur, le vendeur et le livreur à Daloa.
            </AppText>
          </View>
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
          title="Livraison à l'acheteur & inspection"
          desc="Le livreur apporte le colis à l'adresse de l'acheteur. L'acheteur inspecte son article en main propre."
        />
        <StepItem
          number="4"
          title="Validation OTP & déblocage des fonds"
          desc="L'acheteur donne son code secret OTP Delivery au livreur. Le séquestre est immédiatement libéré et le vendeur reçoit ses gains."
        />

        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

function StepItem({ number, title, desc }: { number: string; title: string; desc: string }) {
  const accent = useAccent();
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepBadge, { backgroundColor: accent.DEFAULT }]}>
          <AppText variant="bodyStrong" color={colors.text.inverse}>
            {number}
          </AppText>
        </View>
        <AppText variant="bodyStrong" style={styles.stepTitle}>
          {title}
        </AppText>
      </View>
      <AppText variant="caption" color={colors.text.muted} style={styles.stepDesc}>
        {desc}
      </AppText>
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
    gap: spacing[4],
  },
  escrowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.successLight,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
    padding: spacing[4],
    gap: spacing[3],
  },
  escrowText: {
    flex: 1,
    gap: 4,
  },
  stepCard: {
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    flex: 1,
  },
  stepDesc: {
    marginLeft: 40,
  },
});
