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
import { DALOA_DISTRICTS } from '@daloa/config';
import { User, Mail, Phone, Lock, MapPin, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { register } = useAuth();

  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<string>(DALOA_DISTRICTS[0] || 'Centre-ville');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim()) return setErrorMsg('Veuillez saisir votre nom complet');
    if (!email.trim() || !email.includes('@')) return setErrorMsg('Veuillez renseigner une adresse email valide');
    if (!phone.trim()) return setErrorMsg('Veuillez saisir votre numéro de téléphone');
    if (password.length < 6) return setErrorMsg('Le mot de passe doit comporter au moins 6 caractères');

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await register({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), district, password, role });
      Haptics.success();
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile' as any);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'inscription. Veuillez réessayer.");
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
        {/* Header dégradé */}
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.curvedHeader}
        >
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>

          <View style={styles.logoBadge}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
          </View>

          <AppText variant="h1" color={colors.text.inverse}>
            Bienvenue !
          </AppText>
          <AppText variant="body" color={accent[100]}>
            Créez votre compte DaloaMarket
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

          {/* Rôle */}
          <View style={styles.roleTabs}>
            <AppPressable
              haptic="selection"
              onPress={() => setRole('buyer')}
              style={[styles.roleTab, role === 'buyer' && styles.roleTabActive]}
            >
              <AppText variant="caption" color={role === 'buyer' ? accent[600] : colors.text.muted}>
                🛍️ Acheteur
              </AppText>
            </AppPressable>
            <AppPressable
              haptic="selection"
              onPress={() => setRole('seller')}
              style={[styles.roleTab, role === 'seller' && styles.roleTabActive]}
            >
              <AppText variant="caption" color={role === 'seller' ? accent[600] : colors.text.muted}>
                🏪 Vendeur / Boutique
              </AppText>
            </AppPressable>
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
            placeholder="vous@exemple.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={16} color={colors.text.subtle} />}
          />
          <Input
            label="Numéro WhatsApp / Téléphone *"
            placeholder="07 01 02 03 04"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={16} color={colors.text.subtle} />}
          />

          {/* Quartier */}
          <AppText variant="label" color={colors.text.body} style={styles.districtLabel}>
            Quartier à Daloa *
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.districtScroll}>
            {DALOA_DISTRICTS.map((d) => {
              const isSelected = district === d;
              return (
                <AppPressable
                  key={d}
                  haptic="selection"
                  onPress={() => setDistrict(d)}
                  style={[
                    styles.districtChip,
                    isSelected && { backgroundColor: accent[50], borderColor: accent[300] },
                  ]}
                >
                  <MapPin size={11} color={isSelected ? accent[600] : colors.text.muted} />
                  <AppText variant="caption" color={isSelected ? accent[700] : colors.grey[600]}>
                    {d}
                  </AppText>
                </AppPressable>
              );
            })}
          </ScrollView>

          <Input
            label="Mot de passe (6 caractères min) *"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={16} color={colors.text.subtle} />}
            containerStyle={styles.passwordSpacing}
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
              Vous avez déjà un compte ?{' '}
            </AppText>
            <AppPressable haptic="none" onPress={() => router.replace('/auth/login' as any)}>
              <AppText variant="label" color={accent[600]}>
                Se connecter
              </AppText>
            </AppPressable>
          </View>
        </View>

        {/* Garantie */}
        <View style={styles.trustStrip}>
          <ShieldCheck size={14} color={colors.status.successDark} />
          <AppText variant="caption" color={colors.text.muted} center style={styles.trustText}>
            En vous inscrivant, vous acceptez les CGU et bénéficiez de la protection séquestre.
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
    padding: spacing[4],
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
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.xl,
    padding: 3,
    marginBottom: spacing[3],
    gap: 4,
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  roleTabActive: {
    backgroundColor: colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  districtLabel: {
    marginBottom: 5,
  },
  districtScroll: {
    gap: 6,
    paddingBottom: spacing[3],
  },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 4,
    overflow: 'hidden',
  },
  passwordSpacing: {
    marginTop: spacing[1],
  },
  submitBtn: {
    marginTop: spacing[2],
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[3],
  },
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[6],
    marginTop: spacing[3],
    gap: 6,
  },
  trustText: {
    flexShrink: 1,
  },
});
