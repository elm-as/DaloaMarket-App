import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, useAccent } from '@daloa/ui';

interface CheckoutWizardBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = ['Réception', 'Adresse', 'Règlement'];

export const CheckoutWizardBar: React.FC<CheckoutWizardBarProps> = ({
  currentStep,
  totalSteps = 3,
}) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCurrent && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                    isCompleted && { backgroundColor: colors.status.success, borderColor: colors.status.success },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={12} color={colors.text.inverse} strokeWidth={3} />
                  ) : (
                    <AppText
                      variant="caption"
                      color={isCurrent ? colors.text.inverse : colors.text.subtle}
                      style={styles.stepNum}
                    >
                      {stepNumber}
                    </AppText>
                  )}
                </View>
                <AppText
                  variant="caption"
                  color={isCurrent ? accent[700] : isCompleted ? colors.status.successDark : colors.text.muted}
                  style={[styles.label, isCurrent && styles.boldLabel]}
                >
                  {STEP_LABELS[idx]}
                </AppText>
              </View>

              {idx < totalSteps - 1 && (
                <View
                  style={[
                    styles.line,
                    stepNumber < currentStep && { backgroundColor: colors.status.success },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
  },
  boldLabel: {
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing[2],
    marginBottom: 16,
  },
});
