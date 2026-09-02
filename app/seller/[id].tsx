import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Share, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, useListings } from '@daloa/api';
import { SellerInfo } from '@daloa/types';
import {
  colors,
  radii,
  spacing,
  Avatar,
  RatingStars,
  Badge,
  Button,
  EmptyState,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  MapPin,
  Store,
  Package,
  Star,
  ShieldCheck,
} from 'lucide-react-native';
import { ListingCard } from '../../src/components/ListingCard';
import { formatWhatsAppPhone, Haptics } from '@daloa/utils';

const BANNER_FALLBACK =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';

export default function SellerShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  const [seller, setSeller] = useState<SellerInfo | null>(null);

  const { data: listingsData } = useListings({ sellerId: id });
  const listings = listingsData?.data || [];

  useEffect(() => {
    async function fetchSeller() {
      if (!id) return;
      const { data } = await supabase.from('users').select('*').eq('id', id).single();
      if (data) setSeller(data as any);
    }
    fetchSeller();
  }, [id]);

  const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());
  const rating = seller?.rating || 5.0;
  const reviewCount = seller?.review_count || listings.length;
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Bannière + back + share ── */}
        <View style={[styles.bannerWrap, { paddingTop: insets.top }]}>
          <Image
            source={{ uri: seller?.shop_banner_url || BANNER_FALLBACK }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerControls}>
            <AppPressable
              onPress={() => router.back()}
              rippleBorderless
              style={styles.controlBtn}
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={20} color={colors.text.inverse} />
            </AppPressable>
            <AppPressable
              onPress={handleShareShop}
              rippleBorderless
              style={styles.controlBtn}
              accessibilityLabel="Partager la boutique"
            >
              <Share2 size={18} color={colors.text.inverse} />
            </AppPressable>
          </View>
        </View>

        {/* ── Carte identité ── */}
        <View style={styles.identityCard}>
          {/* Avatar flottant depuis la bannière */}
          <View style={styles.avatarFloat}>
            <Avatar
              uri={seller?.shop_logo_url || seller?.avatar_url}
              name={seller?.shop_name || seller?.full_name}
              size={72}
              isPro={isPro}
            />
          </View>

          <View style={styles.nameRow}>
            <AppText variant="title" numberOfLines={1} style={styles.flex1}>
              {seller?.shop_name || seller?.full_name || 'Boutique'}
            </AppText>
            {isPro && <Badge label="PRO" variant="pro" />}
          </View>

          {seller?.shop_description ? (
            <AppText variant="caption" color={colors.text.muted} style={styles.description}>
              {seller.shop_description}
            </AppText>
          ) : null}

          {/* Stats row */}
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
              <AppText variant="bodyStrong">{rating.toFixed(1)}</AppText>
              <AppText variant="caption" color={colors.text.muted}>note</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.status.infoLight }]}>
                <ShieldCheck size={14} color={colors.status.infoDark} />
              </View>
              <AppText variant="bodyStrong">{reviewCount}</AppText>
              <AppText variant="caption" color={colors.text.muted}>avis</AppText>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={themeColor} />
            <AppText variant="caption" color={colors.text.muted}>
              {seller?.district || 'Daloa'}
            </AppText>
            <View style={styles.starsMargin}><RatingStars rating={rating} totalReviews={reviewCount} size={12} /></View>
          </View>

          {/* CTA */}
          <View style={styles.ctaRow}>
            <Button
              title="WhatsApp"
              variant="whatsapp"
              size="md"
              leftIcon={<MessageCircle size={16} color={colors.text.inverse} />}
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

        {/* ── Catalogue ── */}
        <View style={styles.catalogHeader}>
          <AppText variant="subtitle">
            Catalogue ({listings.length})
          </AppText>
          {listings.length > 0 && (
            <AppText variant="caption" color={colors.text.subtle}>
              Articles disponibles maintenant
            </AppText>
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
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}` as any)}
                />
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
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  scroll: {
    paddingBottom: 0,
  },
  // ── Bannière ──
  bannerWrap: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.bg.subtle,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bannerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  // ── Identité ──
  identityCard: {
    marginHorizontal: spacing[4],
    marginTop: -40,
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    paddingTop: spacing[5],
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarFloat: {
    position: 'absolute',
    top: -36,
    left: spacing[4],
    borderWidth: 3,
    borderColor: colors.bg.surface,
    borderRadius: radii.full,
    backgroundColor: colors.bg.surface,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: 40,
  },
  flex1: { flex: 1 },
  description: {
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.xl,
    padding: spacing[3],
    marginTop: spacing[1],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.subtle,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsMargin: {
    marginLeft: spacing[2],
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  // ── Catalogue ──
  catalogHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  gridItem: {
    width: '48%',
  },
});
