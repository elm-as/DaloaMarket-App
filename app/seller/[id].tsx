import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Share, Linking, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, useListings } from '@daloa/api';
import { SellerInfo } from '@daloa/types';
import {
  colors, radii, spacing, Avatar, RatingStars, Badge, Button,
  EmptyState, AppText, AppPressable, useAccent, WhatsAppIcon,
} from '@daloa/ui';
import {
  ArrowLeft, Share2, MapPin, Store, Package, Star, ShieldCheck, AlertCircle,
} from 'lucide-react-native';
import { ListingCard } from '../../src/components/ListingCard';
import { formatWhatsAppPhone, Haptics } from '@daloa/utils';

const BANNER_FALLBACK = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SellerShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  // Requête des annonces liée au vrai UUID du vendeur
  const { data: listingsData } = useListings(seller?.id ? { sellerId: seller.id } : undefined);
  const listings = listingsData?.data || [];

  useEffect(() => {
    let active = true;

    async function fetchSeller() {
      if (!id) return;
      setIsLoading(true);
      try {
        let sellerRecord: any = null;

        // 1. Si c'est un UUID valide (ex: 8856277b-...)
        if (UUID_REGEX.test(id)) {
          const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
          sellerRecord = data;
        } else {
          // 2. Recherche par shop_slug (ex: "elmas-tresor")
          const { data: bySlug } = await supabase.from('users').select('*').eq('shop_slug', id).maybeSingle();
          if (bySlug) {
            sellerRecord = bySlug;
          } else {
            // 3. Recherche par nom de boutique
            const { data: byName } = await supabase.from('users').select('*').ilike('shop_name', id).maybeSingle();
            sellerRecord = byName;
          }
        }

        if (!active) return;

        if (sellerRecord) {
          setSeller(sellerRecord as any);
          if (sellerRecord.rating) setAvgRating(Number(sellerRecord.rating));

          // Vrais avis de la boutique avec le vrai UUID
          const { data: revs, count } = await supabase
            .from('reviews')
            .select('rating', { count: 'exact' })
            .eq('reviewed_id', sellerRecord.id);

          if (active) {
            const realCount = count ?? 0;
            setReviewCount(realCount);
            if (realCount > 0 && revs && revs.length > 0) {
              const sum = revs.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0);
              setAvgRating(sum / revs.length);
            }
          }
        } else {
          setSeller(null);
        }
      } catch {
        if (active) setSeller(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchSeller();
    return () => { active = false; };
  }, [id]);

  const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());
  const themeColor = (seller as any)?.shop_theme_color || accent.DEFAULT;

  const handleShareShop = async () => {
    Haptics.success();
    const shopName = seller?.shop_name || seller?.full_name || 'Boutique DaloaMarket';
    const slug = seller?.shop_slug || id?.slice(0, 8) || '';
    const shareUrl = `https://daloamarket.com/shop/${slug}`;
    await Share.share({
      message: `Découvrez la boutique *${shopName}* sur DaloaMarket !\n${shareUrl}\n${listings.length} articles disponibles à Daloa.`,
      title: shopName,
    });
  };

  const handleWhatsApp = () => {
    Haptics.lightImpact();
    const phone = formatWhatsAppPhone(seller?.phone);
    if (!phone) return;
    const text = encodeURIComponent(
      `Bonjour ${seller?.shop_name || seller?.full_name}, je visite votre boutique sur DaloaMarket.`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${text}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={accent.DEFAULT} />
        <AppText variant="caption" color={colors.text.muted} style={styles.topSpace}>
          Chargement de la boutique...
        </AppText>
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color={colors.status.errorDark} />
        <AppText variant="title" style={styles.topSpace}>Boutique introuvable</AppText>
        <AppText variant="caption" color={colors.text.muted} center style={styles.subText}>
          Ce commerçant n'existe pas ou le lien partagé est expiré.
        </AppText>
        <Button
          title="Retour à l'accueil"
          variant="primary"
          size="md"
          onPress={() => router.replace('/(tabs)' as any)}
          style={styles.topSpace}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Bannière + navigation */}
        <View style={[styles.bannerWrap, { paddingTop: insets.top }]}>
          <Image
            source={{ uri: seller.shop_banner_url || BANNER_FALLBACK }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerControls}>
            <AppPressable onPress={() => router.back()} rippleBorderless style={styles.controlBtn} accessibilityLabel="Retour">
              <ArrowLeft size={20} color={colors.text.inverse} />
            </AppPressable>
            <AppPressable onPress={handleShareShop} rippleBorderless style={styles.controlBtn} accessibilityLabel="Partager">
              <Share2 size={18} color={colors.text.inverse} />
            </AppPressable>
          </View>
        </View>

        {/* Fiche d'identité boutique */}
        <View style={styles.identityCard}>
          <View style={styles.avatarFloat}>
            <Avatar uri={seller.shop_logo_url || seller.avatar_url} name={seller.shop_name || seller.full_name} size={72} isPro={isPro} />
          </View>

          <View style={styles.nameRow}>
            <AppText variant="title" numberOfLines={1} style={styles.flex1}>
              {seller.shop_name || seller.full_name || 'Boutique'}
            </AppText>
            {isPro && <Badge label="PRO" variant="pro" />}
          </View>

          {seller.shop_description ? (
            <AppText variant="caption" color={colors.text.muted} style={styles.description}>
              {seller.shop_description}
            </AppText>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: accent[50] }]}>
                <Package size={14} color={accent[600]} />
              </View>
              <AppText variant="bodyStrong">{listings.length}</AppText>
              <AppText variant="caption" color={colors.text.muted}>articles</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Star size={14} color="#D97706" />
              </View>
              <AppText variant="bodyStrong">{avgRating != null ? avgRating.toFixed(1) : '-'}</AppText>
              <AppText variant="caption" color={colors.text.muted}>note</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.status.infoLight }]}>
                <ShieldCheck size={14} color={colors.status.infoDark} />
              </View>
              <AppText variant="bodyStrong">{reviewCount}</AppText>
              <AppText variant="caption" color={colors.text.muted}>{reviewCount > 1 ? 'avis' : 'avis'}</AppText>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={themeColor} />
            <AppText variant="caption" color={colors.text.muted}>{seller.district || 'Daloa'}</AppText>
            {reviewCount > 0 && avgRating != null ? (
              <View style={styles.starsMargin}>
                <RatingStars rating={avgRating} totalReviews={reviewCount} size={12} />
              </View>
            ) : (
              <View style={styles.starsMargin}>
                <AppText variant="caption" color={colors.text.subtle}>· Nouveau vendeur</AppText>
              </View>
            )}
          </View>

          <View style={styles.ctaRow}>
            <Button
              title="WhatsApp"
              variant="whatsapp"
              size="md"
              leftIcon={<WhatsAppIcon size={16} color={colors.text.inverse} />}
              onPress={handleWhatsApp}
              style={styles.flex1}
            />
            <Button
              title="Partager"
              variant="outline"
              size="md"
              leftIcon={<Share2 size={15} color={colors.text.DEFAULT} />}
              onPress={handleShareShop}
            />
          </View>
        </View>

        {/* Catalogue d'articles */}
        <View style={styles.catalogHeader}>
          <AppText variant="subtitle">Catalogue ({listings.length})</AppText>
          {listings.length > 0 && (
            <AppText variant="caption" color={colors.text.subtle}>Articles disponibles maintenant</AppText>
          )}
        </View>

        {listings.length === 0 ? (
          <EmptyState
            icon={<Store size={32} color={accent.DEFAULT} />}
            title="Aucun article disponible"
            description="Ce vendeur n'a pas encore publié d'article."
          />
        ) : (
          <View style={styles.grid}>
            {listings.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}` as any)} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + spacing[8] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.DEFAULT, padding: spacing[6] },
  scroll: { paddingBottom: 0 },
  topSpace: { marginTop: spacing[3] },
  subText: { marginTop: spacing[1], maxWidth: 280 },
  bannerWrap: { height: 200, position: 'relative', overflow: 'hidden', backgroundColor: colors.bg.subtle },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  bannerControls: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  controlBtn: { width: 38, height: 38, borderRadius: radii.full, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  identityCard: {
    marginHorizontal: spacing[4], marginTop: -40, backgroundColor: colors.bg.surface, borderRadius: radii['2xl'],
    borderWidth: 1, borderColor: colors.border.DEFAULT, padding: spacing[4], paddingTop: spacing[5], gap: spacing[2],
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  avatarFloat: {
    position: 'absolute', top: -36, left: spacing[4], borderWidth: 3, borderColor: colors.bg.surface,
    borderRadius: radii.full, backgroundColor: colors.bg.surface,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 40 },
  flex1: { flex: 1 },
  description: { lineHeight: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.subtle, borderRadius: radii.xl, padding: spacing[3], marginTop: spacing[1] },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statIcon: { width: 28, height: 28, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border.subtle },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starsMargin: { marginLeft: spacing[2] },
  ctaRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },
  catalogHeader: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2], gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[3], gap: spacing[2] },
  gridItem: { width: '48%' },
});
