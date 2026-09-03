import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ShieldCheck, ScanLine } from 'lucide-react-native';
import { colors, radii, typography } from '../tokens';

export interface DeliveryCodeCardProps {
  /** Code secret OTP (4 chiffres). */
  code: string;
  /** pickup = vendeur (orange), delivery = acheteur (bleu). */
  type: 'pickup' | 'delivery';
  /** Identifiant de la commande/course (pour le contenu du QR). */
  orderRef?: string;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Carte de remise/livraison moderne : grand QR code scannable par le livreur
 * + code PIN 4 chiffres en fallback. 100% Expo Go (QR généré en SVG natif).
 * Le QR encode une chaîne courte : `daloa:<type>:<orderRef>:<code>`.
 */
export const DeliveryCodeCard: React.FC<DeliveryCodeCardProps> = ({
  code,
  type,
  orderRef = '',
  title,
  subtitle,
  style,
}) => {
  const isPickup = type === 'pickup';
  const accent = isPickup ? colors.primary.DEFAULT : colors.secondary.DEFAULT;
  const accentDark = isPickup ? colors.primary[700] : colors.secondary[700];
  const accentSoft = isPickup ? colors.primary[50] : colors.secondary[50];
  const accentBorder = isPickup ? colors.primary[100] : colors.secondary[100];

  const qrValue = `daloa:${type}:${orderRef}:${code}`;
  const heading =
    title || (isPickup ? 'Code de Ramassage' : 'Code de Livraison');
  const sub =
    subtitle ||
    (isPickup
      ? 'Le livreur scanne ce QR code pour confirmer la prise en charge du colis.'
      : 'Le livreur scanne ce QR code pour confirmer la remise de votre commande.');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: accentSoft, borderColor: accentBorder },
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: accent }]}>
          <ShieldCheck size={15} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: accentDark }]}>{heading}</Text>
          <Text style={styles.subheading} numberOfLines={2}>
            {sub}
          </Text>
        </View>
      </View>

      {/* QR Code (bloc blanc arrondi) */}
      <View style={styles.qrWrapper}>
        <View style={styles.qrBox}>
          <QRCode
            value={qrValue}
            size={170}
            color="#111827"
            backgroundColor="#FFFFFF"
            ecl="M"
          />
        </View>
        <View style={[styles.scanHint, { borderColor: accentBorder }]}>
          <ScanLine size={13} color={accent} />
          <Text style={[styles.scanHintText, { color: accentDark }]}>
            À présenter au livreur
          </Text>
        </View>
      </View>

      {/* Fallback PIN */}
      <View style={styles.pinRow}>
        <Text style={styles.pinLabel}>Code manuel</Text>
        <View style={styles.pinDigits}>
          {code.split('').map((d, i) => (
            <View
              key={i}
              style={[styles.pinBox, { backgroundColor: '#FFFFFF', borderColor: accentBorder }]}
            >
              <Text style={styles.pinDigit}>{d}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 14.5,
    fontFamily: typography.families.black,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 11.5,
    fontFamily: typography.families.medium,
    fontWeight: '500',
    color: colors.grey[600],
    lineHeight: 16,
    marginTop: 1,
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  scanHintText: {
    fontSize: 11.5,
    fontFamily: typography.families.extrabold,
    fontWeight: '800',
  },
  pinRow: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  pinLabel: {
    fontSize: 10.5,
    fontFamily: typography.families.bold,
    fontWeight: '700',
    color: colors.grey[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pinDigits: {
    flexDirection: 'row',
    gap: 8,
  },
  pinBox: {
    width: 42,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigit: {
    fontSize: 22,
    fontFamily: typography.families.black,
    fontWeight: '900',
    color: '#111827',
  },
});
