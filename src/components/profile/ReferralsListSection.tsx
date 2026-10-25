import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  colors,
  radii,
  spacing,
  AppText,
  typography,
} from '@daloa/ui';
import { Users, CheckCircle2, Clock } from 'lucide-react-native';
import { ReferralSummary } from '@daloa/types';

interface ReferralsListSectionProps {
  summary: ReferralSummary | null;
}

export const ReferralsListSection: React.FC<ReferralsListSectionProps> = ({ summary }) => {
  const referrals = summary?.referrals || [];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Users size={18} color={colors.text.DEFAULT} />
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          Mes amis parrainés ({summary?.invitedCount ?? 0})
        </AppText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <AppText variant="h2" color={colors.status.successDark} style={styles.tabularNum}>
            {summary?.rewardedCount ?? 0}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Commandes livrées (+500 F)
          </AppText>
        </View>

        <View style={styles.statBox}>
          <AppText variant="h2" color={colors.status.warningDark} style={styles.tabularNum}>
            {summary?.pendingCount ?? 0}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            En attente 1ère commande
          </AppText>
        </View>
      </View>

      {referrals.length === 0 ? (
        <View style={styles.emptyBox}>
          <AppText variant="caption" color={colors.text.muted} style={styles.emptyText}>
            Aucun ami parrainé pour le moment. Partagez votre code sur WhatsApp pour commencer à cumuler du Daloa Cash !
          </AppText>
        </View>
      ) : (
        <View style={styles.referralsList}>
          {referrals.map((ref) => {
            const isRewarded = ref.status === 'completed';
            return (
              <View key={ref.id} style={styles.referralItem}>
                <View style={styles.refLeft}>
                  {isRewarded ? (
                    <CheckCircle2 size={18} color={colors.status.successDark} />
                  ) : (
                    <Clock size={18} color={colors.status.warningDark} />
                  )}
                  <View>
                    <AppText variant="bodyStrong" style={styles.refName}>
                      {ref.referee?.full_name || 'Ami DaloaMarket'}
                    </AppText>
                    <AppText variant="caption" color={colors.text.muted}>
                      Inscrit le {new Date(ref.created_at).toLocaleDateString('fr-FR')}
                    </AppText>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isRewarded ? styles.badgeSuccess : styles.badgePending,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={isRewarded ? colors.status.successDark : colors.status.warningDark}
                    style={styles.statusText}
                  >
                    {isRewarded ? '+500 FCFA' : 'En attente'}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  statsRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  statBox: {
    flex: 1,
    backgroundColor: colors.grey[50],
    borderRadius: radii.md,
    padding: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tabularNum: { fontVariant: ['tabular-nums'], marginBottom: 2 },
  emptyBox: { paddingVertical: spacing[4], alignItems: 'center' },
  emptyText: { textAlign: 'center', lineHeight: 18 },
  referralsList: { gap: spacing[1] },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  refLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  refName: { fontSize: 14 },
  statusBadge: { paddingHorizontal: spacing[1], paddingVertical: 3, borderRadius: radii.full },
  badgeSuccess: { backgroundColor: colors.status.successLight },
  badgePending: { backgroundColor: colors.status.warningLight },
  statusText: { fontFamily: typography.families.semibold, fontVariant: ['tabular-nums'] },
});
