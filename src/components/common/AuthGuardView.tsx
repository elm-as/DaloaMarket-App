import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, AppText, AppPressable, Button, useAccent } from '@daloa/ui';
import { Lock, ArrowLeft, LogIn, UserPlus, Home } from 'lucide-react-native';
import { safeBack } from '../../utils/navigation';

interface AuthGuardViewProps {
  title?: string;
  description?: string;
  fallbackRoute?: string;
}

export const AuthGuardView: React.FC<AuthGuardViewProps> = ({
  title = 'Connexion requise',
  description = 'Connectez-vous à votre compte DaloaMarket pour accéder à cet espace.',
  fallbackRoute = '/(tabs)',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* Header dégradé */}
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
          <AppText variant="title" color={colors.text.inverse}>
            Espace Sécurisé
          </AppText>
        </View>
      </LinearGradient>

      {/* Carte d'accès */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: accent[50] }]}>
            <Lock size={28} color={accent.DEFAULT} />
          </View>

          <AppText variant="h2" center>
            {title}
          </AppText>

          <AppText variant="body" color={colors.text.muted} center style={styles.desc}>
            {description}
          </AppText>

          <View style={styles.btnGroup}>
            <Button
              title="Se connecter"
              variant="market"
              size="lg"
              leftIcon={<LogIn size={16} color={colors.text.inverse} />}
              onPress={() => router.push('/auth/login' as any)}
              fullWidth
            />

            <Button
              title="Créer un compte"
              variant="soft"
              size="lg"
              leftIcon={<UserPlus size={16} color={accent[700]} />}
              onPress={() => router.push('/auth/register' as any)}
              fullWidth
            />

            <AppPressable
              onPress={() => router.replace('/(tabs)' as any)}
              style={styles.homeLink}
            >
              <Home size={14} color={colors.text.subtle} />
              <AppText variant="caption" color={colors.text.subtle}>
                Retourner à l'accueil
              </AppText>
            </AppPressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
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
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    marginRight: 36,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'center',
    marginTop: -24,
  },
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  desc: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
    lineHeight: 20,
  },
  btnGroup: {
    width: '100%',
    gap: spacing[3],
    alignItems: 'center',
  },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
    padding: spacing[2],
  },
});

export default AuthGuardView;
