import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Pressable,
  Modal,
  Animated,
  TextInput,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../src/context/AuthContext';
import { authService, supabase } from '@daloa/api';
import { DALOA_DISTRICTS } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  typography,
  Input,
  Button,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import {
  ArrowLeft,
  Store,
  MapPin,
  Navigation,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Search,
  X,
  Check,
  Save,
  Palette,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

const THEME_COLORS = [
  { value: '#FF7F00', label: 'Orange' },
  { value: '#0066CC', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#1F2937', label: 'Anthracite' },
];

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';

async function uploadToStorage(userId: string, uri: string, bucket: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      upsert: true,
    });
    if (error) { console.warn('Upload error:', error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn('Upload failed:', err);
    return null;
  }
}

export default function ShopSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, profile, refreshProfile } = useAuth();

  const [shopName, setShopName] = useState(profile?.shop_name || profile?.full_name || '');
  const [shopDescription, setShopDescription] = useState(profile?.shop_description || '');
  const [shopSlug, setShopSlug] = useState(profile?.shop_slug || '');
  const [themeColor, setThemeColor] = useState((profile as any)?.shop_theme_color || '#FF7F00');
  const [district, setDistrict] = useState(profile?.district || '');
  const [address, setAddress] = useState((profile as any)?.address || '');
  const [latitude, setLatitude] = useState<number | null>((profile as any)?.shop_latitude || null);
  const [longitude, setLongitude] = useState<number | null>((profile as any)?.shop_longitude || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>((profile as any)?.shop_banner_url || null);
  const [logoUrl, setLogoUrl] = useState<string | null>((profile as any)?.shop_logo_url || null);
  const [cashOnDelivery, setCashOnDelivery] = useState(Boolean((profile as any)?.cash_on_delivery_enabled));

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [locating, setLocating] = useState(false);

  // District picker
  const [districtPickerOpen, setDistrictPickerOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const slideY = React.useRef(new Animated.Value(600)).current;

  const openDistrictPicker = () => {
    setDistrictSearch('');
    setDistrictPickerOpen(true);
    Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }).start();
  };
  const closeDistrictPicker = () => {
    Animated.timing(slideY, { toValue: 600, duration: 220, useNativeDriver: true }).start(() =>
      setDistrictPickerOpen(false)
    );
  };

  const filteredDistricts = districtSearch.trim()
    ? ([...DALOA_DISTRICTS]).filter((d) =>
        d.toLowerCase().includes(districtSearch.toLowerCase())
      )
    : ([...DALOA_DISTRICTS]);

  const handleLocate = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation dans les paramètres de votre téléphone.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      Haptics.success();
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer votre position.');
    } finally {
      setLocating(false);
    }
  };

  const pickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission nécessaire', "Autorisez l'accès aux photos."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0] || !user?.id) return;
    setUploadingBanner(true);
    const url = await uploadToStorage(user.id, result.assets[0].uri, 'avatars');
    if (url) {
      setBannerUrl(url);
      await authService.updateProfile(user.id, { shop_banner_url: url } as any);
    }
    setUploadingBanner(false);
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission nécessaire', "Autorisez l'accès aux photos."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0] || !user?.id) return;
    setUploadingLogo(true);
    const url = await uploadToStorage(user.id, result.assets[0].uri, 'avatars');
    if (url) {
      setLogoUrl(url);
      await authService.updateProfile(user.id, { shop_logo_url: url } as any);
    }
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!shopName.trim()) { Alert.alert('Erreur', 'Le nom de boutique est obligatoire.'); return; }
    if (!district) { Alert.alert('Erreur', 'Choisissez un quartier.'); return; }

    try {
      setIsSaving(true);
      await authService.updateProfile(user.id, {
        shop_name: shopName.trim(),
        shop_description: shopDescription.trim() || null,
        shop_slug: shopSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || null,
        shop_theme_color: themeColor,
        district,
        address: address.trim() || null,
        shop_latitude: latitude,
        shop_longitude: longitude,
        cash_on_delivery_enabled: cashOnDelivery,
        shop_banner_url: bannerUrl,
        shop_logo_url: logoUrl,
      } as any);
      await refreshProfile();
      Haptics.success();
      Alert.alert('Enregistré !', 'Votre boutique a bien été mise à jour.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d\'enregistrer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Hero bannière ── */}
      <View style={[styles.heroWrap, { paddingTop: insets.top }]}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient
            colors={[accent[400], accent[600], accent[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroCenter}>
            <View style={styles.heroIconCircle}>
              <Store size={20} color={accent[700]} />
            </View>
            <View>
              <AppText variant="overline" color="rgba(255,255,255,0.75)">
                PARAMÈTRES
              </AppText>
              <AppText variant="h2" color={colors.text.inverse} numberOfLines={1}>
                {shopName || 'Ma boutique'}
              </AppText>
            </View>
          </View>
          <AppPressable onPress={pickBanner} rippleBorderless style={styles.changeBannerBtn}>
            <Camera size={14} color={colors.text.inverse} />
            <AppText variant="overline" color={colors.text.inverse}>
              {uploadingBanner ? '...' : 'Bannière'}
            </AppText>
          </AppPressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── Logo de vitrine ── */}
        <View style={styles.logoRow}>
          <AppPressable onPress={pickLogo} style={styles.logoZone}>
            {uploadingLogo ? (
              <ActivityIndicator color={accent.DEFAULT} />
            ) : logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImg} contentFit="cover" />
            ) : (
              <View style={styles.logoEmpty}>
                <ImageIcon size={22} color={accent[400]} />
              </View>
            )}
            <View style={[styles.logoCameraBtn, { backgroundColor: accent.DEFAULT }]}>
              <Camera size={11} color={colors.text.inverse} />
            </View>
          </AppPressable>
          <View style={styles.logoHint}>
            <AppText variant="bodyStrong">Logo de vitrine</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              Format carré · 400×400 recommandé
            </AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              Distinct de votre avatar personnel
            </AppText>
          </View>
        </View>

        {/* ── Identité ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Store size={13} color={accent.DEFAULT} />
            <AppText variant="overline" color={colors.text.muted}>
              IDENTITÉ DE LA VITRINE
            </AppText>
          </View>
          <Input
            label="Nom commercial *"
            placeholder="Ex: Boutique Élégance Daloa"
            value={shopName}
            onChangeText={setShopName}
            maxLength={50}
          />
          <Input
            label="Identifiant URL (slug)"
            placeholder="ex: elegance-daloa"
            value={shopSlug}
            onChangeText={setShopSlug}
            autoCapitalize="none"
            helperText="daloamarket.com/shop/votre-slug"
          />
          <Input
            label="Description & spécialité"
            placeholder="Présentez votre boutique, horaires et garanties..."
            value={shopDescription}
            onChangeText={setShopDescription}
            multiline
            numberOfLines={3}
            inputStyle={styles.textArea}
            maxLength={200}
          />

          {/* Couleur d'accentuation */}
          <View style={styles.colorSection}>
            <View style={styles.colorLabelRow}>
              <Palette size={13} color={accent.DEFAULT} />
              <AppText variant="label" color={colors.text.body}>
                Couleur d'accentuation
              </AppText>
              <View style={[styles.colorPreviewChip, { backgroundColor: themeColor }]}>
                <AppText variant="overline" color={colors.text.inverse}>
                  {THEME_COLORS.find((c) => c.value === themeColor)?.label || 'Choisie'}
                </AppText>
              </View>
            </View>
            <View style={styles.colorRow}>
              {THEME_COLORS.map((tc) => {
                const isSel = tc.value === themeColor;
                return (
                  <AppPressable
                    key={tc.value}
                    haptic="selection"
                    rippleBorderless
                    onPress={() => setThemeColor(tc.value)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: tc.value },
                      isSel && styles.colorCircleActive,
                    ]}
                  >
                    {isSel && <View style={styles.colorInnerDot} />}
                  </AppPressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Localisation ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={13} color={accent.DEFAULT} />
            <AppText variant="overline" color={colors.text.muted}>
              LOCALISATION GPS DE LA BOUTIQUE
            </AppText>
          </View>
          <AppText variant="caption" color={colors.text.muted} style={styles.sectionDesc}>
            Position requise pour calculer automatiquement les frais de livraison.
          </AppText>

          {/* District picker */}
          <AppText variant="label" color={colors.text.body} style={styles.fieldLabel}>
            Quartier principal *
          </AppText>
          <AppPressable
            haptic="selection"
            onPress={openDistrictPicker}
            style={[styles.selectField, district && { borderColor: accent[300] }]}
          >
            <View style={[styles.selectIcon, { backgroundColor: accent[50] }]}>
              <MapPin size={13} color={accent.DEFAULT} />
            </View>
            <AppText
              variant="body"
              color={district ? colors.text.DEFAULT : colors.text.subtle}
              style={styles.flex1}
            >
              {district || 'Choisir un quartier…'}
            </AppText>
            <ChevronDown size={16} color={colors.text.muted} />
          </AppPressable>

          {/* Adresse */}
          <Input
            label="Adresse / repère"
            placeholder="Ex: Face au grand marché, boutique N°12"
            value={address}
            onChangeText={setAddress}
            style={styles.inputNoTop}
          />

          {/* Bouton GPS */}
          <AppPressable
            haptic="light"
            onPress={handleLocate}
            style={[styles.gpsBtn, { borderColor: accent[200], backgroundColor: accent[50] }]}
          >
            {locating ? (
              <ActivityIndicator size="small" color={accent.DEFAULT} />
            ) : (
              <Navigation size={15} color={accent[600]} />
            )}
            <View style={styles.flex1}>
              <AppText variant="label" color={accent[700]}>
                {locating ? 'Localisation en cours…' : 'Utiliser ma position GPS'}
              </AppText>
              {latitude !== null ? (
                <AppText variant="caption" color={accent[500]} style={styles.coordsText}>
                  {latitude.toFixed(5)}, {longitude?.toFixed(5)} · Sauvegarde automatique
                </AppText>
              ) : (
                <AppText variant="caption" color={colors.text.subtle}>
                  Cliquez pour placer votre boutique
                </AppText>
              )}
            </View>
            {latitude !== null && <Check size={14} color={colors.status.successDark} />}
          </AppPressable>
        </View>

        {/* ── Options ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="overline" color={colors.text.muted}>
              OPTIONS DE VENTE
            </AppText>
          </View>
          <View style={styles.switchRow}>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Paiement à la livraison (COD)</AppText>
              <AppText variant="caption" color={colors.text.muted} style={{ marginTop: 2 }}>
                Clients règlent en espèces à la remise du colis.
              </AppText>
            </View>
            <Switch
              value={cashOnDelivery}
              onValueChange={(v) => { Haptics.lightImpact(); setCashOnDelivery(v); }}
              trackColor={{ false: colors.border.DEFAULT, true: accent.DEFAULT }}
              thumbColor={colors.bg.surface}
            />
          </View>
        </View>

        {/* ── Save ── */}
        <Button
          title="Enregistrer la boutique"
          variant="market"
          size="lg"
          loading={isSaving}
          onPress={handleSave}
          fullWidth
          leftIcon={<Save size={16} color={colors.text.inverse} />}
          style={styles.saveBtn}
        />

        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>

      {/* ── District picker bottom sheet ── */}
      {districtPickerOpen && (
        <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={closeDistrictPicker}>
          <Pressable style={styles.backdrop} onPress={closeDistrictPicker} />
          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing[4]), transform: [{ translateY: slideY }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <MapPin size={15} color={accent.DEFAULT} />
                <AppText variant="title">Choisir un quartier</AppText>
              </View>
              <AppPressable onPress={closeDistrictPicker} rippleBorderless style={styles.closeBtn}>
                <X size={18} color={colors.text.muted} />
              </AppPressable>
            </View>
            <View style={styles.searchBox}>
              <Search size={14} color={colors.text.muted} />
              <TextInput
                value={districtSearch}
                onChangeText={setDistrictSearch}
                placeholder="Rechercher un quartier…"
                placeholderTextColor={colors.text.subtle}
                style={styles.searchInput}
                autoCorrect={false}
              />
              {districtSearch.length > 0 && (
                <AppPressable rippleBorderless onPress={() => setDistrictSearch('')} style={{ padding: 4 }}>
                  <X size={13} color={colors.text.muted} />
                </AppPressable>
              )}
            </View>
            <FlatList
              data={filteredDistricts}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                const isSel = item === district;
                return (
                  <AppPressable
                    haptic="selection"
                    onPress={() => {
                      setDistrict(item);
                      closeDistrictPicker();
                    }}
                    style={[styles.districtRow, isSel && { backgroundColor: accent[50] }]}
                  >
                    <View style={[styles.districtDot, { backgroundColor: isSel ? accent.DEFAULT : colors.border.strong }]} />
                    <AppText variant={isSel ? 'bodyStrong' : 'body'} color={isSel ? accent[700] : colors.text.body} style={styles.flex1}>
                      {item}
                    </AppText>
                    {isSel && <Check size={15} color={accent.DEFAULT} strokeWidth={2.5} />}
                  </AppPressable>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { marginLeft: spacing[4] + 8 + spacing[3] }]} />
              )}
            />
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  // ── Hero ──
  heroWrap: {
    height: 130,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  heroIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  // ── Logo ──
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  logoZone: {
    width: 70,
    height: 70,
    borderRadius: radii.xl,
    overflow: 'visible',
    position: 'relative',
    flexShrink: 0,
  },
  logoImg: {
    width: 70,
    height: 70,
    borderRadius: radii.xl,
  },
  logoEmpty: {
    width: 70,
    height: 70,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  logoHint: {
    flex: 1,
    gap: 2,
  },
  // ── Sections ──
  scrollContent: {
    paddingTop: spacing[1],
  },
  sectionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[4],
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionDesc: {
    marginTop: -4,
    marginBottom: spacing[2],
  },
  fieldLabel: {
    marginBottom: 4,
  },
  inputNoTop: {
    marginTop: spacing[2],
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  // ── Colors ──
  colorSection: {
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  colorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorPreviewChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginLeft: 'auto',
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: colors.text.DEFAULT,
    transform: [{ scale: 1.1 }],
  },
  colorInnerDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  // ── Localisation ──
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.grey[50],
    overflow: 'hidden',
  },
  selectIcon: {
    width: 26,
    height: 26,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1.5,
    borderRadius: radii.xl,
    padding: spacing[3],
    marginTop: spacing[1],
    overflow: 'hidden',
  },
  coordsText: {
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  // ── Switch ──
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  // ── Save ──
  saveBtn: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  flex1: { flex: 1 },
  // ── District picker sheet ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
    height: 42,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.grey[50],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.normal,
    color: colors.text.DEFAULT,
  },
  list: { flexGrow: 0 },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  districtDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
});
