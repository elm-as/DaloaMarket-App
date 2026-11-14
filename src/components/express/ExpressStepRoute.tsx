import React from 'react';
import { View, TextInput } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { colors, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  expressFormStyles as styles,
  type ExpressFormState,
  type ExpressFormHandlers,
} from './expressForm.types';

interface StepRouteProps {
  state: Pick<
    ExpressFormState,
    'pickupDistrict' | 'pickupAddress' | 'senderPhone' | 'dropoffDistrict' | 'dropoffAddress' | 'recipientName' | 'recipientPhone'
  >;
  handlers: Pick<
    ExpressFormHandlers,
    | 'onOpenPickupDistrictPicker'
    | 'setPickupAddress'
    | 'setSenderPhone'
    | 'onOpenDropoffDistrictPicker'
    | 'setDropoffAddress'
    | 'setRecipientName'
    | 'setRecipientPhone'
  >;
}

export const ExpressStepRoute: React.FC<StepRouteProps> = ({ state, handlers }) => {
  const accent = useAccent();

  return (
    <View style={styles.stepContainer}>
      <AppText variant="h2" style={styles.stepHeaderTitle}>
        Où et à qui livrer ?
      </AppText>
      <AppText variant="caption" color={colors.text.muted} style={styles.stepHeaderSubtitle}>
        Renseignez les quartiers et les numéros de contact.
      </AppText>

      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <MapPin size={16} color={accent.DEFAULT} />
          <AppText variant="bodyStrong">Point de départ (Ramassage)</AppText>
        </View>

        <AppPressable onPress={handlers.onOpenPickupDistrictPicker} style={styles.districtSelector}>
          <AppText variant="bodyStrong">{state.pickupDistrict}</AppText>
          <ChevronDown size={16} color={colors.text.subtle} />
        </AppPressable>

        <TextInput
          placeholder="Repère précis (ex : Face grande mosquée, lavage...)"
          placeholderTextColor={colors.text.subtle}
          value={state.pickupAddress}
          onChangeText={handlers.setPickupAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="Téléphone de l'expéditeur"
          placeholderTextColor={colors.text.subtle}
          value={state.senderPhone}
          onChangeText={handlers.setSenderPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <MapPin size={16} color={colors.status.successDark} />
          <AppText variant="bodyStrong">Point d'arrivée (Destinataire)</AppText>
        </View>

        <AppPressable onPress={handlers.onOpenDropoffDistrictPicker} style={styles.districtSelector}>
          <AppText variant="bodyStrong">{state.dropoffDistrict}</AppText>
          <ChevronDown size={16} color={colors.text.subtle} />
        </AppPressable>

        <TextInput
          placeholder="Repère précis (ex : Carrefour Tazibouo, cour verte...)"
          placeholderTextColor={colors.text.subtle}
          value={state.dropoffAddress}
          onChangeText={handlers.setDropoffAddress}
          style={styles.input}
        />
        <View style={styles.rowInputs}>
          <TextInput
            placeholder="Nom destinataire"
            placeholderTextColor={colors.text.subtle}
            value={state.recipientName}
            onChangeText={handlers.setRecipientName}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            placeholder="Téléphone destinataire"
            placeholderTextColor={colors.text.subtle}
            value={state.recipientPhone}
            onChangeText={handlers.setRecipientPhone}
            keyboardType="phone-pad"
            style={[styles.input, styles.halfInput]}
          />
        </View>
      </View>
    </View>
  );
};
