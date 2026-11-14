import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@daloa/ui';

export const deliveryRadarStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  freshnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  freshnessText: {
    fontFamily: typography.families.medium,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  driverInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.status.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    padding: spacing[3],
    alignItems: 'center',
    gap: 2,
  },
  tabularNumber: {
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  expandedContent: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  pinIcon: {
    marginTop: 2,
    marginRight: spacing[2],
  },
  destinationTextGroup: {
    flex: 1,
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
  },
  radarHint: {
    textAlign: 'center',
    marginTop: spacing[1],
  },
});
