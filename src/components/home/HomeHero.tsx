import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, Plus, ShieldCheck, MapPin } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';

export const HomeHero: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* Hero card dégradé */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.sparkleBadge}>
          <Sparkles size={12} color={accent[100]} />
          <AppText variant="overline" color={colors.text.inverse}>
            Marketplace & Livraison · Daloa
          </AppText>
        </View>

        <AppText variant="h1" color={colors.text.inverse} style={styles.heroTitle}>
          Tout Daloa,{'\n'}
          <AppText variant="h1" color={accent[100]}>
            au même endroit.
          </AppText>
        </AppText>

        <AppText variant="body" color={accent[50]} style={styles.heroSubtitle}>
          Achetez et vendez en toute confiance. Paiement séquestre garanti et livraison rapide.
        </AppText>

        {/* Actions */}
        <View style={styles.buttonsRow}>
          <AppPressable onPress={() => router.push('/listing/create' as any)} style={styles.primaryBtn}>
            <Plus size={15} color={accent[600]} strokeWidth={3} />
            <AppText variant="label" color={accent[600]} numberOfLines={1}>
              Publier
            </AppText>
          </AppPressable>

          <AppPressable onPress={() => router.push('/legal/how-it-works' as any)} style={styles.secondaryBtn}>
            <AppText variant="label" color={colors.text.inverse} numberOfLines={1}>
              Comment ça marche ?
            </AppText>
          </AppPressable>
        </View>
      </LinearGradient>

      {/* Trust strip */}
      <View style={styles.trustStrip}>
        <TrustItem tint={colors.status.successLight} icon={<ShieldCheck size={14} color={colors.status.successDark} />} title="Séquestre" sub="Sécurisé" />
        <View style={styles.trustDivider} />
        <TrustItem tint={accent[50]} icon={<MapPin size={14} color={accent.DEFAULT} />} title="Daloa" sub="Certifiés" />
        <View style={styles.trustDivider} />
        <TrustItem tint={colors.status.infoLight} icon={<Sparkles size={14} color={colors.status.infoDark} />} title="0 Frais" sub="Sans frais" />
      </View>
    </View>
  );
};

function TrustItem({ tint, icon, title, sub }: { tint: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <View style={styles.trustItem}>
      <View style={[styles.trustIconCircle, { backgroundColor: tint }]}>{icon}</View>
      <View style={styles.trustTexts}>
        <AppText variant="caption" color={colors.text.DEFAULT} numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="overline" color={colors.text.muted} numberOfLines={1}>
          {sub}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
  },
  heroCard: {
    borderRadius: radii['2xl'],
    padding: spacing[4],
    gap: spacing[2],
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 5,
  },
  heroTitle: {
    marginTop: 2,
  },
  heroSubtitle: {
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    height: 44,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[2],
    gap: spacing[2],
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchFlex: {
    flex: 1,
  },
  explorerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.md,
    gap: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    height: 40,
    borderRadius: radii.xl,
    gap: 5,
    overflow: 'hidden',
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: 40,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[2],
    overflow: 'hidden',
  },
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  trustItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustTexts: {
    flexShrink: 1,
  },
  trustIconCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.subtle,
  },
});
