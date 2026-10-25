import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, useAccent, typography } from '@daloa/ui';

interface ExpressWizardStepperProps {
  currentStep: number; // 1, 2, ou 3
  steps?: string[];
}

export const ExpressWizardStepper: React.FC<ExpressWizardStepperProps> = ({
  currentStep,
  steps = ['Colis', 'Trajet', 'Règlement'],
}) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <React.Fragment key={`step-${stepNumber}`}>
              {/* Ligne de connexion */}
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor:
                        currentStep >= stepNumber ? accent.DEFAULT : colors.border.DEFAULT,
                    },
                  ]}
                />
              )}

              {/* Cercle étape */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && {
                      backgroundColor: colors.status.successDark,
                      borderColor: colors.status.successDark,
                    },
                    isActive && {
                      backgroundColor: accent.DEFAULT,
                      borderColor: accent.DEFAULT,
                      elevation: 2,
                    },
                    !isCompleted &&
                      !isActive && {
                        backgroundColor: colors.bg.surface,
                        borderColor: colors.border.DEFAULT,
                      },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={13} color={colors.text.inverse} strokeWidth={3} />
                  ) : (
                    <AppText
                      variant="caption"
                      color={isActive ? colors.text.inverse : colors.text.muted}
                      style={styles.stepNumText}
                    >
                      {stepNumber}
                    </AppText>
                  )}
                </View>
                <AppText
                  variant="caption"
                  color={isActive ? accent[900] : colors.text.muted}
                  style={[
                    styles.label,
                    isActive && { fontFamily: typography.families.bold },
                  ]}
                >
                  {label}
                </AppText>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: typography.families.bold,
  },
  label: {
    fontSize: 11,
  },
});
