import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRICING_CONFIG } from '@daloa/config';
import { colors, radii, spacing, Card, Button, Badge, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Layers, Zap, ArrowUpCircle, ArrowLeft } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';

export default function PacksScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [selectedPack, setSelectedPack] = useState<string>('silver');

  const handleBuyPack = (packName: string, price: number) => {
    Haptics.success();
    Alert.alert(
      'Paiement Mobile Money',
      `Confirmez l'achat du ${packName} pour ${formatFCFA(price)} via Wave / Orange / MTN.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            Alert.alert('Succès ! 🎉', "Vos crédits d'annonces ont été ajoutés.");
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Visibilité & crédits
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Packs & boosts
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <Zap size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Packs crédits */}
        <AppText variant="subtitle">Packs de crédits annonces</AppText>
        <View style={styles.packsGrid}>
          {PRICING_CONFIG.packs.map((pack) => {
            const isSelected = selectedPack === pack.id;
            return (
              <Card
                key={pack.id}
                onPress={() => {
                  Haptics.selection();
                  setSelectedPack(pack.id);
                }}
                style={[styles.packCard, isSelected && { borderColor: accent.DEFAULT, backgroundColor: accent[50] }]}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Badge label="POPULAIRE" variant="pro" />
                  </View>
                )}

                <AppText variant="caption" color={colors.text.DEFAULT}>
                  {pack.name}
                </AppText>
                <AppText variant="caption" color={colors.text.subtle}>
                  {pack.credits} annonces
                </AppText>
                <AppText variant="bodyStrong" color={accent[600]}>
                  {formatFCFA(pack.price)}
                </AppText>

                <Button
                  title="Acheter"
                  variant={isSelected ? 'market' : 'outline'}
                  size="sm"
                  onPress={() => handleBuyPack(pack.name, pack.price)}
                  style={styles.packBtn}
                />
              </Card>
            );
          })}
        </View>

        {/* Boost */}
        <AppText variant="subtitle">Options de boost immédiat</AppText>
        <View style={styles.boostCard}>
          <View style={styles.boostRow}>
            <View style={[styles.boostIconBox, { backgroundColor: accent[50] }]}>
              <Zap size={22} color={accent.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Boost en vedette ⚡ (7 jours)</AppText>
              <AppText variant="caption" color={colors.text.muted} style={styles.boostSub}>
                Bandeau doré, badge TOP et affichage prioritaire sur la page d'accueil de Daloa.
              </AppText>
              <AppText variant="bodyStrong" color={accent[600]}>
                {formatFCFA(PRICING_CONFIG.boosts.boost7Days)}
              </AppText>
            </View>
          </View>
          <Button
            title="Booster une annonce (500 F)"
            variant="outline"
            size="sm"
            onPress={() => handleBuyPack('Boost 7 Jours', 500)}
            fullWidth
            style={styles.boostBtn}
          />
        </View>

        {/* Bump */}
        <View style={styles.boostCard}>
          <View style={styles.boostRow}>
            <View style={[styles.boostIconBox, { backgroundColor: colors.secondary[50] }]}>
              <ArrowUpCircle size={22} color={colors.secondary.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Remontée immédiate (Bump)</AppText>
              <AppText variant="caption" color={colors.text.muted} style={styles.boostSub}>
                Replace votre annonce tout en haut du flux des nouveautés comme si elle venait d'être publiée.
              </AppText>
              <AppText variant="bodyStrong" color={colors.secondary.DEFAULT}>
                {formatFCFA(PRICING_CONFIG.boosts.bumpToListTop)}
              </AppText>
            </View>
          </View>
          <Button
            title="Remonter en tête (200 F)"
            variant="outline"
            size="sm"
            onPress={() => handleBuyPack('Bump Immédiat', 200)}
            fullWidth
            style={styles.boostBtn}
          />
        </View>

        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  packsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  packCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[3],
    gap: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
  },
  packBtn: {
    marginTop: spacing[2],
    width: '100%',
  },
  boostCard: {
    padding: spacing[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  boostRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  boostIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  boostSub: {
    marginVertical: 3,
  },
  boostBtn: {
    marginTop: spacing[2],
  },
});
