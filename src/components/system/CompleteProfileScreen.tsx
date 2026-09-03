import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, Input, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import { UserCheck, MapPin, LogOut } from 'lucide-react-native';
import { supabase } from '@daloa/api';
import { Haptics } from '@daloa/utils';
import { useAuth } from '../../context/AuthContext';
import { DistrictPickerSheet } from '../settings/DistrictPickerSheet';

/**
 * Écran de complétion de profil — affiché tant que nom / téléphone / quartier
 * ne sont pas renseignés (ex : compte créé via Google). Bloque l'accès à l'app
 * pour garantir des commandes et livraisons exploitables, comme sur le web.
 */
export const CompleteProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, profile, refreshProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [district, setDistrict] = useState<string>((profile as any)?.district || '');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) return Alert.alert('Nom requis', 'Veuillez saisir votre nom complet.');
    if (phone.trim().replace(/\D/g, '').length < 8)
      return Alert.alert('Numéro invalide', 'Veuillez saisir un numéro WhatsApp valide.');
    if (!district.trim()) return Alert.alert('Quartier requis', 'Veuillez sélectionner votre quartier.');

    if (!user?.id) return;
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim(), phone: phone.trim(), district })
        .eq('id', user.id);
      if (error) throw error;
      Haptics.success();
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d’enregistrer votre profil.');
    } finally {
      setIsSaving(false);
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
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Dernière étape
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Complétez votre profil
            </AppText>
          </View>
          <AppPressable onPress={() => logout()} rippleBorderless style={styles.logoutBtn} accessibilityLabel="Se déconnecter">
            <LogOut size={18} color="rgba(255,255,255,0.9)" />
          </AppPressable>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.iconBox}>
          <UserCheck size={34} color={accent.DEFAULT} />
        </View>
        <AppText variant="body" color={colors.text.muted} center style={styles.intro}>
          Ces informations sont nécessaires pour vos commandes, la livraison et le contact vendeur.
        </AppText>

        <Input
          label="Nom complet *"
          placeholder="Ex : Jean Kouassi"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
        <Input
          label="Numéro WhatsApp *"
          placeholder="07 01 02 03 04"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <AppText variant="label" style={styles.fieldLabel}>
          Quartier *
        </AppText>
        <AppPressable onPress={() => setIsPickerOpen(true)} style={styles.districtBtn} accessibilityLabel="Choisir votre quartier">
          <MapPin size={16} color={district ? accent.DEFAULT : colors.text.subtle} />
          <AppText variant="body" color={district ? colors.text.DEFAULT : colors.text.subtle} style={styles.flex1}>
            {district || 'Sélectionner votre quartier'}
          </AppText>
        </AppPressable>

        <Button
          title="Enregistrer et continuer"
          variant="market"
          size="lg"
          loading={isSaving}
          onPress={handleSave}
          fullWidth
          style={styles.saveBtn}
        />

        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>

      <DistrictPickerSheet
        visible={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedDistrict={district}
        onSelectDistrict={(d) => {
          setDistrict(d);
          setIsPickerOpen(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitles: { flex: 1 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scroll: { padding: spacing[4], gap: spacing[3] },
  iconBox: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  intro: { marginBottom: spacing[2] },
  fieldLabel: { marginBottom: -spacing[1] },
  districtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    height: 52,
  },
  flex1: { flex: 1 },
  saveBtn: { marginTop: spacing[3] },
});
