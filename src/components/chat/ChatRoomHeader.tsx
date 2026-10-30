import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  colors,
  radii,
  spacing,
  Avatar,
  CurrencyText,
  AppText,
  AppPressable,
} from '@daloa/ui';

interface ChatRoomHeaderProps {
  partnerName: string;
  partnerAvatar?: string | null;
  listingId?: string | null;
  listingTitle?: string | null;
  listingPhoto?: string | null;
  listingPrice?: string | null;
  accent: Record<string | number, string> & { DEFAULT: string };
}

/**
 * En-tête de la salle de discussion avec avatar, nom du correspondant,
 * badge de prix et encart produit épinglé.
 */
export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  partnerName,
  partnerAvatar,
  listingId,
  listingTitle,
  listingPhoto,
  listingPrice,
  accent,
}) => {
  const router = useRouter();

  return (
    <>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chatHeader}
      >
        <AppPressable
          onPress={() => router.back()}
          rippleBorderless
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={18} color={colors.text.inverse} />
        </AppPressable>

        <View style={styles.headerCenter}>
          <Avatar uri={partnerAvatar || undefined} name={partnerName || 'Correspondant'} size={36} />
          <View style={styles.headerInfo}>
            <AppText variant="bodyStrong" color={colors.text.inverse} numberOfLines={1}>
              {partnerName || 'Discussion'}
            </AppText>
            {listingTitle ? (
              <AppText variant="caption" color={accent[100]} numberOfLines={1}>
                Re : {listingTitle}
              </AppText>
            ) : null}
          </View>
        </View>

        {listingId && listingPrice ? (
          <AppPressable
            onPress={() => router.push(`/listing/${listingId}` as any)}
            style={styles.priceChip}
            haptic="selection"
            accessibilityLabel="Voir l'annonce"
          >
            <CurrencyText
              amount={parseFloat(listingPrice)}
              size="sm"
              weight="bold"
              color="rgba(255,255,255,0.95)"
            />
          </AppPressable>
        ) : null}
      </LinearGradient>

      {/* Encart produit épinglé sous l'en-tête */}
      {listingTitle ? (
        <AppPressable
          haptic="none"
          onPress={() => listingId && router.push(`/listing/${listingId}` as any)}
          style={[styles.pinnedProduct, { backgroundColor: accent[50], borderBottomColor: accent[100] }]}
          accessibilityLabel="Voir l'annonce liée"
        >
          {listingPhoto ? (
            <Image
              source={{ uri: listingPhoto }}
              style={styles.productThumb}
              contentFit="cover"
              transition={150}
            />
          ) : null}
          <View style={styles.pinnedInfo}>
            <AppText variant="caption" color={colors.text.DEFAULT} numberOfLines={1}>
              {listingTitle}
            </AppText>
            {listingPrice ? (
              <CurrencyText
                amount={parseFloat(listingPrice)}
                size="sm"
                weight="bold"
                color={accent.DEFAULT}
              />
            ) : null}
          </View>
        </AppPressable>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: spacing[2],
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  priceChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: 5,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pinnedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    gap: spacing[3],
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
  },
  pinnedInfo: {
    flex: 1,
    gap: 2,
  },
});
