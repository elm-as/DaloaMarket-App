import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { PRICING_CONFIG } from '@daloa/config';
import { formatFCFA } from '@daloa/utils';
import { CreditCard, Banknote, Store, Truck, Check } from 'lucide-react-native';

export type PaymentMode = 'online' | 'cod' | 'cash_at_shop';
export type MobileMoneyOperator = 'wave' | 'orange' | 'mtn' | 'moov';

interface OperatorOption {
  id: MobileMoneyOperator;
  name: string;
  source: any;
  color: string;
}

const OPERATORS: OperatorOption[] = [
  { id: 'wave', name: 'Wave', source: require('../../../assets/operators/wave.png'), color: '#1BA8E5' },
  { id: 'orange', name: 'Orange Money', source: require('../../../assets/operators/orange.png'), color: '#FF7900' },
  { id: 'mtn', name: 'MTN MoMo', source: require('../../../assets/operators/mtn.jpeg'), color: '#FFCC00' },
  { id: 'moov', name: 'Moov Money', source: require('../../../assets/operators/moov.png'), color: '#FF6600' },
];

interface PaymentMethodSelectorProps {
  deliveryMode: 'delivery' | 'pickup';
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  operator: MobileMoneyOperator;
  onOperatorChange: (op: MobileMoneyOperator) => void;
  estimatedOnlineFee?: number;
  isCodAllowed?: boolean;
  isCodBlocked?: boolean;
  codBlockedNotice?: string;
  onlineDisabled?: boolean;
  onlineNotice?: string;
}

/**
 * Sélecteur de mode de règlement mobile : affiche les frais en ligne à l'avance
 * directement sur chaque carte pour éviter toute hausse inattendue.
 */
