import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { colors, typography } from '../tokens';

/**
 * <AppText> — Le SEUL composant texte à utiliser dans les écrans.
 *
 * Pourquoi : on ne tape plus jamais `fontSize` / `fontFamily` / `color` à la main.
 * Chaque variante pointe vers l'échelle typographique (`typography.*`) et un token
 * couleur. On ne passe JAMAIS `fontWeight` en plus de la famille Inter pondérée
 * (Inter_700Bold…) : le double réglage provoque un faux-gras incohérent sur Android.
 *
 * Usage :
 *   <AppText variant="h1">Titre</AppText>
 *   <AppText variant="body" muted>Sous-texte</AppText>
 *   <AppText variant="label" color={colors.primary.DEFAULT}>Lien</AppText>
 */

export type TextVariant =
  | 'display' //   Chiffres/héros géants
  | 'h1' //        Titre d'écran
  | 'h2' //        Gros titre de section
  | 'title' //     Titre de carte / section
  | 'subtitle' //  Sous-titre
  | 'body' //      Corps de texte
  | 'bodyStrong' //Corps mis en avant
  | 'caption' //   Légende / méta
  | 'label' //     Libellé de champ / petit lien fort
  | 'overline'; // Sur-titre capitales espacées

interface VariantSpec {
  size: number;
  lineHeight: number;
  family: string;
  color: string;
  letterSpacing?: number;
  uppercase?: boolean;
}

const VARIANTS: Record<TextVariant, VariantSpec> = {
  display: {
    size: typography.sizes['4xl'],
    lineHeight: typography.lineHeights['4xl'],
    family: typography.families.black,
    color: colors.text.DEFAULT,
    letterSpacing: -0.5,
  },
  h1: {
    size: typography.sizes['3xl'],
    lineHeight: typography.lineHeights['3xl'],
    family: typography.families.extrabold,
    color: colors.text.DEFAULT,
    letterSpacing: -0.4,
  },
  h2: {
    size: typography.sizes['2xl'],
    lineHeight: typography.lineHeights['2xl'],
    family: typography.families.extrabold,
    color: colors.text.DEFAULT,
    letterSpacing: -0.3,
  },
  title: {
    size: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
    family: typography.families.bold,
    color: colors.text.DEFAULT,
    letterSpacing: -0.2,
  },
  subtitle: {
    size: typography.sizes.base,
    lineHeight: typography.lineHeights.base,
    family: typography.families.semibold,
    color: colors.text.body,
    letterSpacing: -0.1,
  },
  body: {
    size: typography.sizes.sm,
    lineHeight: typography.lineHeights.base,
    family: typography.families.normal,
    color: colors.text.body,
  },
  bodyStrong: {
    size: typography.sizes.sm,
    lineHeight: typography.lineHeights.base,
    family: typography.families.semibold,
    color: colors.text.DEFAULT,
  },
  caption: {
    size: typography.sizes.xs,
    lineHeight: typography.lineHeights.sm,
    family: typography.families.normal,
    color: colors.text.muted,
  },
  label: {
    size: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    family: typography.families.bold,
    color: colors.text.DEFAULT,
    letterSpacing: 0.1,
  },
  overline: {
    size: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
    family: typography.families.bold,
    color: colors.text.muted,
    letterSpacing: 0.6,
    uppercase: true,
  },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /** Surcharge de couleur (token de préférence, ex: colors.primary.DEFAULT). */
  color?: string;
  /** Raccourci pour la couleur secondaire (colors.text.muted). */
  muted?: boolean;
  /** Centre le texte. */
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  muted = false,
  center = false,
  style,
  children,
  ...rest
}) => {
  const spec = VARIANTS[variant];

  const resolved: TextStyle = {
    fontSize: spec.size,
    lineHeight: spec.lineHeight,
    fontFamily: spec.family,
    color: color ?? (muted ? colors.text.muted : spec.color),
    letterSpacing: spec.letterSpacing,
    textAlign: center ? 'center' : undefined,
    textTransform: spec.uppercase ? 'uppercase' : undefined,
  };

  return (
    <Text style={[resolved, style]} {...rest}>
      {children}
    </Text>
  );
};
