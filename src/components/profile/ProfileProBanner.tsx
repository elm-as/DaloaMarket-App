import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable, useAccent } from '@daloa/ui';
import { usePhase } from '../../context/PhaseContext';

interface ProfileProBannerProps {
  isPro: boolean;
  onBecomePro: () => void;
}

export const ProfileProBanner: React.FC<ProfileProBannerProps> = ({
  isPro,
  onBecomePro,
}) => {
  const accent = useAccent();
  const { isPhase0, enableSellerBadge } = usePhase();

  // Si l'utilisateur est déjà Pro, ou si la marketplace est en Phase 0, ou si le badge est désactivé : masquer
  if (isPro || isPhase0 || !enableSellerBadge) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header avec badge doré */}
        <View style={styles.topRow}>
          <View style={styles.goldBadge}>
            <Sparkles size={12} color="#F59E0B" />
            <AppText variant="overline" color="#F59E0B" style={styles.goldBadgeText}>
              PASS VENDEUR PRO
            </AppText>
          </View>
          <View style={styles.secureTag}>
            <ShieldCheck size={12} color="#94A3B8" />
            <AppText variant="caption" color="#94A3B8" style={styles.secureText}>
              DaloaMarket Pro
            </AppText>
          </View>
        </View>

        {/* Titre & Description */}
        <AppText variant="title" color={colors.text.inverse} style={styles.title}>
          Multipliez vos ventes avec le Pass Pro
        </AppText>
        <AppText variant="caption" color="#CBD5E1" style={styles.desc}>
          Débloquez le paiement Cash à la livraison (COD), vos livreurs affiliés et votre vitrine personnalisée.
        </AppText>

        {/* Bouton CTA */}
        <AppPressable
          onPress={onBecomePro}
          style={styles.ctaBtn}
          accessibilityLabel="Activer le Pass Vendeur Pro"
        >
          <AppText variant="bodyStrong" color={colors.text.inverse} style={styles.ctaText}>
            Activer le Pass Pro
          </AppText>
          <ArrowRight size={15} color={colors.text.inverse} />
        </AppPressable>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  card: {
    padding: spacing[4],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goldBadgeText: {
    fontWeight: '800',
    fontSize: 10,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontWeight: '900',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  desc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing[3],
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    paddingVertical: 9,
    borderRadius: radii.lg,
  },
  ctaText: {
    fontWeight: '800',
    fontSize: 12,
  },
});
