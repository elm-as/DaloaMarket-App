import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Sparkles, MapPin, Phone, Star } from 'lucide-react-native';
import { colors, spacing, Avatar, AppText, AppPressable, useAccent } from '@daloa/ui';

interface ProfileHeroProps {
  displayName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  district?: string | null;
  rating?: number | null;
  isPro?: boolean;
  onOpenSettings: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  displayName,
  avatarUrl,
  phone,
  district,
  rating,
  isPro = false,
  onOpenSettings,
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
        <View>
          <View style={styles.hubBadge}>
            <AppText variant="overline" color={colors.text.inverse}>
              ESPACE MARCHAND
            </AppText>
          </View>
          <AppText variant="h2" color={colors.text.inverse} style={styles.pageTitle}>
            Mon Profil
          </AppText>
        </View>

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
        <View style={styles.avatarWrap}>
          <Avatar
            name={displayName}
            uri={avatarUrl || undefined}
            size={68}
            isPro={isPro}
          />
          {isPro && (
            <View style={styles.proSparkleBadge}>
              <Sparkles size={11} color={colors.text.inverse} />
            </View>
          )}
        </View>

        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <AppText variant="title" color={colors.text.inverse} numberOfLines={1} style={styles.nameText}>
              {displayName}
            </AppText>
            {isPro && (
              <View style={styles.proTag}>
                <AppText variant="overline" color={colors.text.inverse}>
                  PRO
                </AppText>
              </View>
            )}
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  hubBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  pageTitle: {
    fontWeight: '900',
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
    fontWeight: '800',
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
  proSparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EA580C',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    fontWeight: '900',
    flexShrink: 1,
  },
  proTag: {
    backgroundColor: '#F97316',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontWeight: '800',
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
