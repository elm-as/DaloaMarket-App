import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRICING_CONFIG, BOOST_CREDIT_OPTIONS } from '@daloa/config';
import { paymentService } from '@daloa/api';
import { colors, radii, spacing, Card, Button, Badge, AppText, AppPressable, useAccent, showAlert } from '@daloa/ui';
import { Layers, Zap, ArrowLeft } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';
import { useAuth } from '../../src/context/AuthContext';
import { openPaymentGateway } from '../../src/lib/openPaymentGateway';

export default function PacksScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string>('silver');

  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);

  /**
   * Achat réel d'un pack via MoneyFusion. L'écran affichait auparavant
   * « Vos crédits ont été ajoutés » sans aucun paiement ni crédit.
   * Les crédits sont ajoutés par le serveur à la confirmation du paiement.
   */
  const handleBuyPack = async (pack: (typeof PRICING_CONFIG.packs)[number]) => {
    if (!user?.id) {
      router.push('/auth/login' as any);
      return;
    }
    Haptics.selection();
    setBuyingPackId(pack.id);
    try {
      const result = await paymentService.initiatePayment({
        type: `credits_pack_${pack.credits}` as 'credits_pack_5' | 'credits_pack_12' | 'credits_pack_30',
        amount: pack.price,
        userId: user.id,
        customerName: profile?.full_name || 'Vendeur DaloaMarket',
        customerPhone: profile?.phone || '',
      });
      if (!result.paymentUrl) {
        throw new Error('Lien de paiement indisponible. Réessayez.');
      }

      await openPaymentGateway(result.paymentUrl);
      if (Platform.OS === 'web') return;

      await new Promise((r) => setTimeout(r, 1500));
      await refreshProfile();
      showAlert(
        'Paiement lancé',
        `Dès la confirmation Mobile Money, vos ${pack.credits} crédits sont ajoutés automatiquement.`
      );
    } catch (err: any) {
      showAlert('Paiement impossible', err.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setBuyingPackId(null);
    }
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
        <AppText variant="subtitle">Packs de crédits de boost</AppText>
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
                    {/* "count" = accent orange : ce tag met en avant un pack, ce n'est pas un badge Pro. */}
                    <Badge label="POPULAIRE" variant="count" />
                  </View>
                )}

                <AppText variant="caption" color={colors.text.DEFAULT}>
                  {pack.name}
                </AppText>
                <AppText variant="caption" color={colors.text.subtle}>
                  {pack.credits} crédits de boost
                </AppText>
                <AppText variant="bodyStrong" color={accent[600]}>
                  {formatFCFA(pack.price)}
                </AppText>

                <Button
                  title="Acheter"
                  variant={isSelected ? 'market' : 'outline'}
                  size="sm"
                  loading={buyingPackId === pack.id}
                  disabled={buyingPackId !== null}
                  onPress={() => handleBuyPack(pack)}
                  style={styles.packBtn}
                />
              </Card>
            );
          })}
        </View>

        {/* Boost : payé en crédits, comme sur le web (buy_boost_with_credits).
            Les offres « Boost 500 F » et « Bump 200 F » n'avaient aucun
            paiement derrière : le serveur ne connaît pas ces types d'achat. */}
        <AppText variant="subtitle">Booster une annonce</AppText>
        <View style={styles.boostCard}>
          <View style={styles.boostRow}>
            <View style={[styles.boostIconBox, { backgroundColor: accent[50] }]}>
              <Zap size={22} color={accent.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Mise en avant avec vos crédits</AppText>
              <AppText variant="caption" color={colors.text.muted} style={styles.boostSub}>
                {BOOST_CREDIT_OPTIONS.map((o) => `${o.label} : ${o.credits} crédit${o.credits > 1 ? 's' : ''}`).join(' · ')}
              </AppText>
            </View>
          </View>
          <Button
            title="Choisir une annonce à booster"
            variant="outline"
            size="sm"
            onPress={() => router.push('/seller/my-listings' as any)}
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
