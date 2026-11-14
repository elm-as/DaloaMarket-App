import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MOBILE_WIZARD_STEPS = [
  { id: 1, label: 'Article' },
  { id: 2, label: 'Prix & Options' },
  { id: 3, label: 'Lieu & Publier' },
] as const;

interface ListingWizardHeaderProps {
  currentStep: number;
  isEditing: boolean;
  isDraftRestored: boolean;
  onBack: () => void;
  onSelectStep: (step: number) => void;
  onResetDraft: () => void;
}

export const ListingWizardHeader: React.FC<ListingWizardHeaderProps> = ({
  currentStep,
  isEditing,
  isDraftRestored,
  onBack,
  onSelectStep,
  onResetDraft,
}) => {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const totalSteps = MOBILE_WIZARD_STEPS.length;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing[2] }]}>
      <View style={styles.topRow}>
        <AppPressable
          haptic="light"
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color={colors.text.DEFAULT} />
        </AppPressable>

        <View style={styles.titleBlock}>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
            {isEditing ? "Modifier l'annonce" : 'Publier une annonce'}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            {MOBILE_WIZARD_STEPS[currentStep - 1]?.label}
          </AppText>
        </View>

        <View style={styles.stepBadge}>
          <AppText variant="caption" color={colors.text.DEFAULT} style={styles.stepBadgeText}>
            {currentStep}/{totalSteps}
          </AppText>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {MOBILE_WIZARD_STEPS.map((step) => {
          const active = step.id === currentStep;
          const completed = step.id < currentStep;
          return (
            <AppPressable
              key={step.id}
              haptic="selection"
              onPress={() => onSelectStep(step.id)}
              style={[
                styles.stepTab,
                active && { borderColor: accent.DEFAULT, backgroundColor: accent[50] ?? '#FFF7ED' },
                completed && { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
              ]}
            >
              {completed ? (
                <Check size={13} color="#059669" strokeWidth={2.8} />
              ) : (
                <AppText
                  variant="caption"
                  color={active ? accent.DEFAULT : colors.text.subtle}
                  style={styles.stepNum}
                >
                  {step.id}.
                </AppText>
              )}
              <AppText
                variant="caption"
                numberOfLines={1}
                color={active ? (accent[900] ?? colors.text.DEFAULT) : completed ? '#065F46' : colors.text.muted}
                style={active ? styles.stepLabelActive : styles.stepLabel}
              >
                {step.label}
              </AppText>
            </AppPressable>
          );
        })}
      </View>

      {isDraftRestored && !isEditing && (
        <View style={styles.draftBanner}>
          <AppText variant="caption" color="#92400E" style={styles.draftText} numberOfLines={1}>
            Brouillon repris automatiquement
          </AppText>
          <AppPressable haptic="light" onPress={onResetDraft} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText variant="caption" color="#B45309" style={styles.resetText}>
              Recommencer
            </AppText>
          </AppPressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  stepBadge: {
    backgroundColor: colors.bg.DEFAULT,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: spacing[1],
  },
  stepBadgeText: {
    fontSize: 12,
    fontFamily: typography.families.bold,
    fontVariant: ['tabular-nums'],
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  stepTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
  },
  stepNum: {
    fontSize: 11,
    fontFamily: typography.families.bold,
    fontVariant: ['tabular-nums'],
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: typography.families.semibold,
    flexShrink: 1,
  },
  stepLabelActive: {
    fontSize: 11,
    fontFamily: typography.families.bold,
    flexShrink: 1,
  },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  draftText: {
    flex: 1,
    fontSize: 12,
    fontFamily: typography.families.semibold,
  },
  resetText: {
    fontSize: 12,
    fontFamily: typography.families.bold,
    textDecorationLine: 'underline',
  },
});
