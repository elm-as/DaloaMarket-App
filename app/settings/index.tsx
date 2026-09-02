import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, Avatar, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  Store,
  CreditCard,
  Shield,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Settings,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user, profile } = useAuth();

  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());
  const displayName = profile?.full_name || user?.email || 'Mon compte';
  const subtitle = profile?.phone || user?.email || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero banner */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroRow}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Configuration
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Paramètres
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <Settings size={18} color={accent[200]} />
          </View>
        </View>

        {/* Profile card inline in hero */}
        <View style={styles.profileCard}>
          <Avatar
            name={displayName}
            uri={profile?.avatar_url || undefined}
            size={52}
            isPro={isPro}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <AppText variant="bodyStrong" color={colors.text.body} numberOfLines={1} style={styles.profileName}>
                {displayName}
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
            {subtitle ? (
              <AppText variant="caption" color={colors.text.muted} numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
            {profile?.district ? (
              <AppText variant="caption" color={accent[600]} numberOfLines={1}>
                📍 {profile.district}
              </AppText>
            ) : null}
          </View>
          <ChevronRight size={16} color={colors.grey[400]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section boutique */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
          Ma boutique
        </AppText>
        <View style={styles.card}>
          <SettingRow
            icon={<Store size={18} color={accent.DEFAULT} />}
            iconBg={accent[50]}
            title="Paramètres de ma boutique"
            onPress={() => router.push('/settings/shop' as any)}
          />
          <SettingRow
            icon={<CreditCard size={18} color={colors.status.successDark} />}
            iconBg={colors.status.successLight}
            title="Compte de retrait Mobile Money"
            onPress={() => router.push('/settings/payout' as any)}
            isLast
          />
        </View>

        {/* Section sécurité */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
          Sécurité
        </AppText>
        <View style={styles.card}>
          <SettingRow
            icon={<Shield size={18} color={colors.status.infoDark} />}
            iconBg={colors.status.infoLight}
            title="Sécurité & confidentialité"
            onPress={() => router.push('/legal/privacy' as any)}
            isLast
          />
        </View>

        {/* Zone danger */}
        <AppText variant="overline" color={colors.status.error} style={styles.sectionLabel}>
          Zone de danger
        </AppText>
        <View style={styles.dangerCard}>
          <SettingRow
            icon={<Trash2 size={18} color={colors.status.error} />}
            iconBg={colors.status.errorLight}
            title="Supprimer mon compte"
            danger
            onPress={() => router.push('/settings/delete-account' as any)}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  iconBg,
  title,
  onPress,
  isLast = false,
  danger = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  onPress: () => void;
  isLast?: boolean;
  danger?: boolean;
}) {
  return (
    <AppPressable onPress={onPress} style={[styles.row, !isLast && styles.rowBorder]} accessibilityLabel={title}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <AppText variant="bodyStrong" color={danger ? colors.status.error : colors.text.body} style={styles.rowTitle}>
        {title}
      </AppText>
      <ChevronRight size={18} color={colors.text.subtle} />
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  heroBanner: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    marginTop: spacing[3],
    gap: spacing[3],
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
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
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionLabel: {
    marginBottom: spacing[2],
    marginTop: spacing[2],
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  dangerCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
  },
});
