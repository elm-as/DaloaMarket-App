import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ChevronDown, ArrowLeft, HelpCircle } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: "Qu'est-ce que le paiement séquestre ?",
    a: "Votre argent est bloqué en sécurité dès la commande et n'est versé au vendeur qu'une fois que vous avez reçu et validé votre colis avec votre code OTP. Vous êtes protégé à 100%.",
  },
  {
    q: 'Comment se déroule une livraison ?',
    a: "Après paiement, un coursier DaloaDelivery récupère le colis chez le vendeur (code OTP + photo), puis vous le livre. Vous inspectez l'article, puis donnez votre code OTP au livreur pour finaliser.",
  },
  {
    q: 'Combien coûte la livraison à Daloa ?',
    a: 'Le tarif de base est de 500 FCFA pour les premiers 1,5 km, puis 85 FCFA par kilomètre supplémentaire. Le montant exact est affiché avant le paiement.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Wave, Orange Money, MTN MoMo et Moov Money. Le paiement à la livraison (COD) est disponible selon le vendeur.',
  },
  {
    q: 'Comment devenir vendeur ?',
    a: "Créez un compte, choisissez « Vendeur / Boutique » à l'inscription, puis publiez votre première annonce en quelques étapes. C'est gratuit.",
  },
  {
    q: 'Que faire en cas de problème avec une commande ?',
    a: "Ne donnez jamais votre code OTP si le colis n'est pas conforme. Ouvrez un litige depuis la page de suivi : notre équipe intervient sous 24h pour arbitrage ou remboursement.",
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: 'Rendez-vous dans Profil → Paramètres du compte → Supprimer mon compte. La suppression est définitive et efface toutes vos données.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const accent = useAccent();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <AppPressable haptic="selection" onPress={toggle} style={styles.item} accessibilityRole="button">
      <View style={styles.itemHeader}>
        <AppText variant="bodyStrong" style={styles.question}>
          {q}
        </AppText>
        <ChevronDown
          size={18}
          color={open ? accent.DEFAULT : colors.text.subtle}
          style={open ? styles.chevronOpen : undefined}
        />
      </View>
      {open && (
        <AppText variant="body" color={colors.text.muted} style={styles.answer}>
          {a}
        </AppText>
      )}
    </AppPressable>
  );
}

export default function FaqScreen() {
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
              Centre d'aide
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Questions fréquentes
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <HelpCircle size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
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
    gap: spacing[2],
  },
  item: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  question: {
    flex: 1,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  answer: {
    marginTop: spacing[2],
  },
});
