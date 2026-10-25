import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Store, CheckCircle2, Clock, MapPin } from 'lucide-react-native';
import { colors, radii, spacing } from '../tokens';
import { typography } from '../tokens/typography';
import { useAccent } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { GroupedPickupStop } from '@daloa/types';

export interface GroupedStopsTimelineProps {
  stops: GroupedPickupStop[];
  dropoffAddress: string;
  dropoffDistrict?: string | null;
  totalStops?: number;
  completedStops?: number;
}

export const GroupedStopsTimeline: React.FC<GroupedStopsTimelineProps> = ({
  stops,
  dropoffAddress,
  dropoffDistrict,
  totalStops = stops.length,
  completedStops = stops.filter((s) => s.status === 'picked_up').length,
}) => {
  const accent = useAccent();
  const allStopsCompleted = completedStops >= totalStops;

  return (
    <View style={styles.card}>
      {/* En-tête de la tournée */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconCircle, { backgroundColor: accent[50] }]}>
            <Store size={15} color={accent[700]} />
          </View>
          <View>
            <AppText variant="bodyStrong">Tournée multi-marchands</AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              {completedStops} sur {totalStops} retraits effectués
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.progressBadge,
            { backgroundColor: allStopsCompleted ? colors.status.successLight : accent[50] },
          ]}
        >
          <AppText
            variant="overline"
            color={allStopsCompleted ? colors.status.successDark : accent[700]}
            style={styles.tabularNum}
          >
            {allStopsCompleted ? 'EN ROUTE LIVRAISON' : `STOP ${completedStops + 1}/${totalStops}`}
          </AppText>
        </View>
      </View>

      {/* Liste des stops de collecte */}
      <View style={styles.timelineList}>
        {stops.map((stop, index) => {
          const isDone = stop.status === 'picked_up';
          const isCurrent = !isDone && index === completedStops;

          return (
            <View key={`${stop.sellerId}-${stop.stopIndex}`} style={styles.stopRow}>
              {/* Connecteur vertical et indicateur */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.stopCircle,
                    isDone
                      ? styles.circleDone
                      : isCurrent
                      ? [styles.circleCurrent, { borderColor: accent.DEFAULT }]
                      : styles.circlePending,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={13} color={colors.status.successDark} />
                  ) : (
                    <AppText
                      variant="caption"
                      color={isCurrent ? accent.DEFAULT : colors.text.subtle}
                      style={[styles.stopNumberText, styles.tabularNum]}
                    >
                      {stop.stopIndex || index + 1}
                    </AppText>
                  )}
                </View>
                <View style={styles.connectingLine} />
              </View>

              {/* Détails du stop */}
              <View style={styles.stopDetails}>
                <View style={styles.stopTitleRow}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {stop.shopName}
                  </AppText>
                  <View
                    style={[
                      styles.statusPill,
                      isDone ? styles.pillDone : styles.pillPending,
                    ]}
                  >
                    <AppText
                      variant="overline"
                      color={isDone ? colors.status.successDark : colors.text.muted}
                    >
                      {isDone ? 'COLLECTÉ' : isCurrent ? 'EN COURS' : 'EN ATTENTE'}
                    </AppText>
                  </View>
                </View>

                <AppText variant="caption" color={colors.text.muted} numberOfLines={1}>
                  {stop.address || stop.district || 'Daloa'}
                </AppText>
              </View>
            </View>
          );
        })}

        {/* Étape finale : Destination acheteur */}
        <View style={styles.stopRow}>
          <View style={styles.indicatorCol}>
            <View
              style={[
                styles.stopCircle,
                allStopsCompleted
                  ? [styles.circleCurrent, { borderColor: accent.DEFAULT }]
                  : styles.circlePending,
              ]}
            >
              <MapPin
                size={12}
                color={allStopsCompleted ? accent.DEFAULT : colors.text.subtle}
              />
            </View>
          </View>

          <View style={styles.stopDetails}>
            <View style={styles.stopTitleRow}>
              <AppText variant="bodyStrong">Livraison finale</AppText>
              <View
                style={[
                  styles.statusPill,
                  allStopsCompleted ? styles.pillCurrent : styles.pillPending,
                ]}
              >
                <AppText
                  variant="overline"
                  color={allStopsCompleted ? accent[700] : colors.text.muted}
                >
                  {allStopsCompleted ? 'EN LIVRAISON' : 'DESTINATION'}
                </AppText>
              </View>
            </View>

            <AppText variant="caption" color={colors.text.muted} numberOfLines={1}>
              {dropoffAddress} {dropoffDistrict ? `(${dropoffDistrict})` : ''}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  timelineList: {
    gap: 0,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    minHeight: 48,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  stopCircle: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  circleDone: {
    borderColor: colors.status.successDark,
    backgroundColor: colors.status.successLight,
  },
  circleCurrent: {
    backgroundColor: colors.bg.surface,
  },
  circlePending: {
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
  },
  stopNumberText: {
    fontSize: 10,
    fontFamily: typography.families.bold,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: colors.border.subtle,
    marginVertical: 2,
  },
  stopDetails: {
    flex: 1,
    paddingBottom: spacing[2],
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[1],
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  pillDone: {
    backgroundColor: colors.status.successLight,
  },
  pillCurrent: {
    backgroundColor: colors.bg.subtle,
  },
  pillPending: {
    backgroundColor: colors.bg.subtle,
  },
  tabularNum: {
    fontVariant: ['tabular-nums'],
  },
});
