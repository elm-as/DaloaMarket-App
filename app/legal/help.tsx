import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import { MessageCircle, Phone, ArrowLeft, Headphones } from 'lucide-react-native';
import { ENV_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';

const FAQS = [
  {
    q: 'Comment fonctionne le code OTP de livraison ?',
    a: "Votre code OTP vous est affiché sur la page de suivi de commande. Vous ne devez le donner au livreur qu'une fois le colis remis en main propre.",
  },
  {
    q: 'Puis-je annuler une commande ?',
    a: "Oui, tant que le vendeur ou le livreur n'a pas validé le ramassage du colis, vous pouvez annuler et être remboursé.",
  },
  {
    q: 'Combien coûte la livraison à Daloa ?',
    a: 'Le tarif de base est de 500 FCFA pour les premiers 1.5 km, puis 85 FCFA par kilomètre supplémentaire.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  const handleWhatsApp = () => {
    Haptics.success();
    Linking.openURL(`https://wa.me/${ENV_CONFIG.SUPPORT_WHATSAPP}?text=Bonjour%20Support%20DaloaMarket`);
  };

  const handleCall = () => {
    Haptics.lightImpact();
    Linking.openURL(`tel:${ENV_CONFIG.SUPPORT_PHONE}`);
  };

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
              Support local
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Centre d'assistance
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <Headphones size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.supportCard}>
          <AppText variant="subtitle">Besoin d'aide immédiate ?</AppText>
          <AppText variant="caption" color={colors.text.muted} style={styles.supportSub}>
            Notre équipe d'assistance locale à Daloa est joignable 7j/7.
          </AppText>

          <View style={styles.btnRow}>
            <Button
              title="WhatsApp Direct"
              variant="whatsapp"
              size="md"
              leftIcon={<MessageCircle size={18} color={colors.text.inverse} />}
              onPress={handleWhatsApp}
              style={styles.flex1}
            />
            <Button
              title="Appeler"
              variant="outline"
              size="md"
              leftIcon={<Phone size={18} color={colors.text.DEFAULT} />}
              onPress={handleCall}
            />
          </View>
        </View>

        <AppText variant="subtitle" style={styles.sectionTitle}>
          Questions fréquentes
        </AppText>
        {FAQS.map((faq) => (
          <View key={faq.q} style={styles.faqCard}>
            <AppText variant="bodyStrong">❓ {faq.q}</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              {faq.a}
            </AppText>
          </View>
        ))}

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
  },
  supportCard: {
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  supportSub: {
    marginBottom: spacing[2],
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flex1: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: spacing[2],
  },
  faqCard: {
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
});
