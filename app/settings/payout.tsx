import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { payoutService, usePayoutSettings } from '@daloa/api';
import { MOBILE_MONEY_NETWORKS } from '@daloa/config';
import { colors, radii, spacing, Input, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import { CreditCard, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function PayoutSettingsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: currentSettings, refetch } = usePayoutSettings(user?.id);

  const [network, setNetwork] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');
  const [phone, setPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setNetwork((currentSettings.network as any) || 'wave');
      setPhone(currentSettings.phone || '');
      setAccountName(currentSettings.accountName || '');
    }
  }, [currentSettings]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!phone.trim() || phone.length < 8) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone valide.');
      return;
    }
    if (!accountName.trim()) {
      Alert.alert('Erreur', 'Le nom du titulaire du compte est requis.');
      return;
    }

    try {
      setIsSaving(true);
      await payoutService.savePayoutSettings(user.id, {
        network,
        phone: phone.trim(),
        accountName: accountName.trim(),
        isActive: true,
      });

      Haptics.success();
      refetch();
      Alert.alert(
        'Compte enregistré',
        'Vos informations Mobile Money ont été enregistrées pour vos futurs retraits.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d’enregistrer le compte');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero */}
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
              Mobile Money
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Compte de retrait
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <CreditCard size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Sécurité */}
          <View style={styles.securityCard}>
            <ShieldCheck size={24} color={colors.status.successDark} />
            <View style={styles.flex1}>
              <AppText variant="bodyStrong" color={colors.status.successDark}>
                Sécurité des reversements
              </AppText>
              <AppText variant="caption" color={colors.status.successDark} style={styles.securityDesc}>
                Ce compte recevra automatiquement vos gains de ventes ou de livraison sous 24h ouvrées.
              </AppText>
            </View>
          </View>

          {/* Réseau */}
          <AppText variant="label" color={colors.text.body}>
            Réseau Mobile Money *
          </AppText>
          <View style={styles.networksGrid}>
            {MOBILE_MONEY_NETWORKS.map((net) => {
              const isSelected = network === net.id;
              return (
                <AppPressable
                  key={net.id}
                  haptic="selection"
                  onPress={() => setNetwork(net.id as any)}
                  style={[
                    styles.networkCard,
                    isSelected && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
                  ]}
                >
                  <View style={[styles.networkDot, { backgroundColor: net.color }]} />
                  <AppText
                    variant="bodyStrong"
                    color={isSelected ? accent[700] : colors.text.DEFAULT}
                    style={styles.networkName}
                  >
                    {net.name}
                  </AppText>
                  {isSelected && <CheckCircle2 size={16} color={accent.DEFAULT} />}
                </AppPressable>
              );
            })}
          </View>

          <Input
            label="Numéro de téléphone du compte *"
            placeholder="Ex: 07 01 02 03 04"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Nom & prénoms du titulaire *"
            placeholder="Ex: Kouamé Konan Jean"
            value={accountName}
            onChangeText={setAccountName}
            helperText="Le nom doit correspondre à celui enregistré chez votre opérateur"
          />

          <Button
            title="Enregistrer mon compte"
            variant="market"
            size="lg"
            loading={isSaving}
            onPress={handleSave}
            fullWidth
            style={styles.saveBtn}
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
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  securityDesc: {
    marginTop: 2,
  },
  networksGrid: {
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    gap: spacing[3],
    overflow: 'hidden',
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  networkName: {
    flex: 1,
  },
  saveBtn: {
    marginTop: spacing[2],
  },
});
