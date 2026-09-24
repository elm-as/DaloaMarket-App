import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, MapPin, Phone, Star, Camera } from 'lucide-react-native';
import { colors, spacing, Avatar, AppText, AppPressable, ProBadge, useAccent, typography } from '@daloa/ui';

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
  /** Chiffres affichés dans le bandeau, en tuiles translucides. */
  stats?: { label: string; value: number; onPress?: () => void }[];
}

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
  stats = [],
}) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  return (
    <LinearGradient
      colors={[accent[500], accent[600], accent[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
    >
      {/* Barre supérieure : Titre et bouton Paramètres */}
      <View style={styles.topBar}>
        <AppText variant="h2" color={colors.text.inverse} style={styles.pageTitle}>
          Mon Profil
        </AppText>

        <AppPressable
          onPress={onOpenSettings}
          style={styles.settingsBtn}
          accessibilityLabel="Paramètres"
        >
          <Settings size={17} color={colors.text.inverse} />
          <AppText variant="caption" color={colors.text.inverse} style={styles.settingsBtnText}>
            Paramètres
          </AppText>
        </AppPressable>
      </View>

      {/* Carte d'identité commerçant */}
      <View style={styles.identityRow}>
        <AppPressable
          onPress={onEditAvatar}
          disabled={!onEditAvatar || isUploadingAvatar}
          style={styles.avatarWrap}
          accessibilityLabel="Changer ma photo de profil"
          accessibilityRole="button"
        >
          <Avatar
            name={displayName}
            uri={avatarUrl || undefined}
            size={68}
            isPro={isPro}
          />
          {isUploadingAvatar ? (
            <View style={styles.avatarLoadingOverlay}>
              <ActivityIndicator size="small" color={colors.text.inverse} />
            </View>
          ) : onEditAvatar ? (
            <View style={styles.cameraBadge}>
              <Camera size={12} color={colors.text.inverse} />
            </View>
          ) : null}
        </AppPressable>

        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <AppText variant="title" color={colors.text.inverse} numberOfLines={1} style={styles.nameText}>
              {displayName}
            </AppText>
            {isPro && <ProBadge size="sm" />}
          </View>

          {/* Note client */}
          {rating != null && rating > 0 && (
            <View style={styles.ratingRow}>
              <Star size={13} color="#FBBF24" fill="#FBBF24" />
              <AppText variant="caption" color={colors.text.inverse} style={styles.ratingText}>
                {rating.toFixed(1)} / 5.0
              </AppText>
            </View>
          )}

          {/* Coordonnées & Ville */}
          <View style={styles.metaRow}>
            {phone ? (
              <View style={styles.metaChip}>
                <Phone size={11} color={accent[100]} />
                <AppText variant="caption" color={accent[100]} numberOfLines={1}>
                  {phone}
                </AppText>
              </View>
            ) : null}

            <View style={styles.metaChip}>
              <MapPin size={11} color={accent[100]} />
              <AppText variant="caption" color={accent[100]}>
                {district || 'Daloa'}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      {stats.length > 0 && (
        <View style={styles.statsRow}>
          {stats.map((st) => (
            <AppPressable
              key={st.label}
              haptic="selection"
              onPress={st.onPress}
              disabled={!st.onPress}
              style={styles.statTile}
              accessibilityLabel={`${st.value} ${st.label}`}
            >
              <AppText variant="h2" color={colors.text.inverse} style={styles.statValue}>
                {st.value}
              </AppText>
              <AppText variant="caption" color={accent[50]}>
                {st.label}
              </AppText>
            </AppPressable>
          ))}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontVariant: ['tabular-nums'],
  },
  hero: {
    paddingHorizontal: spacing[4],
    // Place pour la carte de raccourcis qui déborde sur le bandeau.
    paddingBottom: spacing[12],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  pageTitle: {
    fontFamily: typography.families.black,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: spacing[3],
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  settingsBtnText: {
    fontFamily: typography.families.extrabold,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarWrap: {
    position: 'relative',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 40,
    padding: 2,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontFamily: typography.families.black,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontFamily: typography.families.extrabold,
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});
