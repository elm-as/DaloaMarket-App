import React from 'react';
import { View } from 'react-native';
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react-native';
import { colors, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { expressFormStyles as styles } from './expressForm.types';

interface StepPaymentProps {
  payerRole: 'sender' | 'recipient';
  onSelectPayer: (role: 'sender' | 'recipient') => void;
}

const PAYER_OPTIONS: Array<{
  role: 'sender' | 'recipient';
  title: string;
  subtitle: string;
}> = [
  { role: 'sender', title: 'Je paie au départ', subtitle: 'Au ramassage' },
  { role: 'recipient', title: 'Destinataire paie', subtitle: 'À la remise' },
];

export const ExpressStepPayment: React.FC<StepPaymentProps> = ({ payerRole, onSelectPayer }) => {
  const accent = useAccent();

  return (
    <View style={styles.card}>
      <AppText variant="bodyStrong">3. Qui paie la livraison ?</AppText>

      <View style={styles.payerRow}>
        {PAYER_OPTIONS.map(({ role, title, subtitle }) => {
          const active = payerRole === role;
          return (
            <AppPressable
              key={role}
              haptic="selection"
              onPress={() => onSelectPayer(role)}
              style={[
                styles.payerOption,
                active
                  ? { borderColor: accent.DEFAULT, backgroundColor: accent[50] ?? '#FFF7ED', borderWidth: 1.5 }
                  : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface, borderWidth: 1 },
              ]}
            >
              <View style={styles.payerHeader}>
                <AppText variant="caption" color={colors.text.DEFAULT} style={{ fontFamily: typography.families.bold }}>
                  {title}
                </AppText>
                {active ? (
                  <CheckCircle2 size={16} color={accent.DEFAULT} />
                ) : (
                  <Circle size={16} color={colors.text.subtle} />
                )}
              </View>
              <AppText variant="caption" color={colors.text.muted} style={{ fontSize: 11 }}>
                {subtitle}
              </AppText>
            </AppPressable>
          );
        })}
      </View>

      <View style={styles.securityNoteRow}>
        <ShieldCheck size={14} color={colors.status.successDark} />
        <AppText variant="caption" color={colors.text.muted} style={{ flex: 1, fontSize: 11 }}>
          Double code secret OTP généré (ramassage et réception).
        </AppText>
      </View>
    </View>
  );
};
