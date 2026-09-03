import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
import { colors, radii, spacing, Input, Button, AppText, AppPressable, Avatar, useAccent } from '@daloa/ui';
import { ArrowLeft, Camera, User, Phone, MapPin, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';
import { DistrictPickerSheet } from '../../src/components/settings/DistrictPickerSheet';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';

async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/avatar_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: mimeType, upsert: true });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, profile, refreshProfile, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [district, setDistrict] = useState((profile as any)?.district || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [districtSheetVisible, setDistrictSheetVisible] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isAuthenticated || !user) {
    return (
      <AuthGuardView
        title="Informations du compte"
        description="Connectez-vous pour modifier votre profil personnel."
        fallbackRoute="/(tabs)/profile"
      />
    );
  }

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0] || !user?.id) return;

      setUploadingAvatar(true);
      const url = await uploadAvatar(user.id, result.assets[0].uri);
      if (url) {
        setAvatarUrl(url);
        await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
        await refreshProfile();
        Haptics.success();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Échec du téléversement de la photo' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setFeedback({ type: 'error', text: 'Veuillez renseigner votre nom complet.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          district: district.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Haptics.success();
      setFeedback({ type: 'success', text: 'Informations personnelles mises à jour avec succès !' });
      setTimeout(() => {
        safeBack(router, '/settings');
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Impossible d’enregistrer le profil.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header dégradé */}
      <LinearGradient
        colors={[accent[500], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[3] }]}
      >
        <AppPressable
          onPress={() => safeBack(router, '/settings')}
          rippleBorderless
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={18} color={colors.text.inverse} />
        </AppPressable>
        <View style={styles.headerTitles}>
          <AppText variant="overline" color={accent[100]}>MON COMPTE</AppText>
          <AppText variant="title" color={colors.text.inverse}>Informations personnelles</AppText>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {feedback && (
          <View style={[styles.feedbackBanner, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
            {feedback.type === 'error' ? (
              <AlertCircle size={16} color={colors.status.errorDark} />
            ) : (
              <CheckCircle2 size={16} color={colors.status.successDark} />
            )}
            <AppText
              variant="caption"
              color={feedback.type === 'error' ? colors.status.errorDark : colors.status.successDark}
              style={styles.feedbackText}
            >
              {feedback.text}
            </AppText>
          </View>
        )}

        {/* Photo de profil personnelle */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Avatar
              name={fullName || 'Utilisateur'}
              uri={avatarUrl || undefined}
              size={84}
            />
            <AppPressable
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              style={[styles.cameraBtn, { backgroundColor: accent.DEFAULT }]}
              accessibilityLabel="Changer la photo de profil"
            >
              <Camera size={16} color={colors.text.inverse} />
            </AppPressable>
          </View>
          <AppText variant="caption" color={colors.text.subtle} style={styles.avatarHelp}>
            Touchez l'icône appareil pour changer votre photo
          </AppText>
        </View>

        {/* Formulaire des coordonnées personnelles */}
        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={colors.text.subtle} style={styles.label}>
              Nom et prénom
            </AppText>
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex: Kouamé Jean"
              leftIcon={<User size={16} color={colors.text.subtle} />}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={colors.text.subtle} style={styles.label}>
              Numéro de téléphone
            </AppText>
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="Ex: 0701020304"
              keyboardType="phone-pad"
              leftIcon={<Phone size={16} color={colors.text.subtle} />}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={colors.text.subtle} style={styles.label}>
              Quartier de résidence à Daloa
            </AppText>
            <AppPressable
              onPress={() => setDistrictSheetVisible(true)}
              style={styles.districtSelector}
              accessibilityLabel="Sélectionner mon quartier"
            >
              <View style={styles.districtLeft}>
                <MapPin size={16} color={accent[600]} />
                <AppText variant="body" color={district ? colors.text.body : colors.text.subtle}>
                  {district || 'Choisir un quartier à Daloa'}
                </AppText>
              </View>
              <ChevronDown size={18} color={colors.text.subtle} />
            </AppPressable>
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <Button
          title="Enregistrer mes informations"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          fullWidth
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>

      {/* Sélecteur de quartier */}
      <DistrictPickerSheet
        visible={districtSheetVisible}
        selectedDistrict={district}
        onSelectDistrict={(d: string) => {
          setDistrict(d);
          setDistrictSheetVisible(false);
        }}
        onClose={() => setDistrictSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.xl,
    marginBottom: spacing[4],
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: colors.status.errorLight,
    borderColor: colors.status.error,
  },
  feedbackSuccess: {
    backgroundColor: colors.status.successLight,
    borderColor: colors.status.success,
  },
  feedbackText: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  avatarHelp: {
    marginTop: spacing[2],
  },
  formCard: {
    backgroundColor: colors.bg.surface,
    padding: spacing[4],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
  },
  districtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  saveBtn: {
    marginTop: spacing[2],
  },
});
