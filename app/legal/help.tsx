import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, typography, Header, Card, Button } from '@daloa/ui';
import { MessageCircle, Phone, HelpCircle } from 'lucide-react-native';
import { ENV_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';

export default function HelpScreen() {
  const router = useRouter();

  const handleWhatsApp = () => {
    Haptics.success();
    Linking.openURL(`https://wa.me/${ENV_CONFIG.SUPPORT_WHATSAPP}?text=Bonjour%20Support%20DaloaMarket`);
  };

  const handleCall = () => {
    Haptics.lightImpact();
    Linking.openURL(`tel:${ENV_CONFIG.SUPPORT_PHONE}`);
  };

  const faqs = [
    {
      q: 'Comment fonctionne le code OTP de livraison ?',
      a: 'Votre code OTP vous est affiché sur la page de suivi de commande. Vous ne devez le donner au livreur qu’une fois le colis remis en main propre.',
    },
    {
      q: 'Puis-je annuler une commande ?',
      a: 'Oui, tant que le vendeur ou le livreur n’a pas validé le ramassage du colis, vous pouvez annuler et être remboursé.',
    },
    {
      q: 'Combien coûte la livraison à Daloa ?',
      a: 'Le tarif de base est de 500 FCFA pour les premiers 1.5 km, puis 85 FCFA par kilomètre supplémentaire.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Centre d'Assistance" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Support Buttons */}
        <Card style={styles.supportCard}>
          <Text style={styles.supportTitle}>Besoin d'aide immédiate ?</Text>
          <Text style={styles.supportSub}>
            Notre équipe d'assistance locale à Daloa est joignable 7j/7.
          </Text>

          <View style={styles.btnRow}>
            <Button
              title="WhatsApp Direct"
              variant="success"
              size="md"
              leftIcon={<MessageCircle size={18} color="#FFFFFF" />}
              onPress={handleWhatsApp}
              style={{ flex: 1 }}
            />
            <Button
              title="Appeler"
              variant="secondary"
              size="md"
              leftIcon={<Phone size={18} color={colors.dark.text} />}
              onPress={handleCall}
            />
          </View>
        </Card>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Questions Fréquentes</Text>
        {faqs.map((faq, idx) => (
          <Card key={idx} style={styles.faqCard}>
            <Text style={styles.faqQ}>❓ {faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </Card>
        ))}
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
    gap: spacing[3],
  },
  supportCard: {
    padding: spacing[4],
    gap: spacing[2],
  },
  supportTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  supportSub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginBottom: spacing[2],
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing[2],
  },
  faqCard: {
    padding: spacing[4],
    gap: spacing[2],
  },
  faqQ: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  faqA: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
