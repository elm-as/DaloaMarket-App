import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, Input, Button, AppText, AppPressable } from '@daloa/ui';
import { ShieldAlert, Send, LogOut, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '@daloa/api';

export default function BannedScreen() {
  const { user, profile, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAppeal = async () => {
    if (!appealReason.trim()) {
      Alert.alert('Erreur', 'Veuillez expliquer les raisons de votre contestation.');
      return;
    }
    try {
      setIsSubmitting(true);
      await supabase.from('ban_appeals').insert({
        user_id: user?.id || 'anonymous',
        full_name: profile?.full_name || 'Utilisateur',
        phone: profile?.phone || '',
        reason: appealReason.trim(),
        status: 'pending',
      });
      Alert.alert('Demande transmise', 'Votre recours a été envoyé aux administrateurs de DaloaMarket.');
      setAppealReason('');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Impossible d'envoyer le recours");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero danger */}
      <LinearGradient
        colors={['#7F1D1D', '#991B1B', '#B91C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <AppPressable
            onPress={() => logout()}
            rippleBorderless
            style={styles.logoutBtn}
            accessibilityLabel="Se déconnecter"
          >
            <LogOut size={18} color="rgba(255,255,255,0.9)" />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" style={styles.overlineText}>
              Accès restreint
            </AppText>
            <AppText variant="title" style={styles.titleText}>
              Compte suspendu
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <ShieldAlert size={18} color="rgba(255,200,200,0.9)" />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.iconBox}>
            <ShieldAlert size={36} color={colors.status.error} />
          </View>

          <AppText variant="h2" center>
            Accès temporairement restreint
          </AppText>
          <AppText variant="body" color={colors.text.muted} center style={styles.sub}>
            Votre compte a été suspendu pour non-respect des règles de sécurité de la communauté DaloaMarket.
          </AppText>

          {profile?.ban_reason && (
            <View style={styles.reasonCard}>
              <View style={styles.reasonHeader}>
                <AlertCircle size={14} color={colors.status.errorDark} />
                <AppText variant="caption" color={colors.status.errorDark} style={styles.reasonLabel}>
                  Motif de la suspension
                </AppText>
              </View>
              <AppText variant="body" color={colors.status.errorDark}>
                {profile.ban_reason}
              </AppText>
            </View>
          )}

          <AppText variant="subtitle" style={styles.appealTitle}>
            Contester cette décision
          </AppText>
          <Input
            label="Votre message à la modération *"
            placeholder="Expliquez la situation aux modérateurs..."
            value={appealReason}
            onChangeText={setAppealReason}
            multiline
            numberOfLines={4}
            inputStyle={styles.textArea}
          />

          <View style={styles.actions}>
            <Button
              title="Envoyer mon recours"
              variant="market"
              size="lg"
              loading={isSubmitting}
              onPress={handleAppeal}
              leftIcon={<Send size={16} color={colors.text.inverse} />}
              fullWidth
            />
            <Button title="Se déconnecter" variant="outline" size="md" onPress={() => logout()} fullWidth />
          </View>

          <View style={{ height: insets.bottom + spacing[6] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  flex1: {
    flex: 1,
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
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  overlineText: {
    color: 'rgba(255,180,180,0.9)',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titleText: {
    color: '#FFFFFF',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing[4],
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.status.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
  },
  sub: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  reasonCard: {
    width: '100%',
    padding: spacing[4],
    backgroundColor: colors.status.errorLight,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    borderRadius: radii.xl,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appealTitle: {
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actions: {
    width: '100%',
    marginTop: spacing[3],
    gap: spacing[2],
  },
});
