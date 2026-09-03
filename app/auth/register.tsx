import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { signInWithGoogle } from '../../src/lib/googleAuth';
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
import { DALOA_DISTRICTS } from '@daloa/config';
import { User, Mail, Phone, Lock, MapPin, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<string>(DALOA_DISTRICTS[0] || 'Centre-ville');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim()) return setErrorMsg('Veuillez saisir votre nom complet');
    if (!email.trim() || !email.includes('@')) return setErrorMsg('Veuillez renseigner une adresse email valide');
    if (!phone.trim()) return setErrorMsg('Veuillez saisir votre numéro de téléphone WhatsApp');
    if (password.length < 6) return setErrorMsg('Le mot de passe doit comporter au moins 6 caractères');

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        district,
        password,
        role: 'buyer',
      });
      Haptics.success();
      safeBack(router, '/(tabs)/profile');
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de s’inscrire avec Google.');
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
        {/* Header dégradé */}
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
            Bienvenue !
          </AppText>
          <AppText variant="body" color={accent[100]}>
            Créez votre compte unique DaloaMarket
          </AppText>
        </LinearGradient>

        {/* Carte formulaire */}
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
            onPress={handleGoogleRegister}
            disabled={isGoogleLoading}
            style={styles.googleBtn}
            accessibilityLabel="Continuer avec Google"
          >
            <GoogleIcon size={18} />
            <AppText variant="bodyStrong" color={colors.text.body}>
              {isGoogleLoading ? 'Inscription Google…' : 'Continuer avec Google'}
            </AppText>
          </AppPressable>

          {/* Séparateur */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={colors.text.subtle} style={styles.dividerText}>
              OU AVEC VOTRE EMAIL
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <Input
            label="Nom complet *"
            placeholder="Ex: Jean Kouassi"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={16} color={colors.text.subtle} />}
          />

          <Input
            label="Adresse email *"
            placeholder="jean.kouassi@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={16} color={colors.text.subtle} />}
          />

          <Input
            label="Numéro WhatsApp *"
            placeholder="07 01 02 03 04"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={16} color={colors.text.subtle} />}
          />

          <Input
            label="Mot de passe secret *"
            placeholder="Au moins 6 caractères"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={16} color={colors.text.subtle} />}
          />

          <Button
            title={isLoading ? 'Création en cours...' : 'Créer mon compte'}
            variant="market"
            size="lg"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.submitBtn}
          />

          <View style={styles.loginRow}>
            <AppText variant="body" color={colors.text.muted}>
              Déjà inscrit ?{' '}
            </AppText>
            <AppPressable haptic="none" onPress={() => router.replace('/auth/login' as any)}>
              <AppText variant="label" color={accent[600]}>
                Se connecter
              </AppText>
            </AppPressable>
          </View>
        </View>

        {/* Réassurance */}
        <View style={styles.trustFooter}>
          <ShieldCheck size={14} color={colors.status.successDark} />
          <AppText variant="caption" color={colors.text.muted}>
            Sécurisé par le protocole séquestre DaloaMarket
          </AppText>
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
    marginVertical: spacing[3],
    gap: spacing[2],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    padding: 3,
    marginBottom: spacing[3],
    gap: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.md,
  },
  roleTabActive: {
    backgroundColor: colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  submitBtn: {
    marginTop: spacing[2],
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing[4],
  },
});
