import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, MapPin, Phone, Star, Camera } from 'lucide-react-native';
import { colors, spacing, radii, Avatar, AppText, AppPressable, ProBadge } from '@daloa/ui';

interface ProfileHeroProps {
  displayName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  district?: string | null;
  rating?: number | null;
  isPro?: boolean;
  onOpenSettings: () => void;
  onEditAvatar?: () => void;
  isUploadingAvatar?: boolean;
}

/**
 * En-tête du profil : titre, accès aux paramètres et carte d'identité, sur
 * fond clair. L'ancien bandeau en dégradé orange (« ESPACE MARCHAND ») prenait
 * un tiers de l'écran pour ces mêmes informations.
 */
export const ProfileHero: React.FC<ProfileHeroProps> = ({
  displayName,
  avatarUrl,
  phone,
  district,
  rating,
  isPro = false,
  onOpenSettings,
  onEditAvatar,
  isUploadingAvatar = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[2] }]}>
      <View style={styles.topBar}>
        <AppText variant="h2">Mon profil</AppText>
        <AppPressable onPress={onOpenSettings} style={styles.settingsBtn} accessibilityLabel="Paramètres">
          <Settings size={16} color={colors.grey[700]} />
          <AppText variant="caption" color={colors.grey[700]}>
            Paramètres
          </AppText>
        </AppPressable>
      </View>

      <View style={styles.identityRow}>
        <AppPressable
          onPress={onEditAvatar}
          disabled={!onEditAvatar || isUploadingAvatar}
          style={styles.avatarWrap}
          accessibilityLabel="Changer ma photo de profil"
          accessibilityRole="button"
        >
          <Avatar name={displayName} uri={avatarUrl || undefined} size={60} isPro={isPro} />
          {isUploadingAvatar ? (
            <View style={styles.avatarLoadingOverlay}>
              <ActivityIndicator size="small" color={colors.text.inverse} />
            </View>
          ) : onEditAvatar ? (
            <View style={styles.cameraBadge}>
              <Camera size={11} color={colors.text.inverse} />
            </View>
          ) : null}
        </AppPressable>

        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <AppText variant="title" numberOfLines={1} style={styles.nameText}>
              {displayName}
            </AppText>
            {isPro && <ProBadge size="sm" />}
          </View>
          <View style={styles.metaRow}>
            {rating != null && rating > 0 && (
              <View style={styles.metaItem}>
                <Star size={12} color="#FBBF24" fill="#FBBF24" />
                <AppText variant="caption" color={colors.text.muted}>
                  {rating.toFixed(1)}
                </AppText>
              </View>
            )}
            {phone ? (
              <View style={styles.metaItem}>
                <Phone size={11} color={colors.text.subtle} />
                <AppText variant="caption" color={colors.text.muted} numberOfLines={1}>
                  {phone}
                </AppText>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <MapPin size={11} color={colors.text.subtle} />
              <AppText variant="caption" color={colors.text.muted}>
                {district || 'Daloa'}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  avatarWrap: { position: 'relative' },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.grey[800],
    borderWidth: 2,
    borderColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
