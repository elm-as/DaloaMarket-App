import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { ArrowLeft, Sparkles, Eye, MousePointerClick } from 'lucide-react-native';
import {
  colors,
  spacing,
  radii,
  typography,
  AppText,
  AppPressable,
  useAccent,
  showAlert,
} from '@daloa/ui';
import { PRICING_CONFIG } from '@daloa/config';
import { PromoBanner } from '@daloa/types';
import { promoBannersService, supabase } from '@daloa/api';
import { formatFCFA, Haptics } from '@daloa/utils';
import { useAuth } from '../../src/context/AuthContext';
import {
  ProCarouselForm,
  CarouselPackItem,
  ProListingItem,
} from '../../src/components/profile/ProCarouselForm';

export default function ProCarouselScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { user, profile } = useAuth();
  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());

  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [listings, setListings] = useState<ProListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [selectedPackIndex, setSelectedPackIndex] = useState(1);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const packs: CarouselPackItem[] = (PRICING_CONFIG.carouselBannerPacks as any) || [
    { id: 'carousel_7d', days: 7, price: 3000, label: '7 jours de diffusion' },
    { id: 'carousel_14d', days: 14, price: 5000, label: '14 jours de diffusion', popular: true },
    { id: 'carousel_30d', days: 30, price: 10000, label: '30 jours de diffusion' },
  ];

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [bannersRes, listingsRes] = await Promise.all([
        promoBannersService.getSellerBanners(user.id),
        supabase
          .from('listings')
          .select('id, title, price, photos')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(15),
      ]);
      setBanners(bannersRes);
      setListings((listingsRes.data as any) || []);
    } catch {
      showAlert('Erreur', 'Impossible de charger vos données Carrousel');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Accès refusé', 'Autorisez l’accès aux photos pour choisir votre affiche.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingImage(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() || 'jpg';
      const path = `banners/${user?.id}-${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setImageUrl(data.publicUrl);
      Haptics.success();
    } catch {
      showAlert('Erreur', 'Échec du téléversement du visuel.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSelectListing = (item: ProListingItem) => {
    if (selectedListingId === item.id) {
      setSelectedListingId(null);
      return;
    }
    setSelectedListingId(item.id);
    if (!title) setTitle(item.title.slice(0, 45));
    if (!imageUrl && item.photos?.[0]) setImageUrl(item.photos[0]);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!title.trim() || !imageUrl.trim()) {
      showAlert('Champs requis', 'Veuillez renseigner un titre et choisir une affiche 16:9.');
      return;
    }
    const pack = packs[selectedPackIndex];
    setSubmitting(true);
    try {
      const created = await promoBannersService.createSellerBanner({
        sellerId: user.id,
        sponsorName: profile?.shop_name || profile?.full_name || 'Vendeur Pro',
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        imageUrl: imageUrl.trim(),
        badgeText: 'VEDETTE PRO',
        badgeColor: accent.DEFAULT,
        linkType: selectedListingId ? 'listing' : 'seller',
        linkTarget: selectedListingId || user.id,
        durationDays: pack.days,
        pricePaid: pack.price,
      });

      if (!created) throw new Error('Échec');

      Haptics.success();
      showAlert('Affiche diffusée !', `Votre campagne Carrousel est active pour ${pack.days} jours.`);
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      setSelectedListingId(null);
      fetchData();
    } catch {
      showAlert('Erreur', 'Impossible d’enregistrer l’affiche.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPro) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <AppPressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.body} />
          </AppPressable>
          <AppText variant="title">Carrousel VIP Pro</AppText>
        </View>
        <View style={styles.proGateContainer}>
          <Sparkles size={48} color={accent.DEFAULT} />
          <AppText variant="h2" center style={styles.proGateTitle}>Réservé aux Vendeurs Pro</AppText>
          <AppText variant="body" color={colors.text.subtle} center style={styles.proGateSub}>
            Diffusez votre affiche promotionnelle tout en haut de l'application DaloaMarket pour booster vos ventes.
          </AppText>
          <AppPressable
            haptic="medium"
            onPress={() => router.push('/pro/become-pro' as any)}
            style={[styles.ctaBtn, { backgroundColor: accent.DEFAULT }]}
          >
            <AppText variant="bodyStrong" color="#FFFFFF">Devenir Vendeur Pro</AppText>
          </AppPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppPressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text.body} />
        </AppPressable>
        <View style={styles.headerTitles}>
          <AppText variant="title">Carrousel Accueil VIP</AppText>
          <AppText variant="caption" color={colors.text.subtle}>Exclusivité Vendeurs Pro</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={accent.DEFAULT} style={styles.loader} />}

        {banners.length > 0 && (
          <View style={styles.section}>
            <AppText variant="overline" color={colors.text.muted} style={styles.sectionOverline}>
              MES AFFICHES EN LIGNE ({banners.length})
            </AppText>
            {banners.map((b) => (
              <View key={b.id} style={styles.bannerRow}>
                <ExpoImage source={{ uri: b.image_url }} style={styles.bannerThumbnail} contentFit="cover" />
                <View style={styles.bannerMeta}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{b.title}</AppText>
                  <View style={styles.statsInline}>
                    <AppText variant="caption" color={colors.text.subtle} style={styles.tabular}>
                      <Eye size={12} color={colors.text.subtle} /> {b.views_count} vues
                    </AppText>
                    <AppText
                      variant="caption"
                      color={colors.primary.DEFAULT}
                      style={[styles.clicksText, styles.tabular]}
                    >
                      <MousePointerClick size={12} color={colors.primary.DEFAULT} /> {b.clicks_count} clics
                    </AppText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <ProCarouselForm
          packs={packs}
          selectedPackIndex={selectedPackIndex}
          onSelectPackIndex={setSelectedPackIndex}
          listings={listings}
          selectedListingId={selectedListingId}
          onSelectListing={handleSelectListing}
          title={title}
          onChangeTitle={setTitle}
          subtitle={subtitle}
          onChangeSubtitle={setSubtitle}
          imageUrl={imageUrl}
          onPickImage={handlePickImage}
          uploadingImage={uploadingImage}
          submitting={submitting}
          onSubmit={handleSubmit}
          accentColor={accent.DEFAULT}
          accentBg={accent[50]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
    gap: spacing[3],
  },
  backBtn: { width: 36, height: 36, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1 },
  scrollContent: { padding: spacing[3], paddingBottom: spacing[10], gap: spacing[3] },
  loader: { marginVertical: spacing[2] },
  proGateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[3] },
  proGateTitle: { marginTop: spacing[2] },
  proGateSub: { maxWidth: 300 },
  ctaBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: radii.full, marginTop: spacing[3] },
  section: { gap: spacing[2] },
  sectionOverline: { letterSpacing: 0.8 },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[2],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  bannerThumbnail: { width: 80, height: 50, borderRadius: radii.lg },
  bannerMeta: { flex: 1, gap: 2 },
  statsInline: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: 2 },
  clicksText: { fontFamily: typography.families.bold },
  tabular: { fontVariant: ['tabular-nums'] },
});
