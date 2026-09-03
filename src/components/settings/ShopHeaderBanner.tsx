import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Store, Lock, Sparkles } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';

interface ShopHeaderBannerProps {
  bannerUrl: string | null;
  logoUrl: string | null;
  shopName: string;
  themeColor: string;
  uploadingBanner: boolean;
  uploadingLogo: boolean;
  onPickBanner: () => void;
  onPickLogo: () => void;
  isLocked?: boolean;
}

export const ShopHeaderBanner: React.FC<ShopHeaderBannerProps> = ({
  bannerUrl,
  logoUrl,
  shopName,
  themeColor,
  uploadingBanner,
  uploadingLogo,
  onPickBanner,
  onPickLogo,
  isLocked = false,
}) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* 1. Bannière de couverture — Design premium sans placeholder factice */}
      <AppPressable
        haptic="light"
        onPress={onPickBanner}
        disabled={uploadingBanner}
        style={styles.bannerContainer}
        accessibilityLabel={bannerUrl ? 'Changer la bannière' : 'Importer une bannière'}
      >
        {bannerUrl ? (
          <>
            <Image
              source={{ uri: bannerUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.bannerDarkGradient} />
            <View style={[styles.bannerEditBadge, isLocked && { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              {uploadingBanner ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isLocked ? (
                <Lock size={12} color="#FBBF24" />
              ) : (
                <Camera size={13} color="#fff" />
              )}
              <AppText variant="caption" color={isLocked ? '#FBBF24' : '#fff'} style={styles.btnLabel}>
                {isLocked ? 'Bannière PRO' : 'Changer la bannière'}
              </AppText>
            </View>
          </>
        ) : (
          <LinearGradient
            colors={[themeColor || accent[600], '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            {/* Cercles décoratifs d'ambiance en arrière-plan */}
            <View style={[styles.ambientCircle, { borderColor: 'rgba(255,255,255,0.08)' }]} />
            <View style={[styles.ambientCircleSmall, { borderColor: 'rgba(255,255,255,0.06)' }]} />

            {uploadingBanner ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#fff" />
                <AppText variant="caption" color="#fff" style={styles.btnLabel}>
                  Téléversement de votre bannière…
                </AppText>
              </View>
            ) : (
              <View style={styles.importBannerGlassCard}>
                <View style={styles.importIconCircle}>
                  {isLocked ? <Lock size={15} color="#FBBF24" /> : <Camera size={16} color="#fff" />}
                </View>
                <View style={styles.importTextWrap}>
                  <AppText variant="label" color="#fff" style={styles.importTitle}>
                    {isLocked ? 'Photo de couverture réservée aux PRO' : 'Ajouter une photo de couverture'}
                  </AppText>
                  <AppText variant="caption" color="rgba(255,255,255,0.8)" style={styles.importSub}>
                    {isLocked ? 'Pass Vendeur Pro requis' : 'Format 16:9 · Cliquez pour importer'}
                  </AppText>
                </View>
              </View>
            )}
          </LinearGradient>
        )}
      </AppPressable>

      {/* 2. Logo de la boutique superposé au centre */}
      <View style={styles.logoRow}>
        <AppPressable
          haptic="selection"
          onPress={onPickLogo}
          disabled={uploadingLogo}
          style={[styles.logoWrapper, { borderColor: colors.bg.surface }]}
          accessibilityLabel={logoUrl ? 'Changer le logo de la boutique' : 'Ajouter le logo'}
        >
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={[accent[50], '#FFF']}
              style={styles.logoPlaceholder}
            >
              <Store size={36} color={themeColor || accent[600]} />
            </LinearGradient>
          )}

          {/* Badge caméra ou cadenas sur le logo */}
          <View style={[styles.cameraBadge, { backgroundColor: isLocked ? '#B45309' : (themeColor || accent[600]) }]}>
            {uploadingLogo ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isLocked ? (
              <Lock size={12} color="#fff" />
            ) : (
              <Camera size={13} color="#fff" />
            )}
          </View>
        </AppPressable>

        {/* Bouton texte cliquable sous le logo */}
        <AppPressable
          haptic="light"
          onPress={onPickLogo}
          disabled={uploadingLogo}
          style={styles.logoTextBtn}
        >
          <AppText variant="caption" color={isLocked ? colors.status.warningDark : accent[600]} style={styles.logoTextLabel}>
            {isLocked ? 'Logo PRO' : logoUrl ? 'Changer le logo' : '+ Ajouter le logo'}
          </AppText>
        </AppPressable>

        {/* Nom & titre de la boutique */}
        <AppText variant="title" center numberOfLines={1} style={styles.shopTitle}>
          {shopName || 'Ma Boutique'}
        </AppText>
        <AppText variant="caption" color={colors.text.subtle} center>
          Personnalisez la vitrine de votre boutique à Daloa
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing[4],
  },
  bannerContainer: {
    height: 165,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  bannerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 28,
  },
  ambientCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    top: -40,
    left: -40,
  },
  ambientCircleSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    bottom: -30,
    right: -20,
  },
  bannerDarkGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bannerEditBadge: {
    position: 'absolute',
    right: spacing[3],
    bottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  importBannerGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  importIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importTextWrap: {
    gap: 1,
  },
  importTitle: {
    fontWeight: '800',
    fontSize: 12.5,
  },
  importSub: {
    fontSize: 10,
  },
  btnLabel: {
    fontWeight: '700',
  },
  logoRow: {
    alignItems: 'center',
    marginTop: -44,
    paddingHorizontal: spacing[4],
  },
  logoWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextBtn: {
    marginTop: spacing[2],
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  logoTextLabel: {
    fontWeight: '700',
  },
  shopTitle: {
    marginTop: 2,
  },
});
