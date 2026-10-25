import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  useAccent,
  typography,
  Button,
  showAlert,
  DaloaCashCard,
} from '@daloa/ui';
import {
  ArrowLeft,
  Tag,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';
import { daloaCashService } from '@daloa/api';
import { ReferralSummary, DaloaCashTransaction } from '@daloa/types';
import { useAuth } from '../../src/context/AuthContext';
import { ReferralsListSection } from '../../src/components/profile/ReferralsListSection';

export default function ReferralScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();

  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await daloaCashService.getReferralSummary(user.id);
      setSummary(data);
    } catch (err: any) {
      console.warn('Erreur chargement parrainage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSummary(), refreshProfile()]);
    setIsRefreshing(false);
  };

  const handleApplyCode = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      showAlert('Code manquant', 'Veuillez saisir le code de parrainage de votre ami.');
      return;
    }

    try {
      setIsApplying(true);
      const res = await daloaCashService.applyReferralCode(code);
      Haptics.success();
      showAlert('Félicitations !', res.message);
      setInputCode('');
      await Promise.all([fetchSummary(), refreshProfile()]);
    } catch (err: any) {
      Haptics.warning();
      showAlert('Erreur de validation', err?.message || 'Impossible d’appliquer ce code.');
    } finally {
      setIsApplying(false);
    }
  };

  const canApplyCode = Boolean(
    !profile?.referred_by_code &&
    summary &&
    summary.referrals.length === 0
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppPressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={22} color={colors.text.DEFAULT} />
        </AppPressable>
        <AppText variant="h2" style={styles.headerTitle}>
          Parrainage & Daloa Cash
        </AppText>
        <View style={styles.backPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={accent[600]} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[accent[600]]}
            />
          }
        >
          <DaloaCashCard
            balance={summary?.balance ?? profile?.daloa_cash_balance ?? 0}
            referralCode={summary?.referralCode ?? profile?.referral_code ?? 'DALOA'}
            shareMessage={daloaCashService.getShareMessage(
              summary?.referralCode ?? profile?.referral_code ?? 'DALOA'
            )}
            shareUrl={daloaCashService.getShareUrl(
              summary?.referralCode ?? profile?.referral_code ?? 'DALOA'
            )}
          />

          {canApplyCode && (
            <View style={styles.applyCard}>
              <View style={styles.applyHeader}>
                <Tag size={18} color={accent[600]} />
                <AppText variant="bodyStrong">Vous avez un code parrainage ?</AppText>
              </View>
              <AppText variant="caption" color={colors.text.muted} style={styles.applyDesc}>
                Entrez le code d'un ami pour recevoir immédiatement 500 FCFA sur votre solde Daloa Cash.
              </AppText>

              <View style={styles.inputRow}>
                <TextInput
                  value={inputCode}
                  onChangeText={setInputCode}
                  placeholder="EX: KOUAME-784B"
                  placeholderTextColor={colors.text.subtle}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.textInput}
                />
                <Button
                  title={isApplying ? 'Validation...' : 'Valider'}
                  size="md"
                  variant="primary"
                  onPress={handleApplyCode}
                  disabled={isApplying || !inputCode.trim()}
                />
              </View>
            </View>
          )}

          {/* Section Liste des amis parrainés */}
          <ReferralsListSection summary={summary} />

          {/* Historique des transactions Daloa Cash */}
          {summary?.transactions && summary.transactions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <History size={18} color={colors.text.DEFAULT} />
                <AppText variant="bodyStrong" style={styles.sectionTitle}>
                  Historique Daloa Cash
                </AppText>
              </View>

              <View style={styles.txList}>
                {summary.transactions.map((tx: DaloaCashTransaction) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <View key={tx.id} style={styles.txItem}>
                      <View style={styles.txLeft}>
                        <View
                          style={[
                            styles.txIconCircle,
                            isPositive ? styles.txCirclePositive : styles.txCircleNegative,
                          ]}
                        >
                          {isPositive ? (
                            <TrendingUp size={14} color={colors.status.successDark} />
                          ) : (
                            <TrendingDown size={14} color={colors.status.errorDark} />
                          )}
                        </View>
                        <View style={styles.txTexts}>
                          <AppText variant="caption" color={colors.text.body} numberOfLines={1}>
                            {tx.notes || tx.type}
                          </AppText>
                          <AppText variant="caption" color={colors.text.subtle}>
                            {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                          </AppText>
                        </View>
                      </View>

                      <AppText
                        variant="bodyStrong"
                        color={isPositive ? colors.status.successDark : colors.status.errorDark}
                        style={styles.txAmount}
                      >
                        {isPositive ? `+${formatFCFA(tx.amount)}` : `-${formatFCFA(Math.abs(tx.amount))}`}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: spacing[1] },
  headerTitle: { fontFamily: typography.families.bold },
  backPlaceholder: { width: 32 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: spacing[4], gap: spacing[4] },
  applyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  applyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  applyDesc: { marginTop: 4, marginBottom: spacing[2] },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[2],
    fontFamily: typography.families.bold,
    letterSpacing: 1.2,
    color: colors.text.DEFAULT,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  sectionTitle: { fontFamily: typography.families.bold },
  txList: { gap: spacing[1] },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1, paddingRight: spacing[2] },
  txIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txCirclePositive: { backgroundColor: colors.status.successLight },
  txCircleNegative: { backgroundColor: colors.status.errorLight },
  txTexts: { flex: 1 },
  txAmount: { fontVariant: ['tabular-nums'] },
});
