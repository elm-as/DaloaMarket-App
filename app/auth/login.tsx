import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  Button,
  Input,
  KeyboardScreen,
  useAccent,
} from '@daloa/ui';
import { Lock, Mail, ArrowLeft, ShieldCheck, Truck } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      setErrorMsg('Veuillez saisir votre email ou numéro de téléphone');
      return;
    }
    if (!password) {
      setErrorMsg('Veuillez saisir votre mot de passe');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await login({ emailOrPhone: emailOrPhone.trim(), password });
      Haptics.success();
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile' as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
      >
        {/* 1. Header dégradé incurvé */}
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.curvedHeader}
        >
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>

          <View style={styles.logoBadge}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
          </View>

          <AppText variant="h1" color={colors.text.inverse}>
            Bon retour !
          </AppText>
          <AppText variant="body" color={accent[100]}>
            Connectez-vous à DaloaMarket
          </AppText>
        </LinearGradient>

        {/* 2. Carte formulaire flottante */}
        <View style={styles.formCard}>
          {errorMsg && (
            <View style={styles.errorBox}>
              <AppText variant="caption" color={colors.status.errorDark}>
                {errorMsg}
              </AppText>
            </View>
          )}

          <Input
            label="Adresse email ou téléphone"
            placeholder="ex: 07 01 02 03 04 ou email@daloa.ci"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={16} color={colors.text.subtle} />}
          />

          <Input
            label="Mot de passe"
            placeholder="Votre mot de passe secret"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={16} color={colors.text.subtle} />}
          />

          <AppPressable
            haptic="none"
            onPress={() => router.push('/auth/reset-password' as any)}
            style={styles.forgotBtn}
            accessibilityRole="button"
          >
            <AppText variant="caption" color={accent[600]}>
              Mot de passe oublié ?
            </AppText>
          </AppPressable>

          <Button
            title={isLoading ? 'Connexion en cours...' : 'Se connecter'}
            variant="market"
            size="lg"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
          />

          <View style={styles.registerRow}>
            <AppText variant="body" color={colors.text.muted}>
              Pas encore de compte ?{' '}
            </AppText>
            <AppPressable haptic="none" onPress={() => router.replace('/auth/register' as any)}>
              <AppText variant="label" color={accent[600]}>
                S'inscrire
              </AppText>
            </AppPressable>
          </View>
        </View>

        {/* 3. Réassurance */}
        <View style={styles.trustFooter}>
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color={colors.status.successDark} />
            <AppText variant="caption" color={colors.text.muted}>
              Paiement Séquestre
            </AppText>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustBadge}>
            <Truck size={14} color={accent.DEFAULT} />
            <AppText variant="caption" color={colors.text.muted}>
              Livraison Locale
            </AppText>
          </View>
        </View>
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing[8],
    backgroundColor: colors.bg.DEFAULT,
    flexGrow: 1,
  },
  curvedHeader: {
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: spacing[4],
    top: spacing[4],
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  logoImg: {
    width: 38,
    height: 38,
  },
  formCard: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginTop: -28,
    borderRadius: radii['2xl'],
    padding: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  errorBox: {
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing[4],
    paddingVertical: 2,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
  },
});
