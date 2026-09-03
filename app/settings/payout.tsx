import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  Input,
  Button,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Check,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';

interface Operator {
  id: string;
  name: string;
  badge: string;
  brandColor: string;
  bgColor: string;
  logo: any;
}

const OPERATORS: Operator[] = [
  {
    id: 'wave-ci',
    name: 'Wave',
    badge: 'Sans frais',
    brandColor: '#1DC4FF',
    bgColor: '#E6F8FF',
    logo: require('../../assets/operators/wave.png'),
  },
  {
    id: 'orange-money-ci',
    name: 'Orange Money',
    badge: 'OM CI',
    brandColor: '#FF7900',
    bgColor: '#FFF4EB',
    logo: require('../../assets/operators/orange.svg'),
  },
  {
    id: 'mtn-ci',
    name: 'MTN MoMo',
    badge: 'MoMo CI',
    brandColor: '#F59E0B',
    bgColor: '#FFFBEB',
    logo: require('../../assets/operators/mtn.jpeg'),
  },
  {
    id: 'moov-ci',
    name: 'Moov Money',
    badge: 'Moov CI',
    brandColor: '#006699',
    bgColor: '#EBF5FA',
    logo: require('../../assets/operators/moov.png'),
  },
];

export default function PayoutSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, profile, refreshProfile, isAuthenticated } = useAuth();

  const [selectedNetwork, setSelectedNetwork] = useState<string>('wave-ci');
  const [payoutNumber, setPayoutNumber] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      const up = profile as any;
      if (up.payout_network) setSelectedNetwork(up.payout_network);
      if (up.payout_number) setPayoutNumber(up.payout_number);
    }
  }, [profile]);

  if (!isAuthenticated || !user) {
    return (
      <AuthGuardView
        title="Coordonnées de retrait"
        description="Connectez-vous pour configurer votre compte Mobile Money de réception des fonds."
        fallbackRoute="/(tabs)/profile"
      />
    );
  }

  const handleSave = async () => {
    const cleaned = payoutNumber.replace(/\D/g, '');
    if (!cleaned) {
      setFeedback({ type: 'error', text: 'Veuillez saisir votre numéro Mobile Money.' });
      return;
    }
    if (cleaned.length !== 10 && !(cleaned.startsWith('225') && cleaned.length === 13)) {
      setFeedback({ type: 'error', text: 'Numéro invalide. Format attendu : 10 chiffres (ex: 0701020304).' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      const { error } = await supabase
        .from('users')
        .update({
          payout_network: selectedNetwork,
          payout_number: cleaned,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Synchronisation avec payout_settings
      try {
        await (supabase.from as any)('payout_settings').upsert({
          user_id: user.id,
          network: selectedNetwork,
          phone: cleaned,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Table optionnelle selon la migration
      }

      await refreshProfile();
      Haptics.success();
      setFeedback({ type: 'success', text: 'Coordonnées de retrait enregistrées avec succès !' });
      setTimeout(() => {
        safeBack(router, '/(tabs)/profile');
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Impossible d’enregistrer le compte.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header dégradé */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[3] }]}
      >
        <AppPressable
          onPress={() => safeBack(router, '/(tabs)/profile')}
          rippleBorderless
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={18} color={colors.text.inverse} />
        </AppPressable>
        <View style={styles.headerTitles}>
          <AppText variant="overline" color={accent[100]}>PAIEMENTS & RETRAITS</AppText>
          <AppText variant="title" color={colors.text.inverse}>Coordonnées de retrait</AppText>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner feedback */}
        {feedback && (
          <View style={[styles.feedbackCard, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} color={colors.status.successDark} />
            ) : (
              <AlertCircle size={16} color={colors.status.errorDark} />
            )}
            <AppText
              variant="caption"
              color={feedback.type === 'success' ? colors.status.successDark : colors.status.errorDark}
              style={styles.flex1}
            >
              {feedback.text}
            </AppText>
          </View>
        )}

        {/* Notice explicative */}
        <View style={styles.infoCard}>
          <View style={[styles.infoIconCircle, { backgroundColor: accent[50] }]}>
            <ShieldCheck size={20} color={accent.DEFAULT} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong">Réception automatique des gains</AppText>
            <AppText variant="caption" color={colors.text.muted} style={styles.infoText}>
              Lorsqu'une commande est livrée avec succès, vos fonds sont transférés directement vers ce compte Mobile Money.
            </AppText>
          </View>
        </View>

        {/* Sélection de l'opérateur avec vrais logos */}
        <View style={styles.section}>
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            CHOISISSEZ VOTRE OPÉRATEUR MOBILE MONEY
          </AppText>

          <View style={styles.operatorsGrid}>
            {OPERATORS.map((op) => {
              const isSelected = selectedNetwork === op.id;
              return (
                <AppPressable
                  key={op.id}
                  haptic="selection"
                  onPress={() => setSelectedNetwork(op.id)}
                  style={[
                    styles.operatorCard,
                    { backgroundColor: colors.bg.surface },
                    isSelected && { borderColor: accent.DEFAULT, borderWidth: 2, backgroundColor: op.bgColor },
                  ]}
                >
                  <View style={styles.logoContainer}>
                    <Image source={op.logo} style={styles.operatorLogo} resizeMode="contain" />
                  </View>
                  <AppText variant="bodyStrong" color={colors.text.body} numberOfLines={1}>
                    {op.name}
                  </AppText>
                  <View style={[styles.badgePill, { backgroundColor: isSelected ? accent.DEFAULT : colors.bg.subtle }]}>
                    <AppText
                      variant="overline"
                      color={isSelected ? colors.text.inverse : colors.text.subtle}
                      style={styles.badgeText}
                    >
                      {op.badge}
                    </AppText>
                  </View>

                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: accent.DEFAULT }]}>
                      <Check size={12} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                </AppPressable>
              );
            })}
          </View>
        </View>

        {/* Numéro de réception */}
        <View style={styles.section}>
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            NUMÉRO DE RÉCEPTION DES FONDS
          </AppText>

          <Input
            label="Numéro Mobile Money (10 chiffres) *"
            placeholder="Ex: 07 01 02 03 04"
            value={payoutNumber}
            onChangeText={setPayoutNumber}
            keyboardType="phone-pad"
            leftIcon={<Smartphone size={16} color={colors.text.subtle} />}
            helperText="Numéro actif enregistré au nom du titulaire"
          />
        </View>

        {/* Bouton d'enregistrement */}
        <Button
          title={isSaving ? 'Enregistrement…' : 'Enregistrer mes coordonnées'}
          variant="market"
          size="lg"
          loading={isSaving}
          onPress={handleSave}
          fullWidth
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { flex: 1, gap: 1 },
  scrollContent: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[2],
    borderWidth: 1,
  },
  feedbackSuccess: { backgroundColor: colors.status.successLight, borderColor: colors.status.successBorder },
  feedbackError: { backgroundColor: colors.status.errorLight, borderColor: colors.status.errorBorder },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    padding: spacing[3] + 2,
    borderRadius: radii.xl,
    gap: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  infoIconCircle: { width: 40, height: 40, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  infoText: { marginTop: 2, lineHeight: 16 },
  section: { gap: spacing[2] },
  sectionLabel: { marginLeft: 2 },
  operatorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  operatorCard: {
    width: '48%',
    flexGrow: 1,
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  logoContainer: { width: 50, height: 38, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  operatorLogo: { width: 48, height: 34 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  badgeText: { fontSize: 9, fontWeight: '700' },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { marginTop: spacing[2] },
  flex1: { flex: 1 },
});
