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
import { DALOA_DISTRICTS } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Input,
  Button,
} from '@daloa/ui';
import { UserPlus, User, Phone, Lock, Mail, MapPin } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Lobia');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('seller');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone ivoirien valide');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await register({
        fullName: fullName.trim(),
        email: email.trim() || `${phone.replace(/\D/g, '')}@daloamarket.ci`,
        phone: phone.trim(),
        district,
        password,
        role,
      });
      Haptics.success();
      router.back();
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de l’inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Créer un compte" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBox}>
            <View style={styles.logoBox}>
              <UserPlus size={32} color={colors.market.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Rejoignez DaloaMarket</Text>
            <Text style={styles.welcomeSub}>
              Achetez et vendez facilement dans tous les quartiers de Daloa.
            </Text>
          </View>

          {/* Sélecteur de Rôle */}
          <View style={styles.roleToggleRow}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selection();
                setRole('seller');
              }}
              style={[styles.roleOption, role === 'seller' && styles.roleOptionActive]}
            >
              <Text style={[styles.roleOptionText, role === 'seller' && styles.roleOptionTextActive]}>
                🏪 Vendeur / Boutique
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selection();
                setRole('buyer');
              }}
              style={[styles.roleOption, role === 'buyer' && styles.roleOptionActive]}
            >
              <Text style={[styles.roleOptionText, role === 'buyer' && styles.roleOptionTextActive]}>
                🛍️ Acheteur
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Nom complet ou Nom de boutique *"
            placeholder="Ex: Kouamé Konan ou Boutique Élégance"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={18} color={colors.dark.textDim} />}
          />

          <Input
            label="Numéro de téléphone (+225) *"
            placeholder="Ex: 07 01 02 03 04"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color={colors.dark.textDim} />}
          />

          <Input
            label="Adresse Email (Optionnelle)"
            placeholder="Ex: kouame@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.dark.textDim} />}
          />

          {/* Sélecteur de Quartier */}
          <Text style={styles.inputLabel}>Votre quartier à Daloa *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {DALOA_DISTRICTS.slice(0, 15).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => {
                  Haptics.selection();
                  setDistrict(d);
                }}
                style={[styles.chip, district === d && styles.chipActive]}
              >
                <Text style={[styles.chipText, district === d && styles.chipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Mot de passe *"
            placeholder="Au moins 6 caractères"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={18} color={colors.dark.textDim} />}
          />

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <Button
            title="Créer mon compte"
            variant="market"
            size="lg"
            loading={isLoading}
            onPress={handleRegister}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
    marginVertical: spacing[3],
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: radii['2xl'],
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  welcomeTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.lg,
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
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    padding: 3,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  roleOptionActive: {
    backgroundColor: colors.market.primary,
  },
  roleOptionText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  inputLabel: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1] + 2,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  chip: {
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  chipActive: {
    backgroundColor: colors.market.primary,
    borderColor: colors.market.primary,
  },
  chipText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  submitBtn: {
    marginTop: spacing[2],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing[5],
  },
  footerText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
  },
  loginLink: {
    color: colors.market.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
