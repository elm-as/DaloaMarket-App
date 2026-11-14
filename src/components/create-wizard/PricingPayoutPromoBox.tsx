import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { PRICING_CONFIG } from '@daloa/config';
import { colors, radii, spacing, typography, AppText, useAccent } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';

interface PricingPayoutPromoBoxProps {
  price: string;
  setPrice: (p: string) => void;
  originalPrice: string;
  setOriginalPrice: (p: string) => void;
  isProSeller?: boolean;
  sellerFeeOverride?: number | null;
}

/**
 * Saisie du prix avec simulateur en direct du gain net vendeur
 * et champ optionnel d'ancien prix barré.
 */
export const PricingPayoutPromoBox: React.FC<PricingPayoutPromoBoxProps> = ({
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  isProSeller = false,
  sellerFeeOverride = null,
}) => {
  const accent = useAccent();
  const numPrice = parseFloat(price) || 0;
  const numOriginal = originalPrice ? parseFloat(originalPrice) : null;
  const hasDiscount = numOriginal != null && numOriginal > numPrice && numPrice > 0;
  const discountPct =
    hasDiscount && numOriginal ? Math.round(((numOriginal - numPrice) / numOriginal) * 100) : 0;

  const defaultFeeRate = isProSeller
    ? PRICING_CONFIG.marketplace.proSellerFeeRate
    : PRICING_CONFIG.marketplace.standardSellerFeeRate;
  const sellerFeeRate = sellerFeeOverride != null ? sellerFeeOverride : defaultFeeRate;
  const sellerFee = numPrice >= 300 ? Math.round(numPrice * sellerFeeRate) : 0;
  const netPayout = numPrice >= 300 ? numPrice - sellerFee : 0;

  return (
    <>
      {/* ── Prix & Ce que vous touchez ── */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <AppText variant="label" color={colors.text.body}>Prix de vente (FCFA) *</AppText>
          <AppText variant="caption" color={colors.text.subtle}>Min. 300 FCFA</AppText>
        </View>
        <View
          style={[
            styles.priceInputWrapper,
            {
              borderColor: price
                ? numPrice < 300
                  ? colors.status.error
                  : accent[300]
                : colors.border.DEFAULT,
            },
          ]}
        >
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Ex: 25 000"
            placeholderTextColor={colors.text.subtle}
            style={styles.priceInput}
          />
          <AppText variant="bodyStrong" color={accent[600]}>FCFA</AppText>
        </View>

        {numPrice > 0 && numPrice < 300 && (
          <View
            style={[
              styles.pricePreview,
              {
                backgroundColor: colors.status.errorLight,
                borderColor: colors.status.errorBorder,
              },
            ]}
          >
            <AppText variant="caption" color={colors.status.errorDark}>
              ⚠️ Le montant minimum pour une annonce est de 300 FCFA.
            </AppText>
          </View>
        )}

        {numPrice >= 300 && (
          <View style={styles.payoutCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color="#065F46">Prix payé par l'acheteur</AppText>
              <AppText variant="bodyStrong" color="#065F46" style={styles.tabular}>
                {formatFCFA(numPrice)}
                {hasDiscount ? ` (-${discountPct}%)` : ''}
              </AppText>
            </View>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color="#047857">
                Commission DaloaMarket ({(sellerFeeRate * 100).toFixed(1).replace('.0', '')}%)
              </AppText>
              <AppText
                variant="caption"
                color={sellerFee > 0 ? colors.status.errorDark : '#047857'}
                style={styles.tabular}
              >
                {sellerFee > 0 ? `-${formatFCFA(sellerFee)}` : '0 FCFA (Offert)'}
              </AppText>
            </View>
            <View style={styles.payoutTotalRow}>
              <AppText variant="bodyStrong" color="#064E3B">💰 Ce que vous touchez</AppText>
              <AppText variant="title" color="#047857" style={styles.tabular}>
                {formatFCFA(netPayout)}
              </AppText>
            </View>
          </View>
        )}
      </View>

      {/* ── Ancien prix barré (optionnel) ── */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <AppText variant="label" color={colors.text.body}>
            Ancien prix barré{' '}
            <AppText variant="caption" color={colors.text.subtle}>(optionnel)</AppText>
          </AppText>
          {hasDiscount && (
            <AppText variant="caption" color={colors.status.errorDark} style={styles.tabular}>
              −{discountPct}%
            </AppText>
          )}
        </View>
        <View
          style={[
            styles.priceInputWrapper,
            { borderColor: originalPrice ? colors.status.warning : colors.border.DEFAULT },
          ]}
        >
          <TextInput
            value={originalPrice}
            onChangeText={setOriginalPrice}
            keyboardType="numeric"
            placeholder="Ancien prix barré (Ex: 35 000)"
            placeholderTextColor={colors.text.subtle}
            style={styles.priceInput}
          />
          <AppText variant="bodyStrong" color={colors.text.subtle}>FCFA</AppText>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    backgroundColor: colors.grey[50],
    paddingHorizontal: spacing[3],
    height: 52,
    gap: spacing[2],
  },
  priceInput: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontFamily: typography.families.bold,
    color: colors.text.DEFAULT,
    fontVariant: ['tabular-nums'],
  },
  pricePreview: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
    marginTop: -4,
  },
  payoutCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    gap: 6,
  },
  payoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    paddingTop: 6,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});

