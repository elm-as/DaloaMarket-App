import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { colors, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';

interface CodDebtNoticeProps {
  count: number;
  total: number;
  /** Livreur : courses encaissées ; vendeur : ventes encaissées. */
  role: 'delivery' | 'seller';
  formatAmount: (n: number) => string;
}

const SUPPORT_WHATSAPP = 'https://wa.me/2250704163361';

/**
 * Commission à reverser à DaloaMarket sur ce qui a été encaissé en espèces
 * (paiement à la livraison). Rien ne l'indiquait : la dette existait en base
 * sans que le livreur ou le vendeur le sache.
 */
export const CodDebtNotice: React.FC<CodDebtNoticeProps> = ({ count, total, role, formatAmount }) => {
  if (count <= 0 || total <= 0) return null;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Wallet size={18} color={colors.status.warningDark} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong" color={colors.status.warningDark}>
            {formatAmount(total)} à reverser à DaloaMarket
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Commission sur {count} {role === 'delivery' ? 'course' : 'vente'}
            {count > 1 ? 's' : ''} encaissée{count > 1 ? 's' : ''} en espèces. Réglez-la par Mobile Money au service
            DaloaMarket (+225 07 04 16 33 61).
          </AppText>
        </View>
      </View>
      <AppPressable onPress={() => Linking.openURL(SUPPORT_WHATSAPP)} style={styles.link}>
        <AppText variant="label" color={colors.whatsappDark}>Contacter le service</AppText>
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.status.warningBorder,
    backgroundColor: colors.status.warningLight,
    borderRadius: radii.xl,
    padding: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  row: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  link: { alignSelf: 'flex-end' },
});
