import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, useAccent } from '@daloa/ui';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({ currentStep, totalSteps, stepTitles }) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* Points & lignes */}
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <View
                style={[
                  styles.circle,
                  isCurrent && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                  isCompleted && { backgroundColor: colors.status.success, borderColor: colors.status.success },
                ]}
              >
                {isCompleted ? (
                  <Check size={13} color={colors.text.inverse} strokeWidth={3} />
                ) : (
                  <AppText variant="caption" color={isCurrent ? colors.text.inverse : colors.text.subtle}>
                    {stepNumber}
                  </AppText>
                )}
              </View>

              {idx < totalSteps - 1 && (
                <View style={[styles.line, stepNumber < currentStep && { backgroundColor: colors.status.success }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Titre étape */}
      <View style={styles.titleBox}>
        <AppText variant="caption" color={colors.text.subtle}>
          Étape {currentStep} sur {totalSteps}
        </AppText>
        <AppText variant="bodyStrong">{stepTitles[currentStep - 1] || ''}</AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: 6,
  },
  titleBox: {
    marginTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
});
