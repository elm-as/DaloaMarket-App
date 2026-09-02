import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';

export const HomeDeliveryBanner: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();

  return (
    <View style={styles.container}>
      <AppPressable
        onPress={() => router.push('/affiliations' as any)}
        style={[styles.banner, { backgroundColor: accent[50], borderColor: accent[100] }]}
        accessibilityLabel="Découvrir DaloaDelivery"
      >
        <View style={styles.leftBox}>
          <View style={styles.iconCircle}>
            <Bike size={18} color={accent.DEFAULT} />
          </View>
          <AppText variant="body" color={colors.text.body}>
            Besoin d'un coursier ?{' '}
            <AppText variant="bodyStrong" color={accent[700]}>
              DaloaDelivery
            </AppText>
          </AppText>
        </View>
        <ChevronRight size={18} color={accent.DEFAULT} />
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
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
