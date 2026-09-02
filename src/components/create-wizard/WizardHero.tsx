import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Tag, MapPin, Eye, Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';

const STEP_ICONS = [Camera, Tag, MapPin, Eye];
const STEP_SUBTITLES = [
  'Montrez votre article sous son meilleur jour',
  'Définissez la valeur de votre produit',
  'Où et comment récupérer l\'article',
  'Vérifiez avant de publier',
];

interface WizardHeroProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onBack: () => void;
}

export const WizardHero: React.FC<WizardHeroProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  const StepIcon = STEP_ICONS[currentStep - 1] ?? Camera;
  const subtitle = STEP_SUBTITLES[currentStep - 1] ?? '';
  const title = stepTitles[currentStep - 1] ?? '';
  const isFirst = currentStep === 1;

  return (
    <LinearGradient
      colors={[accent[400], accent[600], accent[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
    >
      {/* Ligne nav : bouton retour + badge étape */}
      <View style={styles.navRow}>
        <AppPressable
          haptic="selection"
          rippleBorderless
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel={isFirst ? 'Annuler' : 'Étape précédente'}
        >
          <ArrowLeft size={18} color={colors.text.inverse} strokeWidth={2.5} />
          <AppText variant="label" color={colors.text.inverse}>
            {isFirst ? 'Annuler' : 'Retour'}
          </AppText>
        </AppPressable>

        <View style={styles.stepBadge}>
          <AppText variant="overline" color={accent[100]}>
            {currentStep} / {totalSteps}
          </AppText>
        </View>
      </View>

      {/* Corps hero : icône + titre + sous-titre */}
      <View style={styles.heroBody}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <StepIcon size={22} color={colors.text.inverse} strokeWidth={1.8} />
        </View>

        <View style={styles.titles}>
          <AppText variant="overline" color={accent[100]} style={styles.overline}>
            ÉTAPE {currentStep}
          </AppText>
          <AppText variant="h2" color={colors.text.inverse} style={styles.stepTitle}>
            {title}
          </AppText>
          <AppText variant="caption" color={accent[50]} style={styles.stepSub} numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
      </View>

      {/* Barre de progression par segments */}
      <View style={styles.segmentsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <View
              key={stepNum}
              style={[
                styles.segment,
                isCompleted && styles.segmentDone,
                isCurrent && styles.segmentActive,
              ]}
            >
              {isCompleted && (
                <Check size={10} color={accent[700]} strokeWidth={3} />
              )}
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: spacing[3],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titles: {
    flex: 1,
    gap: 1,
  },
  overline: {
    letterSpacing: 1,
  },
  stepTitle: {
    lineHeight: 26,
  },
  stepSub: {
    marginTop: 1,
    opacity: 0.85,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    height: 8,
  },
  segmentDone: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    height: 8,
  },
});
