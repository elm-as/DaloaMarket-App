import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
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
  GoogleIcon,
} from '@daloa/ui';
import { Mail, Lock, ArrowLeft, LogIn, Sparkles, UserPlus, ShieldCheck, Truck } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      const redirectUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/`
          : 'daloamarket://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      if (data?.url) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = data.url;
        } else {
          await Linking.openURL(data.url);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de se connecter avec Google.');
    } finally {
      setIsGoogleLoading(false);
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
            onPress={() => safeBack(router, '/(tabs)/profile')}
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
            Connectez-vous à votre espace DaloaMarket
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

          {/* Bouton Google OAuth */}
          <AppPressable
            haptic="light"
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
            style={styles.googleBtn}
            accessibilityLabel="Continuer avec Google"
          >
            <GoogleIcon size={18} />
            <AppText variant="bodyStrong" color={colors.text.body}>
              {isGoogleLoading ? 'Connexion Google…' : 'Continuer avec Google'}
            </AppText>
          </AppPressable>

          {/* Séparateur */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={colors.text.subtle} style={styles.dividerText}>
              OU AVEC VOS IDENTIFIANTS
            </AppText>
            <View style={styles.dividerLine} />
          </View>

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
              Livraison Partout à Daloa
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
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
    gap: spacing[2],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
