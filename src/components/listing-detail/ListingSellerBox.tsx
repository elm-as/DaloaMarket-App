import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, AppText, AppPressable, Button, colors, radii, spacing, useAccent } from '@daloa/ui';
import { MessageCircle, Store, Star, Sparkles } from 'lucide-react-native';
import { formatDate, formatWhatsAppPhone } from '@daloa/utils';

interface ListingSellerBoxProps {
  seller: any;
  isPro: boolean;
}

export const ListingSellerBox: React.FC<ListingSellerBoxProps> = ({ seller, isPro }) => {
  const router = useRouter();
  const accent = useAccent();

  const shopName = seller?.shop_name || seller?.full_name || 'Boutique Partenaire';
  const memberSince = seller?.created_at ? formatDate(seller.created_at) : null;
  const rating = seller?.rating ?? 5.0;
  const reviewCount = seller?.review_count ?? 0;

  const goToShop = () => seller?.id && router.push(`/seller/${seller.id}` as any);

  const handleMessage = () => {
    if (!seller?.id) return;
    router.push({
      pathname: `/chat/${seller.id}` as any,
      params: {
        partnerName: shopName,
        partnerAvatar: seller?.avatar_url || '',
      },
    } as any);
  };

  const handleWhatsApp = () => {
    const phone = formatWhatsAppPhone(seller?.phone);
    if (!phone) return;
    const text = encodeURIComponent(`Bonjour ${shopName}, je suis intéressé(e) par votre annonce sur DaloaMarket.`);
    Linking.openURL(`https://wa.me/${phone}?text=${text}`);
  };

  return (
    <View style={styles.card}>
      {/* Ligne vendeur → cliquable pour aller à la vitrine */}
      <AppPressable
        onPress={goToShop}
        style={styles.sellerRow}
        accessibilityRole="button"
        accessibilityLabel="Voir la boutique du vendeur"
      >
        <View style={styles.avatarWrap}>
          <Avatar
            uri={seller?.shop_logo_url || seller?.avatar_url}
            name={shopName}
            size={52}
            isPro={isPro}
          />
          {isPro && (
            <View style={styles.proDot}>
              <Star size={9} color="#78350F" fill="#78350F" />
            </View>
          )}
        </View>

        <View style={styles.sellerInfo}>
          <View style={styles.nameRow}>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.sellerName}>
              {shopName}
            </AppText>
            {isPro && (
              <View style={[styles.proBadge, { backgroundColor: accent.DEFAULT }]}>
                <Sparkles size={9} color={colors.text.inverse} />
                <AppText variant="overline" color={colors.text.inverse}>
                  PRO
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={11}
                color="#F59E0B"
                fill={s <= Math.round(rating) ? '#F59E0B' : 'transparent'}
              />
            ))}
            <AppText variant="caption" color={colors.text.body}>
              {rating.toFixed(1)}
            </AppText>
            <AppText variant="caption" color={colors.text.muted}>
              ({reviewCount > 0 ? `${reviewCount} avis` : 'Nouveau'})
            </AppText>
          </View>

          {memberSince && (
            <AppText variant="caption" color={colors.text.muted}>
              Membre depuis {memberSince}
            </AppText>
          )}
        </View>
      </AppPressable>

      {/* 3 CTAs : Message | WhatsApp | Vitrine */}
      <View style={styles.ctaRow}>
        <Button
          title="Message"
          variant="outline"
          size="sm"
          leftIcon={<MessageCircle size={14} color={colors.text.DEFAULT} />}
          onPress={handleMessage}
          style={styles.ctaFlex}
        />
        <Button
          title="WhatsApp"
          variant="whatsapp"
          size="sm"
          leftIcon={<MessageCircle size={14} color={colors.text.inverse} />}
          onPress={handleWhatsApp}
          style={styles.ctaFlex}
        />
        <Button
          title="Vitrine"
          variant="outline"
          size="sm"
          leftIcon={<Store size={14} color={accent[700]} />}
          onPress={goToShop}
          style={[styles.ctaFlex, { borderColor: accent[200] }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    gap: spacing[3],
    overflow: 'hidden',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  avatarWrap: {
    position: 'relative',
  },
  proDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: '#FCD34D',
    borderWidth: 2,
    borderColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    flexShrink: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radii.sm,
    gap: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  ctaFlex: {
    flex: 1,
  },
});
