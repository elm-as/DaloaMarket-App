import React, { useState } from 'react';
import { View, StyleSheet, Clipboard, Share } from 'react-native';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  useAccent,
  typography,
  Button,
} from '../index';
import { Gift, Copy, Check, Share2, Sparkles } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';

export interface DaloaCashCardProps {
  balance: number;
  referralCode: string;
  shareMessage: string;
  shareUrl: string;
  onCodeCopied?: () => void;
  style?: any;
}

/**
 * Carte réutilisable de présentation du Daloa Cash & Code Parrainage (F10).
 *
 * Conforme ELMAS.md :
 * - Chiffres tabulaires sur les montants FCFA
 * - Typographie Inter via typography.families
 * - Zéro dépendance superflue
 */
export const DaloaCashCard: React.FC<DaloaCashCardProps> = ({
  balance,
  referralCode,
  shareMessage,
  shareUrl,
  onCodeCopied,
  style,
}) => {
  const accent = useAccent();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    Haptics.selection();
    onCodeCopied?.();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    Haptics.mediumImpact();
    try {
      await Share.share({
        message: shareMessage,
        url: shareUrl,
        title: '500 FCFA offerts sur DaloaMarket',
      });
    } catch {
      // Ignoré si annulé
    }
  };

  return (
    <View style={[styles.card, style]}>
      {/* En-tête : Solde disponible */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Gift size={20} color={colors.status.successDark} />
          </View>
          <View>
            <AppText variant="overline" color={colors.text.muted}>
              MON SOLDE DALOA CASH
            </AppText>
            <AppText variant="h2" color={colors.status.successDark} style={styles.balanceText}>
              {formatFCFA(balance)}
            </AppText>
          </View>
        </View>

        <View style={styles.badgePromo}>
          <Sparkles size={13} color={colors.status.warningDark} />
          <AppText variant="caption" color={colors.status.warningDark} style={styles.promoText}>
            500 F / ami
          </AppText>
        </View>
      </View>

      <AppText variant="caption" color={colors.text.muted} style={styles.explainText}>
        Crédits de réduction utilisables immédiatement sur vos frais de livraison à Daloa.
      </AppText>

      <View style={styles.divider} />

      {/* Code de parrainage partageable */}
      <View style={styles.codeSection}>
        <AppText variant="caption" color={colors.text.subtle} style={styles.codeLabel}>
          Votre code parrainage personnel
        </AppText>

        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <AppText variant="bodyStrong" style={styles.codeText}>
              {referralCode || 'DALOA'}
            </AppText>
          </View>

          <AppPressable
            onPress={handleCopy}
            style={[styles.copyButton, copied && styles.copyButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Copier le code de parrainage"
          >
            {copied ? (
              <>
                <Check size={16} color={colors.status.successDark} />
                <AppText variant="caption" color={colors.status.successDark} style={styles.copyLabel}>
                  Copié !
                </AppText>
              </>
            ) : (
              <>
                <Copy size={16} color={colors.text.body} />
                <AppText variant="caption" color={colors.text.body} style={styles.copyLabel}>
                  Copier
                </AppText>
              </>
            )}
          </AppPressable>
        </View>
      </View>

      {/* Bouton de partage WhatsApp / réseaux */}
      <Button
        title="Partager mon lien sur WhatsApp"
        variant="primary"
        size="md"
        onPress={handleShare}
        leftIcon={<Share2 size={16} color="#FFFFFF" />}
        style={styles.shareButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.status.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceText: {
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  badgePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.status.warningLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  promoText: {
    fontFamily: typography.families.semibold,
    fontVariant: ['tabular-nums'],
  },
  explainText: {
    marginTop: spacing[1],
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[3],
  },
  codeSection: {
    marginBottom: spacing[3],
  },
  codeLabel: {
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  codeBox: {
    flex: 1,
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontFamily: typography.families.bold,
    letterSpacing: 1.5,
    color: colors.text.DEFAULT,
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  copyButtonActive: {
    backgroundColor: colors.status.successLight,
    borderColor: colors.status.successDark,
  },
  copyLabel: {
    fontFamily: typography.families.semibold,
  },
  shareButton: {
    marginTop: 2,
  },
});
