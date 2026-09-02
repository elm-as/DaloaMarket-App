import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { usePayoutSettings, usePayoutHistory, paymentService, supabase } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  Button,
  CurrencyText,
  StatusPill,
  EmptyState,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import { Wallet, ArrowDownRight, Clock, ArrowLeft, TrendingUp, ShoppingBag } from 'lucide-react-native';
import { formatDate, formatFCFA, Haptics } from '@daloa/utils';

interface Balance {
  available: number;
  escrow: number;
}

async function fetchSellerBalance(userId: string): Promise<Balance> {
  const [deliveredRes, escrowRes, confirmedPayoutsRes, pendingPayoutsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('product_amount, seller_fee')
      .eq('seller_id', userId)
      .eq('status', 'delivered'),
    supabase
      .from('orders')
      .select('product_amount, seller_fee')
      .eq('seller_id', userId)
      .in('status', ['awaiting_pickup', 'picked_up', 'in_transit', 'pending_payment']),
    supabase
      .from('payouts')
      .select('net_amount')
      .eq('user_id', userId)
      .eq('status', 'confirmed'),
    supabase
      .from('payouts')
      .select('net_amount')
      .eq('user_id', userId)
      .eq('status', 'pending'),
  ]);

  const totalEarned = (deliveredRes.data || []).reduce(
    (s, o) => s + Math.max(0, (o.product_amount || 0) - (o.seller_fee || 0)),
    0
  );
  const totalPaidOut = (confirmedPayoutsRes.data || []).reduce((s, p) => s + (p.net_amount || 0), 0);
  const totalPendingPayout = (pendingPayoutsRes.data || []).reduce((s, p) => s + (p.net_amount || 0), 0);
  const escrow = (escrowRes.data || []).reduce(
    (s, o) => s + Math.max(0, (o.product_amount || 0) - (o.seller_fee || 0)),
    0
  );

  const available = Math.max(0, totalEarned - totalPaidOut - totalPendingPayout);

  return { available, escrow };
}

export default function RevenueScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: payoutSettings } = usePayoutSettings(user?.id);
  const { data: payouts, refetch: refetchPayouts } = usePayoutHistory(user?.id);

  const [balance, setBalance] = useState<Balance>({ available: 0, escrow: 0 });
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const b = await fetchSellerBalance(user.id);
      setBalance(b);
    } catch {
      // silently keep last value
    } finally {
      setIsLoadingBalance(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBalance(), refetchPayouts()]);
    setRefreshing(false);
  };

  const handleRequestPayout = async () => {
    if (!payoutSettings) {
      Alert.alert(
        'Numéro manquant',
        'Veuillez d\'abord configurer votre numéro Mobile Money pour recevoir vos fonds.',
        [{ text: 'Configurer', onPress: () => router.push('/settings/payout' as any) }]
      );
      return;
    }
    if (balance.available <= 0) {
      Alert.alert('Solde insuffisant', 'Vous n\'avez pas encore de fonds disponibles.');
      return;
    }

    Haptics.success();
    setIsRequesting(true);
    try {
      await paymentService.requestPayout({
        userId: user!.id,
        recipientType: 'seller',
        amount: balance.available,
        network: payoutSettings.network,
        phone: payoutSettings.phone,
      });
      await Promise.all([loadBalance(), refetchPayouts()]);
      Alert.alert(
        'Demande envoyée !',
        `Votre demande de retrait de ${formatFCFA(balance.available)} a été transmise.`
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Échec de la demande de retrait');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
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
              Tableau de bord financier
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Revenus
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <TrendingUp size={18} color={accent[200]} />
          </View>
        </View>

        {/* Balance cards */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIconRow}>
              <Wallet size={14} color={colors.status.successDark} />
              <AppText variant="overline" color={colors.text.muted}>
                Disponible
              </AppText>
            </View>
            <CurrencyText
              amount={isLoadingBalance ? 0 : balance.available}
              size="xl"
              weight="bold"
              color={colors.status.successDark}
            />
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceCard}>
            <View style={styles.balanceIconRow}>
              <Clock size={14} color={accent[600]} />
              <AppText variant="overline" color={colors.text.muted}>
                Séquestre
              </AppText>
            </View>
            <CurrencyText
              amount={isLoadingBalance ? 0 : balance.escrow}
              size="xl"
              weight="bold"
              color={accent[600]}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent.DEFAULT} />
        }
      >
        {/* Retrait */}
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawTop}>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Compte de retrait</AppText>
              <AppText variant="caption" color={colors.text.muted}>
                {payoutSettings
                  ? `${payoutSettings.network.toUpperCase()} · ${payoutSettings.phone}`
                  : 'Aucun compte Mobile Money configuré'}
              </AppText>
            </View>
            <AppPressable
              onPress={() => router.push('/settings/payout' as any)}
              style={[styles.configBtn, { backgroundColor: accent[50] }]}
              accessibilityLabel="Modifier le compte de retrait"
            >
              <AppText variant="caption" color={accent[700]}>
                Modifier
              </AppText>
            </AppPressable>
          </View>

          <Button
            title="Demander le retrait Mobile Money"
            variant="market"
            size="lg"
            disabled={balance.available <= 0 || isRequesting || isLoadingBalance}
            loading={isRequesting}
            onPress={handleRequestPayout}
            leftIcon={<ArrowDownRight size={18} color={colors.text.inverse} />}
            fullWidth
            style={styles.withdrawBtn}
          />
        </View>

        {/* Historique des versements */}
        <AppText variant="subtitle">Historique des versements</AppText>

        {!payouts || payouts.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} color={colors.text.subtle} />}
            title="Aucun versement effectué"
            description="Vos retraits Mobile Money apparaîtront ici une fois vos premières ventes livrées."
          />
        ) : (
          payouts.map((p) => (
            <View key={p.id} style={styles.payoutItem}>
              <View style={styles.payoutLeft}>
                <AppText variant="bodyStrong">
                  {p.network.toUpperCase()} · {p.phone}
                </AppText>
                <AppText variant="caption" color={colors.text.subtle}>
                  {formatDate(p.created_at, true)}
                </AppText>
              </View>
              <View style={styles.payoutRight}>
                <CurrencyText amount={p.net_amount} size="base" weight="bold" color={colors.status.successDark} />
                <StatusPill status={p.status} size="sm" />
              </View>
            </View>
          ))
        )}

        <View style={{ height: insets.bottom + spacing[8] }} />
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
    gap: spacing[4],
  },
  heroTop: {
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
  balanceRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  balanceCard: {
    flex: 1,
    padding: spacing[3],
    gap: 6,
  },
  balanceIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: colors.border.DEFAULT,
    marginVertical: spacing[3],
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  flex1: {
    flex: 1,
  },
  withdrawCard: {
    padding: spacing[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  withdrawTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  configBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  withdrawBtn: {
    marginTop: spacing[3],
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  payoutLeft: {
    gap: 2,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
