import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Tag, Check, X } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable } from '@daloa/ui';
import { formatFCFA, Haptics } from '@daloa/utils';
import { supabase } from '@daloa/api';
import { PaymentMode } from './PaymentMethodSelector';

export interface AppliedMobilePromo {
  code: string;
  discountAmount: number;
  onlineOnly: boolean;
  minOrderAmount: number;
}

interface PromoCodeBoxProps {
  orderSubtotal: number;
  paymentMode: PaymentMode;
  appliedPromo: AppliedMobilePromo | null;
  onApplyPromo: (promo: AppliedMobilePromo | null) => void;
}

export const PromoCodeBox: React.FC<PromoCodeBoxProps> = ({
  orderSubtotal,
  paymentMode,
  appliedPromo,
  onApplyPromo,
}) => {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (appliedPromo?.onlineOnly && paymentMode !== 'online') {
      onApplyPromo(null);
      setErrorText('Code promo retiré : valable uniquement avec le paiement Mobile Money en ligne.');
    }
  }, [paymentMode, appliedPromo, onApplyPromo]);

  const handleValidate = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setValidating(true);
    setErrorText(null);
    Haptics.selection();
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc('validate_promo_code', {
        p_code: cleanCode,
        p_order_subtotal: orderSubtotal,
        p_payment_method: paymentMode,
      });

      if (!rpcErr && rpcRes) {
        if (!rpcRes.valid) {
          setErrorText(rpcRes.message || 'Code promo invalide.');
          return;
        }
        const discount = Math.min(orderSubtotal, Number(rpcRes.discount_amount || 0));
        Haptics.success();
        onApplyPromo({
          code: rpcRes.code || cleanCode,
          discountAmount: discount,
          onlineOnly: Boolean(rpcRes.online_only),
          minOrderAmount: Number(rpcRes.min_order_amount || 0),
        });
        return;
      }

      const { data: row, error: tableErr } = await (supabase.from('promo_codes' as any) as any)
        .select('*')
        .ilike('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (tableErr || !row) {
        setErrorText('Code promo introuvable ou expiré.');
        return;
      }

      if (row.online_only && paymentMode !== 'online') {
        setErrorText('Ce code promo est réservé au paiement Mobile Money en ligne.');
        return;
      }

      if (orderSubtotal < Number(row.min_order_amount || 0)) {
        setErrorText(`Commande minimum de ${formatFCFA(Number(row.min_order_amount))} requise.`);
        return;
      }

      const rawDiscount =
        row.discount_type === 'percent'
          ? Math.round((orderSubtotal * Number(row.discount_value)) / 100)
          : Number(row.discount_value);
      const cappedDiscount = row.max_discount_amount
        ? Math.min(rawDiscount, Number(row.max_discount_amount))
        : rawDiscount;
      const finalDiscount = Math.min(orderSubtotal, Math.max(0, cappedDiscount));

      Haptics.success();
      onApplyPromo({
        code: cleanCode,
        discountAmount: finalDiscount,
        onlineOnly: Boolean(row.online_only),
        minOrderAmount: Number(row.min_order_amount || 0),
      });
    } catch {
      setErrorText('Impossible de vérifier ce code promo.');
    } finally {
      setValidating(false);
    }
  };

  if (appliedPromo) {
    return (
      <View style={styles.appliedCard}>
        <View style={styles.appliedLeft}>
          <View style={styles.checkCircle}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color="#065F46">
              Code {appliedPromo.code} appliqué
            </AppText>
            <AppText variant="caption" color="#047857" style={styles.tabular}>
              Réduction immédiate de -{formatFCFA(appliedPromo.discountAmount)}
            </AppText>
          </View>
        </View>
        <AppPressable
          haptic="light"
          onPress={() => {
            onApplyPromo(null);
            setCode('');
          }}
          style={styles.removeBtn}
        >
          <X size={13} color={colors.text.muted} />
          <AppText variant="caption" color={colors.text.body} style={styles.removeBtnText}>
            Retirer
          </AppText>
        </AppPressable>
      </View>
    );
  }

  return (
    <View style={styles.inputBox}>
      <View style={styles.inputRow}>
        <View style={[styles.fieldWrap, errorText ? styles.fieldError : null]}>
          <Tag size={15} color={colors.text.subtle} />
          <TextInput
            value={code}
            onChangeText={(val) => {
              setCode(val.toUpperCase());
              if (errorText) setErrorText(null);
            }}
            placeholder="Code promo (ex: DALOA1000)"
            placeholderTextColor={colors.text.subtle}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={24}
            style={styles.input}
          />
        </View>
        <AppPressable
          haptic="selection"
          disabled={!code.trim() || validating}
          onPress={handleValidate}
          style={[styles.applyBtn, (!code.trim() || validating) && styles.applyBtnDisabled]}
        >
          {validating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppText variant="caption" color="#FFFFFF" style={styles.applyBtnText}>
              Appliquer
            </AppText>
          )}
        </AppPressable>
      </View>
      {errorText ? (
        <AppText variant="caption" color={colors.status.errorDark} style={styles.errorMsg}>
          {errorText}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  inputBox: { backgroundColor: colors.bg.surface, borderRadius: radii.xl, padding: spacing[3], borderWidth: 1, borderColor: colors.border.DEFAULT, gap: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  fieldWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.DEFAULT, paddingHorizontal: spacing[3] },
  fieldError: { borderColor: colors.status.error },
  input: { flex: 1, fontSize: 13, fontFamily: typography.families.bold, color: colors.text.DEFAULT, paddingVertical: 0 },
  applyBtn: { height: 42, paddingHorizontal: 14, borderRadius: radii.lg, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  applyBtnDisabled: { opacity: 0.4 },
  applyBtnText: { fontSize: 12, fontFamily: typography.families.extrabold },
  errorMsg: { fontSize: 11, fontFamily: typography.families.semibold },
  appliedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: radii.xl, padding: spacing[3], borderWidth: 1, borderColor: '#A7F3D0', gap: spacing[2] },
  appliedLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.lg, borderWidth: 1, borderColor: '#A7F3D0' },
  removeBtnText: { fontSize: 11, fontFamily: typography.families.bold },
  flex1: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});

