import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
import { DALOA_CENTER, PRICING_CONFIG } from '@daloa/config';
import { colors, radii, spacing, Input, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  ArrowLeft, MapPin, Check, ChevronDown, Palette, AlertCircle, CheckCircle2, Truck,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';
import { ShopLocationMap } from '../../src/components/settings/ShopLocationMap';
import { DistrictPickerSheet } from '../../src/components/settings/DistrictPickerSheet';
import { ShopHeaderBanner } from '../../src/components/settings/ShopHeaderBanner';
import { ShopProGateCard } from '../../src/components/settings/ShopProGateCard';
import { usePhase } from '../../src/context/PhaseContext';

const THEME_COLORS = [
  { value: '#FF7F00', label: 'Orange' },
  { value: '#0066CC', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#1F2937', label: 'Anthracite' },
];

function generateSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function uploadToStorage(userId: string, uri: string, bucket: string): Promise<string | null> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: mimeType, upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export default function ShopSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, profile, refreshProfile, isAuthenticated } = useAuth();
  const { isPhase0 } = usePhase();

  const isPro = profile?.isPro ?? Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());
  const shopUnlocked = isPro || isPhase0;

  const [shopName, setShopName] = useState(profile?.shop_name || profile?.full_name || '');
  const [shopDescription, setShopDescription] = useState(profile?.shop_description || '');
  const [shopSlug, setShopSlug] = useState(profile?.shop_slug || '');
  const [themeColor, setThemeColor] = useState((profile as any)?.shop_theme_color || '#FF7F00');
  const [district, setDistrict] = useState(profile?.district || '');
  const [latitude, setLatitude] = useState<number | null>((profile as any)?.shop_latitude ?? DALOA_CENTER.lat);
  const [longitude, setLongitude] = useState<number | null>((profile as any)?.shop_longitude ?? DALOA_CENTER.lng);
  const [bannerUrl, setBannerUrl] = useState<string | null>((profile as any)?.shop_banner_url || null);
  const [logoUrl, setLogoUrl] = useState<string | null>((profile as any)?.shop_logo_url || null);

  const [cashOnDelivery, setCashOnDelivery] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [districtSheetVisible, setDistrictSheetVisible] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    (supabase as any)
      .from('seller_delivery_settings')
      .select('cash_on_delivery_enabled')
      .eq('seller_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setCashOnDelivery(Boolean(data.cash_on_delivery_enabled));
      });
  }, [user?.id]);

  const handleBannerAction = async () => {
    if (!shopUnlocked) {
      router.push('/pro/become-pro' as any);
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [16, 9], quality: 0.85 });
      if (result.canceled || !result.assets[0] || !user?.id) return;
      setUploadingBanner(true);
      const url = await uploadToStorage(user.id, result.assets[0].uri, 'avatars');
      if (url) {
        setBannerUrl(url);
        await supabase.from('users').update({ shop_banner_url: url }).eq('id', user.id);
        Haptics.success();
        setFeedback({ type: 'success', text: 'Bannière mise à jour !' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erreur importation bannière' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleLogoAction = async () => {
    if (!shopUnlocked) {
      router.push('/pro/become-pro' as any);
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (result.canceled || !result.assets[0] || !user?.id) return;
      setUploadingLogo(true);
      const url = await uploadToStorage(user.id, result.assets[0].uri, 'avatars');
      if (url) {
        setLogoUrl(url);
        await supabase.from('users').update({ shop_logo_url: url }).eq('id', user.id);
        Haptics.success();
        setFeedback({ type: 'success', text: 'Logo mis à jour !' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erreur importation logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLocate = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      Haptics.success();
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setIsSaving(true);
      setFeedback(null);
      const cleanSlug = generateSlug(shopSlug || shopName);

      const updates: any = {
        district: district || 'Daloa',
        shop_latitude: latitude,
        shop_longitude: longitude,
        shop_updated_at: new Date().toISOString(),
      };

      if (shopUnlocked) {
        updates.shop_name = shopName.trim();
        updates.shop_description = shopDescription.trim() || null;
        updates.shop_slug = cleanSlug || null;
        updates.shop_theme_color = themeColor;
        updates.shop_banner_url = bannerUrl;
        updates.shop_logo_url = logoUrl;
      }

      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;

      await (supabase as any).from('seller_delivery_settings').upsert(
        { seller_id: user.id, cash_on_delivery_enabled: cashOnDelivery, updated_at: new Date().toISOString() },
        { onConflict: 'seller_id' }
      );

      await refreshProfile();
      Haptics.success();
      setFeedback({ type: 'success', text: 'Paramètres enregistrés avec succès !' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erreur lors de l’enregistrement.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return <AuthGuardView title="Boutique Vendeur" description="Connectez-vous pour configurer votre boutique." fallbackRoute="/(tabs)/profile" />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <AppPressable onPress={() => safeBack(router, '/(tabs)/profile')} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
          <ArrowLeft size={18} color={colors.text.DEFAULT} />
        </AppPressable>
        <AppText variant="title" style={styles.flex1}>Vitrine Boutique</AppText>
        <AppPressable haptic="selection" onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          <AppText variant="label" color={accent[600]}>{isSaving ? '...' : 'Enregistrer'}</AppText>
        </AppPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ShopHeaderBanner
          bannerUrl={bannerUrl}
          logoUrl={logoUrl}
          shopName={shopName}
          themeColor={themeColor}
          uploadingBanner={uploadingBanner}
          uploadingLogo={uploadingLogo}
          onPickBanner={handleBannerAction}
          onPickLogo={handleLogoAction}
          isLocked={!shopUnlocked}
        />

        {feedback && (
          <View style={[styles.feedbackCard, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} color={colors.status.successDark} /> : <AlertCircle size={16} color={colors.status.errorDark} />}
            <AppText variant="caption" color={feedback.type === 'success' ? colors.status.successDark : colors.status.errorDark} style={styles.flex1}>
              {feedback.text}
            </AppText>
          </View>
        )}

        {/* ── Vitrine PRO ou Blocage ProGate ── */}
        {!shopUnlocked ? (
          <ShopProGateCard onUpgrade={() => router.push('/pro/become-pro' as any)} />
        ) : (
          <View style={styles.sectionCard}>
            <AppText variant="overline" color={colors.text.muted}>IDENTITÉ DE LA VITRINE</AppText>
            <Input label="Nom commercial *" placeholder="Ex: Boutique Élégance Daloa" value={shopName} onChangeText={setShopName} />
            <Input label="Identifiant URL (slug unique) *" placeholder="ex: elegance-daloa" value={shopSlug} onChangeText={setShopSlug} autoCapitalize="none" helperText={`daloamarket.com/shop/${shopSlug || 'votre-nom'}`} />
            <Input label="Description & spécialité" placeholder="Présentez votre boutique, spécialités et garanties..." value={shopDescription} onChangeText={setShopDescription} multiline numberOfLines={3} inputStyle={styles.textArea} maxLength={200} />

            <View style={styles.colorSection}>
              <View style={styles.colorLabelRow}>
                <Palette size={13} color={accent.DEFAULT} />
                <AppText variant="label" color={colors.text.body}>Couleur de vitrine</AppText>
              </View>
              <View style={styles.colorRow}>
                {THEME_COLORS.map((tc) => (
                  <AppPressable key={tc.value} haptic="selection" onPress={() => setThemeColor(tc.value)} style={[styles.colorCircle, { backgroundColor: tc.value }, themeColor === tc.value && styles.colorActive]}>
                    {themeColor === tc.value && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </AppPressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Section Emplacement GPS (Accessible à tous les vendeurs) ── */}
        <View style={styles.sectionCard}>
          <AppText variant="overline" color={colors.text.muted}>LOCALISATION DU COMMERCE</AppText>
          <AppText variant="caption" color={colors.text.muted}>Position requise pour calculer automatiquement les frais de livraison aux acheteurs.</AppText>

          <AppPressable onPress={() => setDistrictSheetVisible(true)} style={styles.districtSelector}>
            <MapPin size={16} color={accent.DEFAULT} />
            <AppText variant="body" style={styles.flex1}>{district || 'Sélectionner un quartier à Daloa *'}</AppText>
            <ChevronDown size={18} color={colors.text.subtle} />
          </AppPressable>

          <ShopLocationMap
            latitude={latitude}
            longitude={longitude}
            onChangeLocation={({ latitude: lat, longitude: lng }: { latitude: number; longitude: number }) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            onLocateGps={handleLocate}
            isLocating={locating}
          />
        </View>

        {/* ── Options de livraison & Paiement à la livraison ── */}
        <View style={styles.sectionCard}>
          <AppText variant="overline" color={colors.text.muted}>LIVRAISON & ENCAISSEMENT ESPÈCES</AppText>
          <View style={styles.switchRow}>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Paiement à la livraison (COD)</AppText>
              <AppText variant="caption" color={colors.text.muted} style={{ marginTop: 2 }}>
                L'encaissement en espèces est lié à vos livreurs affiliés de confiance.
              </AppText>
            </View>
            <AppPressable
              onPress={() => router.push('/affiliations' as any)}
              style={[styles.codDeliverersBtn, { backgroundColor: accent[50], borderColor: accent[200] }]}
              accessibilityLabel="Gérer mes livreurs affiliés"
            >
              <Truck size={14} color={accent[700]} />
              <AppText variant="caption" color={accent[700]} style={styles.codDeliverersText}>
                Mes Livreurs
              </AppText>
            </AppPressable>
          </View>
        </View>

        <Button title={isSaving ? 'Enregistrement…' : 'Enregistrer ma boutique'} variant="primary" size="lg" onPress={handleSave} disabled={isSaving} fullWidth />
        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>

      <DistrictPickerSheet visible={districtSheetVisible} onClose={() => setDistrictSheetVisible(false)} selectedDistrict={district} onSelectDistrict={(d) => { setDistrict(d); setDistrictSheetVisible(false); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingBottom: spacing[2], backgroundColor: colors.bg.surface, borderBottomWidth: 1, borderBottomColor: colors.border.subtle, gap: spacing[2] },
  backBtn: { width: 36, height: 36, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingHorizontal: spacing[3], paddingVertical: 6 },
  scrollContent: { padding: spacing[4], gap: spacing[4] },
  sectionCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, padding: spacing[4], gap: spacing[3] },
  districtSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border.DEFAULT, borderRadius: radii.lg, padding: spacing[3], gap: 8, backgroundColor: colors.bg.subtle },
  textArea: { height: 72, textAlignVertical: 'top' },
  colorSection: { gap: spacing[2] },
  colorLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorRow: { flexDirection: 'row', gap: spacing[3] },
  colorCircle: { width: 34, height: 34, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  colorActive: { borderWidth: 3, borderColor: '#000' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  codDeliverersBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing[3], paddingVertical: 8, borderRadius: radii.md, borderWidth: 1 },
  codDeliverersText: { fontWeight: '800' },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing[3], borderRadius: radii.lg },
  feedbackSuccess: { backgroundColor: colors.status.successLight },
  feedbackError: { backgroundColor: colors.status.errorLight },
  flex1: { flex: 1 },
});
