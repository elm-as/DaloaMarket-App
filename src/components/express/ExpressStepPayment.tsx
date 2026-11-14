import React from 'react';
import { View } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Circle } from 'lucide-react-native';
import { colors, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ExpressQuoteCard } from './ExpressQuoteCard';
import {
  expressFormStyles as styles,
  type ExpressFormState,
  type ExpressFormHandlers,
} from './expressForm.types';

interface StepPaymentProps {
  state: Pick<
    ExpressFormState,
    'payerRole' | 'distanceKm' | 'deliveryFee' | 'driverNetGain' | 'pickupDistrict' | 'dropoffDistrict'
  >;
  onSelectPayer: ExpressFormHandlers['setPayerRole'];
}

export const ExpressStepPayment: React.FC<StepPaymentProps> = ({ state, onSelectPayer }) => {
  const accent = useAccent();

  const payerOptions: Array<{
    role: 'sender' | 'recipient';
    title: string;
    subtitle: string;
    Icon: typeof ArrowUpRight;
  }> = [
    { role: 'sender', title: 'Expéditeur', subtitle: 'Payé au ramassage', Icon: ArrowUpRight },
    { role: 'recipient', title: 'Destinataire', subtitle: 'Payé à la réception', Icon: ArrowDownLeft },
  ];

  return (
    <View style={styles.stepContainer}>
      <AppText variant="h2" style={styles.stepHeaderTitle}>
        Règlement & Devis officiel
      </AppText>
      <AppText variant="caption" color={colors.text.muted} style={styles.stepHeaderSubtitle}>
        Choisissez qui paie la livraison au coursier.
      </AppText>

      <View style={styles.payerRow}>
        {payerOptions.map(({ role, title, subtitle, Icon }) => {
          const active = state.payerRole === role;
          return (
            <AppPressable
              key={role}
              haptic="selection"
              onPress={() => onSelectPayer(role)}
              style={[
                styles.payerOption,
                active
                  ? { borderColor: accent.DEFAULT, backgroundColor: accent[50], borderWidth: 1.5 }
                  : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface, borderWidth: 1 },
              ]}
            >
              <View style={styles.payerHeader}>
                <View
                  style={[
                    styles.payerIconCircle,
                    { backgroundColor: active ? accent[100] : colors.bg.subtle },
                  ]}
                >
                  <Icon size={14} color={active ? accent[800] : colors.text.muted} />
                </View>
                {active ? (
                  <CheckCircle2 size={16} color={accent.DEFAULT} />
                ) : (
                  <Circle size={16} color={colors.text.subtle} />
                )}
              </View>
              <AppText variant="bodyStrong" color={colors.text.DEFAULT}>{title}</AppText>
              <AppText variant="caption" color={colors.text.muted}>{subtitle}</AppText>
            </AppPressable>
          );
        })}
      </View>

      <ExpressQuoteCard
        distanceKm={state.distanceKm}
        deliveryFee={state.deliveryFee}
        driverNetGain={state.driverNetGain}
        pickupDistrict={state.pickupDistrict}
        dropoffDistrict={state.dropoffDistrict}
      />
    </View>
  );
};
