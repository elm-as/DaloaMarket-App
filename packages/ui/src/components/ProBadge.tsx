import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors, radii, typography } from '../tokens';

export type ProBadgeVariant = 'seller' | 'deliverer';
export type ProBadgeTone = 'solid' | 'soft';
export type ProBadgeSize = 'xs' | 'sm' | 'md';

export interface ProBadgeProps {
  /** `seller` affiche « PRO », `deliverer` affiche « VÉRIFIÉ ». */
  variant?: ProBadgeVariant;
  /** `solid` = pastille bleue pleine avec dégradé ; `soft` = fond bleu doux et bordure fine. */
  tone?: ProBadgeTone;
  size?: ProBadgeSize;
  /** Masque le libellé et ne garde que le sceau vérifié — parfait pour les listes et avatars. */
  iconOnly?: boolean;
  /** Anneau blanc de détachement (recommandé sur photo d'avatar). */
  ring?: boolean;
  /** Libellé personnalisé optionnel. */
  label?: string;
  style?: ViewStyle;
}

/**
 * Dimensions des badges selon les tailles standards.
 */
const SIZES = {
  xs: { height: 18, padH: 7, gap: 3.5, font: 9, iconSize: 12, dotSize: 15 },
  sm: { height: 22, padH: 8.5, gap: 4, font: 10.5, iconSize: 14, dotSize: 18 },
  md: { height: 26, padH: 10.5, gap: 5, font: 11.5, iconSize: 16, dotSize: 22 },
} as const;

/**
 * Icône Sceau Vérifié SVG officielle — rosette solide à 8 lobes et coche blanche nette.
 */
export const VerifiedBadgeIcon: React.FC<{
  size?: number;
  ring?: boolean;
  tone?: ProBadgeTone;
  idSuffix?: string;
}> = ({ size = 16, ring = false, tone = 'solid', idSuffix = 'def' }) => {
  const gradId = `proBadgeGrad_${idSuffix}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3B82F6" />
          <Stop offset="55%" stopColor="#1D4ED8" />
          <Stop offset="100%" stopColor="#1E40AF" />
        </SvgLinearGradient>
      </Defs>

      {/* Anneau blanc de détachement optionnel */}
      {ring && (
        <Path
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3.8}
          strokeLinejoin="round"
        />
      )}

      {/* Corps du sceau vérifié */}
      <Path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill={tone === 'soft' ? '#1D4ED8' : `url(#${gradId})`}
      />

      {/* Coche blanche ciselée */}
      <Path
        d="m8.8 12.2 2.2 2.2 4.6-4.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * Badge Pro / Vérifié — Bleu institutionnel (`#1D4ED8`).
 * Garantit une identité unifiée entre livreurs et vendeurs certifiés.
 */
export const ProBadge: React.FC<ProBadgeProps> = ({
  variant = 'seller',
  tone = 'solid',
  size = 'md',
  iconOnly = false,
  ring = false,
  label,
  style,
}) => {
  const s = SIZES[size];
  const text = label ?? (variant === 'deliverer' ? 'VÉRIFIÉ' : 'PRO');
  const accessibilityLabel =
    variant === 'deliverer' ? 'Livreur vérifié par DaloaDelivery' : 'Vendeur Pro vérifié';

  if (iconOnly) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={[styles.iconWrapper, style]}
      >
        <VerifiedBadgeIcon
          size={s.dotSize}
          ring={ring}
          tone={tone}
          idSuffix={`icon_${size}_${variant}`}
        />
      </View>
    );
  }

  if (tone === 'soft') {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.pill,
          styles.softPill,
          {
            height: s.height,
            paddingHorizontal: s.padH,
            gap: s.gap,
          },
          style,
        ]}
      >
        <VerifiedBadgeIcon
          size={s.iconSize}
          tone="soft"
          idSuffix={`soft_${size}_${variant}`}
        />
        <Text style={[styles.softText, { fontSize: s.font }]}>{text}</Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.pill,
        styles.solidPill,
        {
          height: s.height,
          paddingHorizontal: s.padH,
          gap: s.gap,
        },
        style,
      ]}
    >
      <VerifiedBadgeIcon
        size={s.iconSize}
        tone="solid"
        idSuffix={`solid_${size}_${variant}`}
      />
      <Text style={[styles.solidText, { fontSize: s.font }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.full,
  },
  solidPill: {
    backgroundColor: '#1D4ED8',
    borderWidth: 1,
    borderColor: '#3B82F6',
    ...Platform.select({
      ios: {
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  solidText: {
    fontFamily: typography.families.black,
    color: '#FFFFFF',
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  softPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  softText: {
    fontFamily: typography.families.black,
    color: '#1D4ED8',
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default ProBadge;
