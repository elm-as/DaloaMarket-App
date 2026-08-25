import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, useListings } from '@daloa/api';
import { SellerInfo } from '@daloa/types';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Avatar,
  RatingStars,
  Badge,
  Button,
  EmptyState,
} from '@daloa/ui';
import { MessageCircle, Share2, MapPin, Store, CheckCircle } from 'lucide-react-native';
import { ListingCard } from '../../src/components/ListingCard';
import { formatWhatsAppPhone, Haptics } from '@daloa/utils';

export default function SellerShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: listingsData } = useListings({ sellerId: id });
  const listings = listingsData?.data || [];

  useEffect(() => {
    async function fetchSeller() {
      if (!id) return;
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        if (data) setSeller(data as any);
      } finally {
        setLoading(false);
      }
    }
    fetchSeller();
  }, [id]);

  const isPro = Boolean(seller?.pro_until && new Date(seller.pro_until) > new Date());

  const handleShareShop = async () => {
    Haptics.success();
    const shopName = seller?.shop_name || seller?.full_name || 'Boutique DaloaMarket';
    const slug = seller?.shop_slug || id?.slice(0, 8) || '';
    const shareUrl = `https://daloamarket.com/shop/${slug}`;
    await Share.share({
      message: `🛍️ Découvrez la boutique *${shopName}* sur DaloaMarket !\n👉 ${shareUrl}\n📦 ${listings.length} articles disponibles à Daloa.`,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={seller?.shop_name || seller?.full_name || 'Vitrine Boutique'}
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity onPress={handleShareShop} style={styles.shareBtn}>
            <Share2 size={18} color={colors.dark.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Boutique */}
        <View style={styles.bannerContainer}>
          <Image
            source={{
              uri:
                seller?.shop_banner_url ||
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
            }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Profile Card Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={seller?.shop_logo_url || seller?.avatar_url}
              name={seller?.shop_name || seller?.full_name}
              size={72}
              isPro={isPro}
            />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.shopName} numberOfLines={1}>
              {seller?.shop_name || seller?.full_name || 'Boutique'}
            </Text>
            {isPro && <Badge label="PRO" variant="pro" />}
          </View>

          {seller?.shop_description && (
            <Text style={styles.shopDescription}>{seller.shop_description}</Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.locationTag}>
              <MapPin size={12} color={colors.market.primary} />
              <Text style={styles.locationText}>{seller?.district || 'Daloa'}</Text>
            </View>
            <RatingStars rating={seller?.rating || 5.0} totalReviews={seller?.review_count || listings.length} size={13} />
          </View>

          <View style={styles.ctaRow}>
            <Button
              title="Écrire sur WhatsApp"
              variant="success"
              size="md"
              leftIcon={<MessageCircle size={18} color="#FFFFFF" />}
              onPress={handleWhatsApp}
              style={{ flex: 1 }}
            />
            <Button
              title="Partager"
              variant="secondary"
              size="md"
              leftIcon={<Share2 size={16} color={colors.dark.text} />}
              onPress={handleShareShop}
            />
          </View>
        </View>

        {/* Catalogue des Articles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Articles en vente ({listings.length})</Text>
        </View>

        {listings.length === 0 ? (
          <EmptyState
            icon={<Store size={32} color={colors.market.primary} />}
            title="Aucun article disponible"
            description="Ce vendeur n'a pas encore publié d'article."
          />
        ) : (
          <View style={styles.productsGrid}>
            {listings.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.dark.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.dark.surfaceRaised,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  headerCard: {
    marginTop: -36,
    marginHorizontal: spacing[4],
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing[4],
    alignItems: 'center',
  },
  avatarWrapper: {
    marginTop: -40,
    marginBottom: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 4,
  },
  shopName: {
    color: colors.dark.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  shopDescription: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing[2],
    width: '100%',
    marginTop: spacing[3],
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
  },
});
