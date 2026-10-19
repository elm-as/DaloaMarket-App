import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, ChevronRight, Users } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { openDeliveryApp } from '../../lib/openDeliveryApp';

export const HomeDeliveryBanner: React.FC = () => {
  const accent = useAccent();
  const router = useRouter();

  const handleExpressPress = () => {
    router.push('/express' as any);
  };

  const handleDirectoryPress = () => {
    openDeliveryApp('annuaire');
  };

  return (
    <View style={styles.container}>
      <AppPressable
        onPress={handleExpressPress}
        style={[styles.banner, { backgroundColor: accent[50], borderColor: accent[100] }]}
        accessibilityLabel="Commander un coursier express à Daloa"
      >
        <View style={styles.leftBox}>
          <View style={[styles.iconCircle, { backgroundColor: accent.DEFAULT }]}>
            <Zap size={16} color={colors.text.inverse} />
          </View>
          <View>
            <AppText variant="bodyStrong" color={colors.text.body}>
              Coursier Express Hors-Market
            </AppText>
            <AppText variant="caption" color={colors.text.muted}>
              Envoyer un colis, pli ou repas dans Daloa (dès 500 F)
            </AppText>
          </View>
        </View>
        <View style={styles.rightActions}>
          <AppPressable
            haptic="light"
            onPress={handleDirectoryPress}
            style={styles.directoryBtn}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'annuaire des livreurs"
          >
            <Users size={14} color={accent[700]} />
          </AppPressable>
          <ChevronRight size={18} color={accent.DEFAULT} />
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
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    overflow: 'hidden',
  },
  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  directoryBtn: {
    padding: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bg.surface,
  },
});
