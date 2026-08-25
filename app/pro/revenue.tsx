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
import { useAuth } from '../../src/context/AuthContext';
import { usePayoutSettings, usePayoutHistory, paymentService } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Card,
  Button,
  CurrencyText,
  StatCard,
  StatusPill,
  EmptyState,
} from '@daloa/ui';
import { Wallet, ArrowDownRight, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { formatDate, Haptics } from '@daloa/utils';

export default function RevenueScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: payoutSettings } = usePayoutSettings(user?.id);
  const { data: payouts, refetch } = usePayoutHistory(user?.id);

  const [isRequesting, setIsRequesting] = useState(false);

  // Valeurs simulées du portefeuille vendeur
  const availableBalance = 45000;
  const pendingEscrowBalance = 15000;

  const handleRequestPayout = async () => {
    if (!payoutSettings) {
      Alert.alert(
        'Numéro manquant',
        'Veuillez d’abord configurer votre numéro Mobile Money pour recevoir vos fonds.',
        [{ text: 'Configurer', onPress: () => router.push('/settings/payout') }]
      );
      return;
    }

    Haptics.success();
    setIsRequesting(true);

    try {
      await paymentService.requestPayout({
        userId: user!.id,
        recipientType: 'seller',
        amount: availableBalance,
        network: payoutSettings.network,
        phone: payoutSettings.phone,
      });

      refetch();
      Alert.alert('Demande envoyée !', 'Votre demande de retrait de 45 000 FCFA a été transmise. Vous recevrez le virement sous 24h.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Échec de la demande de retrait');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Mes Revenus & Portefeuille" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <StatCard
            label="Solde disponible"
            value={availableBalance}
            isCurrency
            currencyColor="#10B981"
            icon={<Wallet size={16} color="#10B981" />}
          />
          <StatCard
            label="En séquestre (24h)"
            value={pendingEscrowBalance}
            isCurrency
            currencyColor={colors.market.primary}
            icon={<Clock size={16} color={colors.market.primary} />}
          />
        </View>

        {/* Action Retrait Mobile Money */}
        <Card style={styles.withdrawCard}>
          <View style={styles.withdrawTop}>
            <View>
              <Text style={styles.withdrawTitle}>Compte de retrait configuré</Text>
              <Text style={styles.withdrawPhone}>
                {payoutSettings
                  ? `${payoutSettings.network.toUpperCase()} • ${payoutSettings.phone}`
                  : 'Aucun compte Mobile Money configuré'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings/payout')}
              style={styles.configBtn}
            >
              <Text style={styles.configBtnText}>Modifier</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Demander le retrait Mobile Money"
            variant="market"
            size="lg"
            disabled={availableBalance <= 0 || isRequesting}
            loading={isRequesting}
            onPress={handleRequestPayout}
            leftIcon={<ArrowDownRight size={18} color="#FFFFFF" />}
            style={{ marginTop: spacing[3] }}
          />
        </Card>

        {/* Historique des Retraits */}
        <Text style={styles.sectionTitle}>Historique des versements</Text>

        {!payouts || payouts.length === 0 ? (
          <EmptyState
            title="Aucun versement effectué"
            description="Vos retraits Mobile Money et virements apparaîtront ici."
          />
        ) : (
          payouts.map((p) => (
            <Card key={p.id} style={styles.payoutItem}>
              <View style={styles.payoutLeft}>
                <Text style={styles.payoutNetwork}>{p.network.toUpperCase()} • {p.phone}</Text>
                <Text style={styles.payoutDate}>{formatDate(p.created_at, true)}</Text>
              </View>

              <View style={styles.payoutRight}>
                <CurrencyText amount={p.net_amount} size="base" weight="bold" color="#10B981" />
                <StatusPill status={p.status} size="sm" />
              </View>
            </Card>
          ))
        )}

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
  kpiRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  withdrawCard: {
    padding: spacing[4],
  },
  withdrawTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  withdrawTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  withdrawPhone: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  configBtn: {
    backgroundColor: colors.dark.surfaceRaised,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radii.md,
  },
  configBtnText: {
    color: colors.market.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  payoutLeft: {
    gap: 2,
  },
  payoutNetwork: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  payoutDate: {
    color: colors.dark.textDim,
    fontSize: 11,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