export function PaymentMethodSelector({
  deliveryMode,
  paymentMode,
  onPaymentModeChange,
  operator,
  onOperatorChange,
  estimatedOnlineFee = 0,
  isCodAllowed = true,
  isCodBlocked = false,
  codBlockedNotice,
  onlineDisabled = false,
  onlineNotice,
}: PaymentMethodSelectorProps) {
  const accent = useAccent();
  const feePercent = Math.round(PRICING_CONFIG.marketplace.buyerServiceFeeRate * 100);
  const onlineFeeText =
    estimatedOnlineFee > 0
      ? `Frais en ligne : +${formatFCFA(estimatedOnlineFee)} (${feePercent} %)`
      : `Frais en ligne : ${feePercent} %`;

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">Mode de règlement</AppText>

      <View style={styles.modesContainer}>
        {deliveryMode === 'delivery' && (
          isCodBlocked ? (
            <View style={[styles.modeCard, styles.disabledModeCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Banknote size={16} color={colors.status.errorDark} />
                </View>
                <View style={styles.flex1}>
                  <View style={styles.badgeRow}>
                    <AppText variant="bodyStrong" color={colors.text.muted}>
                      Paiement à la livraison
                    </AppText>
                    <View style={[styles.recBadge, { backgroundColor: '#FEE2E2' }]}>
                      <AppText variant="overline" color={colors.status.errorDark}>SUSPENDU</AppText>
                    </View>
                  </View>
                  <AppText variant="caption" color={colors.status.errorDark} style={styles.descText}>
                    {codBlockedNotice || 'Option temporairement suspendue suite à des commandes non réceptionnées.'}
                  </AppText>
                </View>
              </View>
            </View>
          ) : isCodAllowed ? (
            <AppPressable
              haptic="selection"
              onPress={() => onPaymentModeChange('cod')}
              style={[styles.modeCard, paymentMode === 'cod' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.status.successLight }]}>
                  <Banknote size={16} color={colors.status.successDark} />
                </View>
                <View style={styles.flex1}>
                  <AppText variant="bodyStrong">Paiement à la livraison</AppText>
                  <AppText variant="caption" color={colors.text.muted} style={styles.descText}>
                    Espèces ou Mobile Money au livreur · 0 FCFA de frais en ligne
                  </AppText>
                </View>
                <View style={[styles.radioCircle, paymentMode === 'cod' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
                  {paymentMode === 'cod' && <View style={styles.radioDot} />}
                </View>
              </View>
            </AppPressable>
          ) : null
        )}

        {deliveryMode === 'pickup' && (
          <AppPressable
            haptic="selection"
            onPress={() => onPaymentModeChange('cash_at_shop')}
            style={[styles.modeCard, paymentMode === 'cash_at_shop' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Store size={16} color="#B45309" />
              </View>
              <View style={styles.flex1}>
                <AppText variant="bodyStrong">Espèces au magasin</AppText>
                <AppText variant="caption" color={colors.text.muted} style={styles.descText}>
                  Réglez chez le commerçant · 0 FCFA de frais en ligne
                </AppText>
              </View>
              <View style={[styles.radioCircle, paymentMode === 'cash_at_shop' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
                {paymentMode === 'cash_at_shop' && <View style={styles.radioDot} />}
              </View>
            </View>
          </AppPressable>
        )}

        <AppPressable
          haptic={onlineDisabled ? 'none' : 'selection'}
          onPress={() => {
            if (!onlineDisabled) onPaymentModeChange('online');
          }}
          disabled={onlineDisabled}
          style={[
            styles.modeCard,
            paymentMode === 'online' && !onlineDisabled && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
            onlineDisabled && { opacity: 0.6, borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.subtle },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: onlineDisabled ? colors.bg.subtle : accent[50] }]}>
              <CreditCard size={16} color={onlineDisabled ? colors.text.muted : accent.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <View style={styles.badgeRow}>
                <AppText variant="bodyStrong" color={onlineDisabled ? colors.text.muted : colors.text.DEFAULT}>
                  Mobile Money en ligne
                </AppText>
                {onlineDisabled && (
                  <View style={[styles.recBadge, { backgroundColor: '#FEE2E2' }]}>
                    <AppText variant="overline" color="#B91C1C">INDISPONIBLE</AppText>
                  </View>
                )}
              </View>
              <AppText variant="caption" color={onlineDisabled ? colors.status.errorDark : colors.text.muted} style={styles.descText}>
                {onlineDisabled
                  ? (onlineNotice || 'Paiement en ligne temporairement suspendu')
                  : `Wave, Orange, MTN, Moov · ${onlineFeeText}`}
              </AppText>
            </View>
            <View
              style={[
                styles.radioCircle,
                paymentMode === 'online' && !onlineDisabled && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT },
                onlineDisabled && { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.subtle },
              ]}
            >
              {paymentMode === 'online' && !onlineDisabled && <View style={styles.radioDot} />}
            </View>
          </View>

          {paymentMode === 'online' && !onlineDisabled && (
            <View style={styles.operatorsGrid}>
              {OPERATORS.map((op) => {
                const isSelected = operator === op.id;
                return (
                  <AppPressable
                    key={op.id}
                    haptic="selection"
                    onPress={() => onOperatorChange(op.id)}
                    style={[styles.operatorCard, isSelected && { borderColor: op.color, backgroundColor: colors.bg.surface }]}
                  >
                    <Image source={op.source} style={styles.operatorLogo} resizeMode="contain" />
                    <AppText
                      variant="caption"
                      color={isSelected ? colors.text.body : colors.text.muted}
                      style={[styles.operatorName, isSelected && styles.bold]}
                      numberOfLines={1}
                    >
                      {op.name}
                    </AppText>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: op.color }]}>
                        <Check size={9} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </AppPressable>
                );
              })}
            </View>
          )}
        </AppPressable>
      </View>

      {paymentMode === 'cod' && (
        <View style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <Truck size={15} color={accent[700]} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              Réglez directement au livreur après vérification du colis.
            </AppText>
          </View>
        </View>
      )}

      {paymentMode === 'cash_at_shop' && (
        <View style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <Store size={15} color="#B45309" />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              Testez l&apos;article à la boutique à Daloa et réglez sur place.
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[2] },
  modesContainer: { gap: spacing[2] },
  modeCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1.5, borderColor: colors.border.DEFAULT, padding: spacing[3], gap: spacing[2] },
  disabledModeCard: { opacity: 0.85, borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.subtle },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  iconBox: { width: 32, height: 32, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  flex1: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  recBadge: { backgroundColor: colors.status.successLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radii.sm },
  descText: { marginTop: 2, lineHeight: 17 },
  radioCircle: { width: 20, height: 20, borderRadius: radii.full, borderWidth: 2, borderColor: colors.border.DEFAULT, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  radioDot: { width: 8, height: 8, borderRadius: radii.full, backgroundColor: '#FFF' },
  operatorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingTop: spacing[1], borderTopWidth: 1, borderTopColor: colors.border.subtle },
  operatorCard: { flex: 1, minWidth: '47%', flexDirection: 'row', alignItems: 'center', padding: spacing[2], backgroundColor: colors.bg.subtle, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border.DEFAULT, gap: 8 },
  operatorLogo: { width: 26, height: 26, borderRadius: radii.sm },
  operatorName: { flex: 1, fontSize: 12 },
  bold: { fontFamily: typography.families.bold },
  checkCircle: { width: 15, height: 15, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  noticeCard: { backgroundColor: colors.bg.surface, borderRadius: radii.lg, padding: spacing[3], borderWidth: 1, borderColor: colors.border.DEFAULT },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
