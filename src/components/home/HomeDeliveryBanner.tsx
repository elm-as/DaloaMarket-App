import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';

export const HomeDeliveryBanner: React.FC = () => {
  const accent = useAccent();
  const router = useRouter();

  const handleExpressPress = () => {
    router.push('/express' as any);
  };

  return (
    <View style={styles.container}>
      <AppPressable
        haptic="medium"
        onPress={handleExpressPress}
        style={[styles.banner, { backgroundColor: accent[50], borderColor: accent[200] }]}
        accessibilityRole="button"
        accessibilityLabel="Commander un coursier express à Daloa dès 500 FCFA"
      >
        {/* Icône expressive */}
        <View style={[styles.iconCircle, { backgroundColor: accent[500] }]}>
          <Zap size={18} color={colors.text.inverse} />
        </View>

        {/* Textes descriptifs réactifs sans débordement */}
        <View style={styles.contentBox}>
          <View style={styles.badgeRow}>
            <View style={[styles.pillBadge, { backgroundColor: accent[100] }]}>
              <AppText variant="overline" color={accent[900]} style={styles.badgeText}>
                EXPRESS · 30 MIN
              </AppText>
            </View>
            <View style={styles.securityTag}>
              <ShieldCheck size={11} color={colors.status.successDark} />
              <AppText variant="caption" color={colors.status.successDark} style={styles.securityLabel}>
                Code OTP
              </AppText>
            </View>
          </View>

          <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.title} numberOfLines={1}>
            Coursier Express Hors-Market
          </AppText>

          <AppText variant="caption" color={colors.text.muted} style={styles.subtitle} numberOfLines={1}>
            Envoi immédiat de colis, plis & repas entre quartiers
          </AppText>
        </View>

        {/* Bouton d'action avec tarif d'appel */}
        <View style={styles.actionBox}>
          <View style={[styles.priceTag, { backgroundColor: accent[100] }]}>
            <AppText variant="caption" color={accent[900]} style={styles.priceTagText}>
              Dès 500 F
            </AppText>
          </View>
          <View style={[styles.arrowCircle, { backgroundColor: accent[500] }]}>
            <ArrowRight size={14} color={colors.text.inverse} />
          </View>
        </View>
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[3],
    marginVertical: spacing[2],
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1.5,
    borderRadius: radii.xl,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBox: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontFamily: typography.families.bold,
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  securityLabel: {
    fontSize: 10,
    fontFamily: typography.families.semibold,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  actionBox: {
    alignItems: 'center',
    gap: 4,
  },
  priceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  priceTagText: {
    fontSize: 10,
    fontFamily: typography.families.bold,
    fontVariant: ['tabular-nums'],
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
