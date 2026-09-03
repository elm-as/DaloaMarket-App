import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { CreditCard, Banknote, Store, ShieldCheck, Truck, Check } from 'lucide-react-native';

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
  isCodAllowed?: boolean;
}

export function PaymentMethodSelector({
  deliveryMode,
  paymentMode,
  onPaymentModeChange,
  operator,
  onOperatorChange,
  isCodAllowed = true,
}: PaymentMethodSelectorProps) {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">Mode de règlement</AppText>

      <View style={styles.modesContainer}>
        {/* 1. Option COD (Paiement à la livraison) */}
        {deliveryMode === 'delivery' && isCodAllowed && (
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
                <View style={styles.badgeRow}>
                  <AppText variant="bodyStrong">Paiement à la livraison</AppText>
                  <View style={styles.recBadge}>
                    <AppText variant="overline" color={colors.status.successDark}>RECOMMANDÉ</AppText>
                  </View>
                </View>
                <AppText variant="caption" color={colors.text.muted} style={styles.descText}>
                  Espèces ou Mobile Money remis au livreur après contrôle du colis
                </AppText>
              </View>
              <View style={[styles.radioCircle, paymentMode === 'cod' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
                {paymentMode === 'cod' && <View style={styles.radioDot} />}
              </View>
            </View>
          </AppPressable>
        )}

        {/* 2. Option Espèces en magasin */}
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
                  Réglez directement chez le commerçant lors du retrait
                </AppText>
              </View>
              <View style={[styles.radioCircle, paymentMode === 'cash_at_shop' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
                {paymentMode === 'cash_at_shop' && <View style={styles.radioDot} />}
              </View>
            </View>
          </AppPressable>
        )}

        {/* 3. Option Mobile Money Sécurisé */}
        <AppPressable
          haptic="selection"
          onPress={() => onPaymentModeChange('online')}
          style={[styles.modeCard, paymentMode === 'online' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
              <CreditCard size={16} color={accent.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Paiement Mobile Money Sécurisé</AppText>
              <AppText variant="caption" color={colors.text.muted} style={styles.descText}>
                Fonds protégés sous séquestre jusqu'à validation OTP
              </AppText>
            </View>
            <View style={[styles.radioCircle, paymentMode === 'online' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
              {paymentMode === 'online' && <View style={styles.radioDot} />}
            </View>
          </View>

          {/* Grille des opérateurs */}
          {paymentMode === 'online' && (
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

      {/* Notice de réassurance */}
      <View style={styles.noticeCard}>
        {paymentMode === 'online' && (
          <View style={styles.noticeRow}>
            <ShieldCheck size={16} color={colors.status.successDark} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              <AppText variant="caption" style={styles.bold}>Protection Séquestre : </AppText>
              Votre argent reste bloqué sur un compte sécurisé et vous est remboursé à 100% en cas de problème.
            </AppText>
          </View>
        )}
        {paymentMode === 'cod' && (
          <View style={styles.noticeRow}>
            <Truck size={16} color={accent[700]} />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              <AppText variant="caption" style={styles.bold}>Paiement après contrôle : </AppText>
              Vous réglez en espèces ou Mobile Money directement au coursier après inspection de votre colis.
            </AppText>
          </View>
        )}
        {paymentMode === 'cash_at_shop' && (
          <View style={styles.noticeRow}>
            <Store size={16} color="#B45309" />
            <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
              <AppText variant="caption" style={styles.bold}>Remise directe : </AppText>
              Rendez-vous à la boutique du commerçant à Daloa pour tester l'article et régler sur place.
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[2] },
  modesContainer: { gap: spacing[2] },
  modeCard: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, borderWidth: 1.5, borderColor: colors.border.DEFAULT, padding: spacing[3], gap: spacing[2] },
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
  bold: { fontWeight: '700' },
  checkCircle: { width: 15, height: 15, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  noticeCard: { backgroundColor: colors.bg.surface, borderRadius: radii.lg, padding: spacing[3], borderWidth: 1, borderColor: colors.border.DEFAULT },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
