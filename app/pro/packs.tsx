import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRICING_CONFIG } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Card,
  Button,
  Badge,
  CurrencyText,
} from '@daloa/ui';
import { Layers, Zap, ArrowUpCircle, Check } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function PacksScreen() {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<string>('silver');

  const handleBuyPack = (packName: string, price: number) => {
    Haptics.success();
    Alert.alert(
      'Paiement Mobile Money',
      `Confirmez l'achat du ${packName} pour ${price} FCFA via Wave / Orange / MTN.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            Alert.alert('Succès !', 'Vos crédits d’annonces ont été ajoutés à votre solde.');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Packs d'Annonces & Boosts" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.introCard}>
          <Layers size={24} color={colors.market.primary} />
          <Text style={styles.introTitle}>Packs de publication & Visibilité</Text>
          <Text style={styles.introSub}>
            Publiez plus d'annonces et propulsez vos articles en tête des résultats de recherche à Daloa.
          </Text>
        </View>

        {/* 1. Packs de Crédits Annonces */}
        <Text style={styles.sectionTitle}>Packs de Crédits Annonces</Text>
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
                style={[styles.packCard, isSelected && styles.packCardActive]}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Badge label="POPULAIRE" variant="pro" />
                  </View>
                )}

                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.creditsCount}>{pack.credits} Annonces</Text>
                <CurrencyText amount={pack.price} size="xl" weight="bold" color={colors.market.primary} />

                <Button
                  title="Acheter"
                  variant={isSelected ? 'market' : 'secondary'}
                  size="sm"
                  onPress={() => handleBuyPack(pack.name, pack.price)}
                  style={{ marginTop: spacing[2], width: '100%' }}
                />
              </Card>
            );
          })}
        </View>

        {/* 2. Options de Visibilité (Boost & Bump) */}
        <Text style={styles.sectionTitle}>Options de Boost Immédiat</Text>
        <Card style={styles.boostCard}>
          <View style={styles.boostRow}>
            <View style={styles.boostIconBox}>
              <Zap size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.boostTitle}>Boost En Vedette (7 jours)</Text>
              <Text style={styles.boostSub}>
                Bandeau doré, icône TOP et affichage prioritaire sur la page d'accueil de Daloa.
              </Text>
              <CurrencyText amount={PRICING_CONFIG.boosts.boost7Days} size="sm" weight="bold" color="#F59E0B" />
            </View>
          </View>
          <Button
            title="Booster une annonce (500 F)"
            variant="outline"
            size="sm"
            onPress={() => handleBuyPack('Boost 7 Jours', 500)}
            style={{ marginTop: spacing[3] }}
          />
        </Card>

        <Card style={styles.boostCard}>
          <View style={styles.boostRow}>
            <View style={[styles.boostIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <ArrowUpCircle size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.boostTitle}>Remontée Immédiate (Bump)</Text>
              <Text style={styles.boostSub}>
                Replace votre annonce tout en haut du flux des nouveautés comme si elle venait d'être publiée.
              </Text>
              <CurrencyText amount={PRICING_CONFIG.boosts.bumpToListTop} size="sm" weight="bold" color="#3B82F6" />
            </View>
          </View>
          <Button
            title="Remonter en tête (200 F)"
            variant="outline"
            size="sm"
            onPress={() => handleBuyPack('Bump Immédiat', 200)}
            style={{ marginTop: spacing[3] }}
          />
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  introCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing[4],
    gap: spacing[1],
  },
  introTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  introSub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
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
    position: 'relative',
  },
  packCardActive: {
    borderColor: colors.market.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
  },
  packName: {
    color: colors.dark.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  creditsCount: {
    color: colors.dark.textDim,
    fontSize: 10,
  },
  boostCard: {
    padding: spacing[4],
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  boostSub: {
    color: colors.dark.textDim,
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 3,
  },
});
