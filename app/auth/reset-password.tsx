import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authService } from '@daloa/api';
import { colors, radii, spacing, Input, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre adresse email.');
      return;
    }
    try {
      setIsLoading(true);
      await authService.resetPassword(email.trim());
      Haptics.success();
      Alert.alert(
        'Email envoyé',
        'Un lien de réinitialisation de mot de passe a été envoyé à votre adresse email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Impossible d'envoyer le lien");
    } finally {
      setIsLoading(false);
    }
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
              Récupération de compte
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Mot de passe oublié ?
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <KeyRound size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="body" color={colors.text.muted} center style={styles.sub}>
            Saisissez l'adresse email associée à votre compte DaloaMarket pour recevoir un lien de réinitialisation.
          </AppText>

          <Input
            label="Adresse Email"
            placeholder="votre-email@domaine.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.text.subtle} />}
            containerStyle={styles.inputFull}
          />

          <View style={styles.buttonFull}>
            <Button
              title="Envoyer le lien"
              variant="market"
              size="lg"
              loading={isLoading}
              onPress={handleReset}
              fullWidth
            />
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
  content: {
    padding: spacing[4],
    paddingTop: spacing[6],
    alignItems: 'center',
  },
  sub: {
    maxWidth: 300,
    marginBottom: spacing[4],
  },
  inputFull: {
    width: '100%',
  },
  buttonFull: {
    width: '100%',
    marginTop: spacing[4],
  },
});
