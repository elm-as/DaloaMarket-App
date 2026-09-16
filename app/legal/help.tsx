import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import {
  Mail, MessageSquare, Sparkles, ArrowLeft, BookOpen,
} from 'lucide-react-native';
import { ENV_CONFIG } from '@daloa/config';
import { Haptics } from '@daloa/utils';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
import { HelpFeedbackForm } from '../../src/components/legal/HelpFeedbackForm';
import { UserFeedbacksList } from '../../src/components/legal/UserFeedbacksList';

export default function HelpScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);

  const fetchUserFeedbacks = useCallback(() => {
    if (!user?.id) return;
    supabase
      .from('user_feedbacks')
      .select('id, dislikes, admin_reply, replied_at, created_at, source')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setUserFeedbacks(data);
      });
  }, [user?.id]);

  useEffect(() => {
    fetchUserFeedbacks();
  }, [fetchUserFeedbacks]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
          <ArrowLeft size={20} color={colors.text.DEFAULT} />
        </AppPressable>
        <AppText variant="subtitle" style={styles.bold}>Aide &amp; Feedbacks</AppText>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bannière Hero */}
        <LinearGradient colors={[accent[500], accent[600], '#D97706']} style={styles.heroCard}>
          <View style={styles.logoBadge}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
          </View>
          <AppText variant="title" color={colors.text.inverse} style={styles.heroTitle}>Aide &amp; Support</AppText>
          <AppText variant="caption" color={accent[100]} center style={styles.heroSubtitle}>
            Une question ou un avis ? Notre équipe est à votre écoute.
          </AppText>
        </LinearGradient>

        {/* 4 accès rapides */}
        <View style={styles.grid}>
          <AppPressable
            onPress={() => {
              Haptics.lightImpact();
              Linking.openURL(`mailto:${ENV_CONFIG.SUPPORT_EMAIL}?subject=Assistance%20DaloaMarket`);
            }}
            style={styles.gridCard}
          >
            <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
              <Mail size={18} color={accent.DEFAULT} />
            </View>
            <AppText variant="caption" color={colors.text.muted}>Email support</AppText>
            <AppText variant="caption" color={colors.text.DEFAULT} style={[styles.bold, styles.smallText]}>
              {ENV_CONFIG.SUPPORT_EMAIL}
            </AppText>
          </AppPressable>

          <AppPressable onPress={() => router.push('/legal/faq' as any)} style={styles.gridCard}>
            <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
              <MessageSquare size={18} color={accent.DEFAULT} />
            </View>
            <AppText variant="bodyStrong">FAQ</AppText>
            <AppText variant="caption" color={colors.text.muted}>Questions fréquentes</AppText>
          </AppPressable>

          <AppPressable onPress={() => router.push('/legal/how-it-works' as any)} style={styles.gridCard}>
            <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
              <BookOpen size={18} color={accent.DEFAULT} />
            </View>
            <AppText variant="bodyStrong">Comment ça marche</AppText>
            <AppText variant="caption" color={colors.text.muted}>Guide complet</AppText>
          </AppPressable>

          <AppPressable
            onPress={() => {
              Haptics.lightImpact();
              Linking.openURL('https://tuto.daloamarket.com');
            }}
            style={[styles.gridCard, styles.tutoCard]}
          >
            <View style={[styles.iconBox, styles.tutoIconBox]}>
              <Sparkles size={18} color="#D97706" />
            </View>
            <AppText variant="bodyStrong" color="#92400E">Guide Vendeur</AppText>
            <AppText variant="caption" color="#B45309">Tutos &amp; Conseils</AppText>
          </AppPressable>
        </View>

        {/* Formulaire de Feedback inspiré du Web */}
        <HelpFeedbackForm userId={user?.id} onSubmitted={fetchUserFeedbacks} />

        {/* Section "Vos avis" en dessous de tout */}
        <UserFeedbacksList feedbacks={userFeedbacks} />

        <AppText variant="caption" color={colors.text.subtle} center style={styles.footerNote}>
          DaloaMarket · Écoute &amp; Support client officiel
        </AppText>
        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: radii.full, backgroundColor: colors.bg.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  bold: { fontFamily: typography.families.bold },
  scrollContent: { padding: spacing[4], gap: spacing[4] },
  heroCard: { borderRadius: radii['2xl'], padding: spacing[5], alignItems: 'center', gap: spacing[1] },
  logoBadge: {
    width: 44, height: 44, borderRadius: radii.xl, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing[1], overflow: 'hidden',
  },
  logoImg: { width: 28, height: 28 },
  heroTitle: { fontSize: 20, fontFamily: typography.families.extrabold },
  heroSubtitle: { fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '48%', backgroundColor: colors.bg.surface, borderRadius: radii.xl,
    padding: spacing[3], borderWidth: 1, borderColor: colors.border.subtle, gap: spacing[1],
  },
  iconBox: { width: 34, height: 34, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  smallText: { fontSize: 11 },
  tutoCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  tutoIconBox: { backgroundColor: '#FEF3C7' },
  footerNote: { fontSize: 11, marginTop: spacing[2] },
});
