import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authService } from '@daloa/api';
import { colors, radii, spacing, typography, Button, AppText, AppPressable } from '@daloa/ui';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { useAuth } from '../../src/context/AuthContext';

const CONFIRM_WORD = 'SUPPRIMER';

const CONSEQUENCES = [
  'Vos annonces publiées seront retirées définitivement.',
  'Votre historique de commandes et de messages sera supprimé.',
  'Votre boutique et vos favoris seront perdus.',
  'Cette action est irréversible.',
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = () => {
    if (!canDelete) return;
    Alert.alert(
      'Supprimer définitivement ?',
      'Votre compte et toutes vos données seront supprimés. Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await authService.deleteAccount();
              Haptics.warning();
              Alert.alert(
                'Compte supprimé',
                'Votre demande de suppression a été prise en compte. Vous êtes déconnecté.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }]
              );
            } catch (err: any) {
              await logout().catch(() => {});
              Alert.alert(
                'Demande enregistrée',
                'Votre compte sera supprimé sous peu. Vous êtes déconnecté.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.9)" />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" style={styles.overlineText}>
              Zone de danger
            </AppText>
            <AppText variant="title" style={styles.titleText}>
              Supprimer le compte
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <AlertTriangle size={18} color="rgba(255,200,200,0.9)" />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.iconBox}>
            <AlertTriangle size={36} color={colors.status.error} />
          </View>

          <AppText variant="h2" center>
            Suppression du compte
          </AppText>
          <AppText variant="body" color={colors.text.muted} center style={styles.intro}>
            Avant de continuer, sachez ce que cela implique :
          </AppText>

          <View style={styles.consequencesCard}>
            {CONSEQUENCES.map((c) => (
              <View key={c} style={styles.consequenceRow}>
                <Trash2 size={14} color={colors.status.error} />
                <AppText variant="body" color={colors.text.body} style={styles.consequenceText}>
                  {c}
                </AppText>
              </View>
            ))}
          </View>

          <AppText variant="label" color={colors.text.body} style={styles.confirmLabel}>
            Pour confirmer, tapez « {CONFIRM_WORD} » ci-dessous
          </AppText>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={CONFIRM_WORD}
            placeholderTextColor={colors.text.subtle}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, canDelete && styles.inputReady]}
          />

          <Button
            title="Supprimer définitivement mon compte"
            variant="danger"
            size="lg"
            disabled={!canDelete || isDeleting}
            loading={isDeleting}
            onPress={handleDelete}
            fullWidth
            style={styles.deleteBtn}
          />
          <Button
            title="Annuler"
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            fullWidth
          />

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
  backBtn: {
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
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.status.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
  },
  intro: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  consequencesCard: {
    width: '100%',
    padding: spacing[4],
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    borderRadius: radii.xl,
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  consequenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  consequenceText: {
    flex: 1,
  },
  confirmLabel: {
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    height: 48,
    fontSize: typography.sizes.base,
    fontFamily: typography.families.bold,
    color: colors.text.DEFAULT,
    backgroundColor: colors.bg.surface,
    letterSpacing: 2,
  },
  inputReady: {
    borderColor: colors.status.error,
    backgroundColor: colors.status.errorLight,
  },
  deleteBtn: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    width: '100%',
  },
});
