import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRICING_CONFIG, BOOST_CREDIT_OPTIONS } from '@daloa/config';
import { paymentService, systemSettingsService } from '@daloa/api';
import { colors, radii, spacing, typography, Card, Button, Badge, AppText, AppPressable, useAccent, showAlert } from '@daloa/ui';
import { Zap, ArrowLeft, AlertCircle, CheckCircle, ShieldCheck, Flame, Sparkles } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';
import { useAuth } from '../../src/context/AuthContext';
import { openPaymentGateway } from '../../src/lib/openPaymentGateway';

interface PackMeta {
  badge?: string;
  perCredit: number;
  savings?: string;
}

const PACKS_META: Record<string, PackMeta> = {
  bronze: { badge: 'DÉCOUVERTE', perCredit: 100 },
  silver: { badge: 'LE PLUS POPULAIRE', perCredit: 83, savings: '-17%' },
  gold: { badge: 'MEILLEURE VALEUR', perCredit: 67, savings: '-33%' },
};

export default function PacksScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [selectedPackId, setSelectedPackId] = useState<string>('silver');
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [boostsEnabled, setBoostsEnabled] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    systemSettingsService.getSettings().then((settings) => {
      if (isMounted && settings?.phaseConfig) {
        setBoostsEnabled(settings.phaseConfig.enable_boost ?? true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBuyPack = async (pack: (typeof PRICING_CONFIG.packs)[number]) => {
    if (!user?.id) {
      router.push('/auth/login' as any);
      return;
    }
    if (!boostsEnabled) {
      showAlert('Options suspendues', 'Les achats de packs sont temporairement désactivés.');
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
        throw new Error('Lien de paiement indisponible.');
      }

      await openPaymentGateway(result.paymentUrl);
      if (Platform.OS === 'web') return;

      router.replace({
        pathname: '/payment/success',
        params: { transactionId: result.transactionId, type: `credits_pack_${pack.credits}` },
      } as any);
    } catch (err: any) {
      showAlert('Paiement impossible', err.message || 'Une erreur est survenue.');
    } finally {
      setBuyingPackId(null);
    }
  };

  const selectedPack = PRICING_CONFIG.packs.find((p) => p.id === selectedPackId) || PRICING_CONFIG.packs[1];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={[accent[500], accent[600], accent[700]]}
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
              VISIBILITÉ & VENTES RAPIDES
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Packs de Crédits Boost
            </AppText>
          </View>
          <View style={styles.balanceBadge}>
            <Zap size={14} color="#F59E0B" fill="#F59E0B" />
            <AppText variant="caption" color={colors.text.inverse} style={styles.tabular}>
              {(profile as any)?.boost_credits ?? 0}
            </AppText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!boostsEnabled && (
          <View style={styles.disabledBanner}>
            <AlertCircle size={20} color="#B45309" />
            <View style={styles.flex1}>
              <AppText variant="bodyStrong" color="#92400E">
                Achats suspendus
              </AppText>
              <AppText variant="caption" color="#B45309">
                Les mises en avant d'annonces sont actuellement 100% gratuites à Daloa.
              </AppText>
            </View>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <AppText variant="subtitle">Choisissez votre pack</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Crédits sans date d'expiration
          </AppText>
        </View>

        {/* ── LISTE DES PACKS ── */}
        <View style={styles.packsList}>
          {PRICING_CONFIG.packs.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            const meta = PACKS_META[pack.id] || { perCredit: Math.round(pack.price / pack.credits) };
            const isPopular = pack.id === 'silver';

            return (
              <AppPressable
                key={pack.id}
                onPress={() => {
                  Haptics.selection();
                  setSelectedPackId(pack.id);
                }}
                style={[
                  styles.packCard,
                  isSelected && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
                  isPopular && !isSelected && styles.popularBorder,
                ]}
              >
                <View style={styles.packTopRow}>
                  <View style={styles.packTitleCol}>
                    <View style={styles.badgeRow}>
                      <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
                        {pack.name}
                      </AppText>
                      {meta.badge && (
                        <View style={[styles.tagBadge, isPopular ? styles.tagPopular : styles.tagDefault]}>
                          <AppText variant="caption" color={isPopular ? '#C2410C' : colors.text.muted} style={styles.tagText}>
                            {meta.badge}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppText variant="caption" color={colors.text.subtle}>
                      {pack.credits} crédits de mise en avant
                    </AppText>
                  </View>

                  <View style={styles.priceCol}>
                    <AppText variant="title" color={accent[700]} style={styles.tabular}>
                      {formatFCFA(pack.price)}
                    </AppText>
                    <AppText variant="caption" color={colors.text.muted} style={styles.tabular}>
                      ~{meta.perCredit} F / crédit
                    </AppText>
                  </View>
                </View>

                {meta.savings && (
                  <View style={styles.savingsPill}>
                    <Sparkles size={11} color="#15803D" />
                    <AppText variant="caption" color="#15803D" style={styles.savingsText}>
                      Économisez {meta.savings} sur le prix unitaire
                    </AppText>
                  </View>
                )}
              </AppPressable>
            );
          })}
        </View>

        {/* ── CE QUE PERMETTENT LES CRÉDITS ── */}
        <Card style={styles.perksCard}>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.perksTitle}>
            Pourquoi booster vos annonces ?
          </AppText>
          <View style={styles.perkRow}>
            <CheckCircle size={16} color={accent.DEFAULT} style={styles.perkIcon} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              <AppText variant="caption" color={colors.text.body} style={styles.bold}>Position n°1 garantie : </AppText>
              Votre article passe en tête des résultats de recherche à Daloa.
            </AppText>
          </View>
          <View style={styles.perkRow}>
            <CheckCircle size={16} color={accent.DEFAULT} style={styles.perkIcon} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              <AppText variant="caption" color={colors.text.body} style={styles.bold}>3x plus de contacts : </AppText>
              Les articles boostés sont consultés en moyenne 3 fois plus vite.
            </AppText>
          </View>
          <View style={styles.perkRow}>
            <CheckCircle size={16} color={accent.DEFAULT} style={styles.perkIcon} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              <AppText variant="caption" color={colors.text.body} style={styles.bold}>Zéro expiration : </AppText>
              Vos crédits restent utilisables quand vous le souhaitez.
            </AppText>
          </View>
        </Card>

        {/* ── RÉASSURANCE PAIEMENT MOBILE MONEY ── */}
        <View style={styles.reassuranceRow}>
          <ShieldCheck size={16} color={colors.status.successDark} />
          <AppText variant="caption" color={colors.text.muted}>
            Paiement 100% sécurisé via Wave, Orange, MTN ou Moov
          </AppText>
        </View>

        {/* ── BOUTON D'ACHAT ── */}
        <Button
          title={boostsEnabled ? `Acheter ${selectedPack.name} · ${formatFCFA(selectedPack.price)}` : 'Options suspendues'}
          variant="market"
          size="md"
          loading={buyingPackId !== null}
          disabled={buyingPackId !== null || !boostsEnabled}
          onPress={() => handleBuyPack(selectedPack)}
          style={styles.mainCtaBtn}
        />

        <View style={{ height: insets.bottom + spacing[4] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  hero: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitles: { flex: 1, marginLeft: spacing[3] },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: { padding: spacing[4], gap: spacing[3] },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.lg,
    padding: spacing[3],
    gap: spacing[2],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing[1],
  },
  packsList: { gap: spacing[3] },
  packCard: {
    backgroundColor: colors.neutrals.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    gap: spacing[2],
  },
  popularBorder: { borderColor: '#FDBA74' },
  packTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  packTitleCol: { flex: 1, gap: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  tagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.sm },
  tagDefault: { backgroundColor: colors.bg.subtle },
  tagPopular: { backgroundColor: '#FFEDD5' },
  tagText: { fontSize: 10, fontFamily: typography.families.bold },
  priceCol: { alignItems: 'flex-end', marginLeft: spacing[2] },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  savingsText: { fontSize: 11, fontFamily: typography.families.bold },
  perksCard: { backgroundColor: colors.neutrals.surface, borderRadius: radii.xl, padding: spacing[3], gap: spacing[2] },
  perksTitle: { marginBottom: 2 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  perkIcon: { marginTop: 2 },
  bold: { fontFamily: typography.families.bold },
  reassuranceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], marginVertical: spacing[1] },
  mainCtaBtn: { borderRadius: radii.xl, marginTop: spacing[1] },
  flex1: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
