import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';

interface CartNotificationBannerProps {
  visible: boolean;
  onClose: () => void;
  onViewCart: () => void;
}

export const CartNotificationBanner: React.FC<CartNotificationBannerProps> = ({
  visible,
  onClose,
  onViewCart,
}) => {
  const accent = useAccent();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.bannerContainer} pointerEvents="box-none">
      <View style={[styles.banner, { borderColor: accent[200] }]}>
        <View style={styles.content}>
          <CheckCircle2 size={18} color={accent[700]} />
          <AppText variant="bodyStrong" color={colors.text.body} numberOfLines={1}>
            Article ajouté au panier
          </AppText>
        </View>
        <AppPressable
          haptic="light"
          onPress={onViewCart}
          style={[styles.actionBtn, { backgroundColor: accent.DEFAULT }]}
          accessibilityRole="button"
          accessibilityLabel="Voir mon panier"
        >
          <AppText variant="caption" color={colors.text.inverse} style={styles.actionText}>
            Voir mon panier
          </AppText>
          <ArrowRight size={13} color={colors.text.inverse} strokeWidth={2.5} />
        </AppPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: { paddingHorizontal: spacing[3], paddingBottom: spacing[2], backgroundColor: 'transparent' },
  banner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bg.surface, paddingVertical: spacing[2], paddingHorizontal: spacing[3],
    borderRadius: radii.xl, borderWidth: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, gap: spacing[2],
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: 7, borderRadius: radii.full, gap: 4 },
  actionText: { fontFamily: typography.families.bold },
});
