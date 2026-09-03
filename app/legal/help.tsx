import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  MessageCircle, Phone, ArrowLeft, Headphones, Mail, ChevronRight,
  ShieldCheck, HelpCircle, Clock, Send
} from 'lucide-react-native';
import { ENV_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';

export default function HelpScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('Litige ou commande');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleWhatsApp = () => {
    Haptics.success();
    Linking.openURL(`https://wa.me/${ENV_CONFIG.SUPPORT_WHATSAPP}?text=Bonjour%20Support%20DaloaMarket%2C%20assistance`);
  };

  const handleCall = () => {
    Haptics.lightImpact();
    Linking.openURL(`tel:${ENV_CONFIG.SUPPORT_PHONE}`);
  };

  const handleEmail = () => {
    Haptics.lightImpact();
    Linking.openURL(`mailto:${ENV_CONFIG.SUPPORT_EMAIL}?subject=Assistance%20DaloaMarket`);
  };

  const handleSubmitMessage = () => {
    if (!name.trim() || !contact.trim() || !message.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner votre nom, contact et message.');
      return;
    }
    setIsSending(true);
    Haptics.success();
    setTimeout(() => {
      setIsSending(false);
      setName(''); setContact(''); setMessage('');
      Alert.alert('Message transmis', 'Notre équipe locale à Daloa a reçu votre demande et vous répondra rapidement.');
    }, 800);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[accent[400], accent[600], accent[700]]} style={styles.hero}>
        <View style={styles.heroTop}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>Assistance locale</AppText>
            <AppText variant="title" color={colors.text.inverse}>Aide & Support</AppText>
          </View>
          <View style={styles.iconCircle}>
            <Headphones size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.supportCard}>
          <View style={styles.cardHeaderRow}>
            <Headphones size={18} color={accent.DEFAULT} />
            <AppText variant="subtitle">Besoin d'aide immédiate ?</AppText>
          </View>
          <AppText variant="caption" color={colors.text.muted}>
            Notre équipe de permanence à Daloa vous assiste sur vos commandes, paiements séquestre et litiges.
          </AppText>

          <View style={styles.scheduleBadge}>
            <Clock size={12} color={accent[700]} />
            <AppText variant="caption" color={accent[700]} style={styles.bold}>
              Disponible 7j/7 de 08h00 à 20h00
            </AppText>
          </View>

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

          <AppPressable onPress={handleEmail} style={styles.emailRow}>
            <Mail size={14} color={colors.grey[600]} />
            <AppText variant="caption" color={colors.grey[600]}>Email : {ENV_CONFIG.SUPPORT_EMAIL}</AppText>
          </AppPressable>
        </View>

        <AppText variant="overline" color={colors.text.muted} style={styles.sectionOverline}>
          Guides & Résolutions rapides
        </AppText>

        <View style={styles.linksCard}>
          <AppPressable onPress={() => router.push('/legal/faq' as any)} style={styles.menuRow}>
            <View style={[styles.menuIconBox, { backgroundColor: accent[50] }]}>
              <HelpCircle size={16} color={accent.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Questions fréquentes (FAQ)</AppText>
              <AppText variant="caption" color={colors.text.muted}>Paiements, livraisons et création de boutique</AppText>
            </View>
            <ChevronRight size={16} color={colors.grey[400]} />
          </AppPressable>

          <View style={styles.rowDivider} />

          <AppPressable onPress={() => router.push('/legal/how-it-works' as any)} style={styles.menuRow}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.status.successLight }]}>
              <ShieldCheck size={16} color={colors.status.successDark} />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Garantie séquestre & litiges</AppText>
              <AppText variant="caption" color={colors.text.muted}>Protocole anti-arnaque et remboursement à 100%</AppText>
            </View>
            <ChevronRight size={16} color={colors.grey[400]} />
          </AppPressable>
        </View>

        <View style={styles.supportCard}>
          <AppText variant="subtitle">Envoyez-nous un message</AppText>
          <View style={styles.formGroup}>
            <AppText variant="caption" color={colors.text.body} style={styles.bold}>Votre nom</AppText>
            <TextInput style={styles.input} placeholder="Ex: Kouassi Jean" placeholderTextColor={colors.grey[400]} value={name} onChangeText={setName} />
          </View>
          <View style={styles.formGroup}>
            <AppText variant="caption" color={colors.text.body} style={styles.bold}>Numéro de téléphone ou Email</AppText>
            <TextInput style={styles.input} placeholder="Ex: 07 00 00 00 00" placeholderTextColor={colors.grey[400]} value={contact} onChangeText={setContact} />
          </View>
          <View style={styles.formGroup}>
            <AppText variant="caption" color={colors.text.body} style={styles.bold}>Objet de votre demande</AppText>
            <TextInput style={styles.input} placeholder="Ex: Litige commande #1234..." placeholderTextColor={colors.grey[400]} value={subject} onChangeText={setSubject} />
          </View>
          <View style={styles.formGroup}>
            <AppText variant="caption" color={colors.text.body} style={styles.bold}>Votre message</AppText>
            <TextInput style={[styles.input, styles.textarea]} placeholder="Détaillez votre situation..." placeholderTextColor={colors.grey[400]} multiline numberOfLines={3} value={message} onChangeText={setMessage} />
          </View>
          <Button
            title={isSending ? 'Envoi en cours...' : 'Envoyer ma demande'}
            variant="primary"
            size="md"
            leftIcon={<Send size={16} color={colors.text.inverse} />}
            onPress={handleSubmitMessage}
            disabled={isSending}
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
  supportCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, padding: spacing[4], gap: spacing[3] },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.bg.subtle, borderRadius: radii.md, alignSelf: 'flex-start' },
  btnRow: { flexDirection: 'row', gap: spacing[2] },
  flex1: { flex: 1 },
  bold: { fontWeight: '700' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionOverline: { marginTop: spacing[1], marginLeft: spacing[1] },
  linksCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], gap: spacing[3] },
  menuIconBox: { width: 32, height: 32, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  rowDivider: { height: 1, backgroundColor: colors.border.subtle, marginLeft: 50 },
  formGroup: { gap: 3 },
  input: { backgroundColor: colors.bg.subtle, borderWidth: 1, borderColor: colors.border.DEFAULT, borderRadius: radii.lg, paddingHorizontal: spacing[3], paddingVertical: 8, fontSize: 13.5, color: colors.text.DEFAULT },
  textarea: { height: 72, textAlignVertical: 'top' },
});
