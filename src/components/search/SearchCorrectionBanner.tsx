import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable } from '@daloa/ui';

interface SearchCorrectionBannerProps {
  originalQuery: string;
  correctedQuery: string;
  wasCorrected: boolean;
  synonyms: string[];
  onSelectTerm?: (term: string) => void;
}

export function SearchCorrectionBanner({
  originalQuery: _originalQuery,
  correctedQuery,
  wasCorrected,
  synonyms,
  onSelectTerm,
}: SearchCorrectionBannerProps) {
  if (!wasCorrected && synonyms.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Sparkles size={14} color={colors.primary.DEFAULT} />
      </View>
      <View style={styles.textWrap}>
        {wasCorrected ? (
          <View style={styles.row}>
            <AppText variant="caption" color={colors.text.subtle}>
              Résultats inclus pour{' '}
            </AppText>
            <AppPressable onPress={() => onSelectTerm?.(correctedQuery)}>
              <AppText variant="caption" color={colors.primary.DEFAULT} style={styles.boldText}>
                « {correctedQuery} »
              </AppText>
            </AppPressable>
          </View>
        ) : (
          <View style={styles.row}>
            <AppText variant="caption" color={colors.text.subtle}>
              Synonymes inclus :{' '}
            </AppText>
            <AppText variant="caption" color={colors.text.DEFAULT} style={styles.boldText}>
              {synonyms.slice(0, 3).join(', ')}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginHorizontal: spacing[3],
    marginBottom: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconWrap: {
    marginRight: spacing[2],
  },
  textWrap: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  boldText: {
    textDecorationLine: 'underline',
  },
});
