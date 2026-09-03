import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ShieldCheck, Copy, Check } from 'lucide-react-native';
import { colors, radii, typography } from '../tokens';
import { Haptics } from '@daloa/utils';

export interface OtpPinDisplayProps {
  code: string;
  type: 'pickup' | 'delivery';
  label?: string;
  sublabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const OtpPinDisplay: React.FC<OtpPinDisplayProps> = ({
  code,
  type,
  label,
  sublabel,
  style,
}) => {
  const [copied, setCopied] = useState(false);

  const isPickup = type === 'pickup';
  const themeColor = isPickup ? colors.primary.DEFAULT : colors.secondary.DEFAULT;
  const themeBg = isPickup ? colors.primary[50] : colors.secondary[50];
  const themeBorder = isPickup ? colors.primary[100] : colors.secondary[100];

  const defaultLabel = isPickup
    ? 'Code Secret Vendeur (Pickup OTP)'
    : 'Code Secret Acheteur (Delivery OTP)';

  const defaultSublabel = isPickup
    ? 'Communiquez ce code au livreur UNIQUEMENT lorsqu’il prend en charge votre paquet.'
    : 'Communiquez ce code au livreur UNIQUEMENT lorsque vous avez reçu et vérifié votre commande.';

  const handleCopy = () => {
    Haptics.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg, borderColor: themeBorder }, style]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ShieldCheck size={16} color={themeColor} />
          <Text style={[styles.title, { color: themeColor }]}>
            {label || defaultLabel}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCopy}
          style={styles.copyBtn}
          activeOpacity={0.7}
        >
          {copied ? (
            <Check size={14} color="#059669" />
          ) : (
            <Copy size={14} color={colors.grey[600]} />
          )}
          <Text style={[styles.copyText, copied && { color: '#059669' }]}>
            {copied ? 'Copié' : 'Copier'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code Digits Display */}
      <View style={styles.codeContainer}>
        {code.split('').map((digit, idx) => (
          <View key={idx} style={[styles.digitBox, { borderColor: themeBorder }]}>
            <Text style={[styles.digitText, { color: '#111827' }]}>{digit}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sublabel}>{sublabel || defaultSublabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 12.5,
    fontFamily: typography.families.extrabold,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyText: {
    fontSize: 11,
    fontFamily: typography.families.bold,
    fontWeight: '700',
    color: colors.grey[700],
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
  digitBox: {
    width: 40,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  digitText: {
    fontSize: 22,
    fontFamily: typography.families.black,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sublabel: {
    fontSize: 11,
    fontFamily: typography.families.medium,
    fontWeight: '500',
    color: colors.grey[600],
    lineHeight: 15,
    marginTop: 6,
    textAlign: 'center',
  },
});
