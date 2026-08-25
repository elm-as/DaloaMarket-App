import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Input,
  Button,
} from '@daloa/ui';
import { Store, Lock, Mail } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function LoginScreen() {
  const router = useRouter();
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
      router.back();
    } catch (err: any) {
      setErrorMsg(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Connexion" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Logo & Intro */}
          <View style={styles.headerBox}>
            <View style={styles.logoBox}>
              <Store size={36} color={colors.market.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Ravi de vous revoir !</Text>
            <Text style={styles.welcomeSub}>
              Accédez à vos commandes, vos discussions et votre boutique en ligne.
            </Text>
          </View>

          {/* Formulaire */}
          <Input
            label="Email ou Numéro de téléphone *"
            placeholder="Ex: 07 01 02 03 04 ou email@domain.com"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            leftIcon={<Mail size={18} color={colors.dark.textDim} />}
            autoCapitalize="none"
          />

          <Input
            label="Mot de passe *"
            placeholder="Votre mot de passe"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={18} color={colors.dark.textDim} />}
          />

          <TouchableOpacity
            onPress={() => router.push('/auth/reset-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <Button
            title="Se connecter"
            variant="market"
            size="lg"
            loading={isLoading}
            onPress={handleLogin}
            style={styles.submitBtn}
          />

          {/* Lien Inscription */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  headerBox: {
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: radii['2xl'],
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  welcomeTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  welcomeSub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing[4],
  },
  forgotText: {
    color: colors.market.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  submitBtn: {
    marginTop: spacing[1],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing[6],
  },
  footerText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
  },
  registerLink: {
    color: colors.market.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
