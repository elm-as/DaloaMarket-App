import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, Button, AppText, useAccent } from '@daloa/ui';
import { Store, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

interface ShopProGateCardProps {
  onUpgrade?: () => void;
}

const PRO_BENEFITS = [
  'Bannière & logo de vitrine personnalisés',
  'Nom commercial & identifiant URL exclusif',
  'Badge PRO vérifié sur toutes vos annonces',
  'Commission de vente réduite à 2,5%',
];

export function ShopProGateCard({ onUpgrade }: ShopProGateCardProps) {
  const router = useRouter();
  const accent = useAccent();

  const handlePress = () => {
    Haptics.lightImpact();
    if (onUpgrade) onUpgrade();
    else router.push('/pro/become-pro' as any);
  };

  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: accent[50] }]}>
        <Store size={26} color={accent.DEFAULT} />
      </View>

      <AppText variant="subtitle" center style={styles.title}>
        Personnalisation réservée aux PRO
      </AppText>

      <AppText variant="body" color={colors.text.muted} center style={styles.desc}>
        Créez votre vitrine commerciale avec bannière, logo et identité personnalisée pour attirer plus d’acheteurs à Daloa.
      </AppText>

      <View style={styles.benefitsBox}>
        {PRO_BENEFITS.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <CheckCircle2 size={15} color={colors.status.successDark} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              {b}
            </AppText>
          </View>
        ))}
      </View>

      <Button
        title="Devenir Vendeur Pro — 2 500 FCFA/mois"
        variant="primary"
        size="md"
        leftIcon={<Sparkles size={16} color={colors.text.inverse} />}
        onPress={handlePress}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    lineHeight: 22,
  },
  desc: {
    lineHeight: 19,
    fontSize: 13,
    marginBottom: spacing[1],
  },
  benefitsBox: {
    width: '100%',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    padding: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
});
