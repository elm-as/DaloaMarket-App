import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, Button, AppText, useAccent } from '@daloa/ui';
import { Wrench, Clock } from 'lucide-react-native';
import { formatDate } from '@daloa/utils';

interface MaintenanceScreenProps {
  message: string;
  expectedReopening?: string | null;
  onRetry?: () => void;
}

/** Écran plein affiché quand le mode maintenance est activé côté serveur. */
export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ message, expectedReopening, onRetry }) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  let reopeningLabel: string | null = null;
  if (expectedReopening) {
    const d = new Date(expectedReopening);
    if (!isNaN(d.getTime())) reopeningLabel = formatDate(expectedReopening, true);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom }]}>
      <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
        <Wrench size={40} color={accent.DEFAULT} />
      </View>

      <AppText variant="h2" center style={styles.title}>
        Maintenance en cours
      </AppText>
      <AppText variant="body" color={colors.text.muted} center style={styles.message}>
        {message}
      </AppText>

      {reopeningLabel && (
        <View style={styles.reopenRow}>
          <Clock size={14} color={accent[700]} />
          <AppText variant="caption" color={accent[700]}>
            Réouverture prévue : {reopeningLabel}
          </AppText>
        </View>
      )}

      {onRetry && (
        <Button title="Réessayer" variant="outline" size="md" onPress={onRetry} style={styles.retryBtn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  title: { marginTop: spacing[2] },
  message: { maxWidth: 320 },
  reopenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
  },
  retryBtn: { marginTop: spacing[4], minWidth: 160 },
});
