import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, AppText, AppPressable, Button, useAccent } from '@daloa/ui';
import { ArrowLeft } from 'lucide-react-native';
import { safeBack } from '../../utils/navigation';

interface RequirementGuardViewProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  fallbackRoute?: string;
}

export const RequirementGuardView: React.FC<RequirementGuardViewProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  fallbackRoute = '/(tabs)',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing[3] }]}
      >
        <AppPressable
          onPress={() => safeBack(router, fallbackRoute)}
          rippleBorderless
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={18} color={colors.text.inverse} />
        </AppPressable>
        <View style={styles.heroCenter}>
          <AppText variant="overline" color={accent[100]}>PRÉREQUIS VENDEUR</AppText>
          <AppText variant="title" color={colors.text.inverse}>Configuration Requise</AppText>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: accent[50] }]}>
            {icon}
          </View>

          <AppText variant="h2" center>
            {title}
          </AppText>

          <AppText variant="body" color={colors.text.muted} center style={styles.desc}>
            {description}
          </AppText>

          <View style={styles.btnGroup}>
            <Button
              title={actionLabel}
              variant="market"
              size="lg"
              onPress={onAction}
              fullWidth
            />

            <Button
              title="Plus tard"
              variant="ghost"
              size="md"
              onPress={() => safeBack(router, fallbackRoute)}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: { flex: 1, marginLeft: spacing[3] },
  content: { flex: 1, padding: spacing[4], justifyContent: 'center', marginTop: -20 },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  desc: { marginTop: spacing[2], marginBottom: spacing[6], lineHeight: 20 },
  btnGroup: { width: '100%', gap: spacing[2], alignItems: 'center' },
});

export default RequirementGuardView;
