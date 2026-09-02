import React from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, AppText, Button, useAccent } from '@daloa/ui';
import { ShieldCheck, Truck, Store, LogIn, UserPlus } from 'lucide-react-native';

export const ProfileGuestView: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  const features = [
    {
      icon: <ShieldCheck size={18} color={colors.status.successDark} />,
      tint: colors.status.successLight,
      title: 'Paiement séquestre garanti',
      desc: "Votre argent est protégé jusqu'à la remise du code OTP.",
    },
    {
      icon: <Truck size={18} color={colors.status.infoDark} />,
      tint: colors.status.infoLight,
      title: 'Livraison express géolocalisée',
      desc: 'Coursiers DaloaDelivery disponibles dans tous les quartiers.',
    },
    {
      icon: <Store size={18} color={accent[600]} />,
      tint: accent[50],
      title: 'Votre boutique gratuite',
      desc: 'Partagez facilement votre catalogue sur WhatsApp.',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
    >
      {/* Header dégradé */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.curvedHeader}
      >
        <View style={styles.logoBadge}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
        </View>
        <AppText variant="h1" color={colors.text.inverse}>
          DaloaMarket
        </AppText>
        <AppText variant="body" color={accent[100]}>
          La marketplace locale de Daloa
        </AppText>
      </LinearGradient>

      {/* Carte d'accueil */}
      <View style={styles.mainCard}>
        <AppText variant="h2">Bienvenue !</AppText>
        <AppText variant="body" color={colors.text.muted} style={styles.cardDesc}>
          Connectez-vous pour publier des annonces, gérer votre boutique, suivre vos commandes et
          discuter avec les commerçants.
        </AppText>

        <Button
          title="Se connecter à mon compte"
          variant="market"
          size="lg"
          onPress={() => router.push('/auth/login' as any)}
          fullWidth
          leftIcon={<LogIn size={16} color={colors.text.inverse} />}
          style={styles.loginBtn}
        />
        <Button
          title="Créer un compte gratuit"
          variant="soft"
          size="lg"
          onPress={() => router.push('/auth/register' as any)}
          fullWidth
          leftIcon={<UserPlus size={16} color={accent[700]} />}
        />

        {/* Avantages */}
        <View style={styles.featuresList}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: f.tint }]}>{f.icon}</View>
              <View style={styles.featureTexts}>
                <AppText variant="bodyStrong">{f.title}</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  {f.desc}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  curvedHeader: {
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  logoImg: {
    width: 40,
    height: 40,
  },
  mainCard: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginTop: -28,
    borderRadius: radii['2xl'],
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardDesc: {
    marginTop: 4,
    marginBottom: spacing[4],
  },
  loginBtn: {
    marginBottom: spacing[2],
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing[3],
    marginTop: spacing[4],
    gap: spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTexts: {
    flex: 1,
  },
});
