import React from 'react';
import { View, TextInput } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { colors, AppText, AppPressable } from '@daloa/ui';
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

export const ExpressStepRoute: React.FC<StepRouteProps> = ({ state, handlers }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <MapPin size={16} color="#EA580C" />
      <AppText variant="bodyStrong">1. Trajet & contacts</AppText>
    </View>

    <View style={styles.subBlock}>
      <View style={styles.subTitleRow}>
        <View style={[styles.dot, { backgroundColor: '#EA580C' }]} />
        <AppText variant="label" color={colors.text.DEFAULT}>Départ (Ramassage)</AppText>
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Quartier de départ</AppText>
        <AppPressable onPress={handlers.onOpenPickupDistrictPicker} style={styles.districtSelector}>
          <AppText variant="bodyStrong">{state.pickupDistrict}</AppText>
          <ChevronDown size={16} color={colors.text.subtle} />
        </AppPressable>
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Repère exact (optionnel)</AppText>
        <TextInput
          placeholder="Ex : Face pharmacie, carrefour..."
          placeholderTextColor={colors.text.subtle}
          value={state.pickupAddress}
          onChangeText={handlers.setPickupAddress}
          style={styles.input}
        />
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Téléphone expéditeur *</AppText>
        <TextInput
          placeholder="Ex : 07 00 00 00 00"
          placeholderTextColor={colors.text.subtle}
          value={state.senderPhone}
          onChangeText={handlers.setSenderPhone}
          keyboardType="phone-pad"
          style={[styles.input, { fontVariant: ['tabular-nums'] }]}
        />
      </View>
    </View>

    <View style={styles.subBlock}>
      <View style={styles.subTitleRow}>
        <View style={[styles.dot, { backgroundColor: '#059669' }]} />
        <AppText variant="label" color={colors.text.DEFAULT}>Arrivée (Destinataire)</AppText>
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Quartier d&apos;arrivée</AppText>
        <AppPressable onPress={handlers.onOpenDropoffDistrictPicker} style={styles.districtSelector}>
          <AppText variant="bodyStrong">{state.dropoffDistrict}</AppText>
          <ChevronDown size={16} color={colors.text.subtle} />
        </AppPressable>
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Repère exact (optionnel)</AppText>
        <TextInput
          placeholder="Ex : Portail bleu, école..."
          placeholderTextColor={colors.text.subtle}
          value={state.dropoffAddress}
          onChangeText={handlers.setDropoffAddress}
          style={styles.input}
        />
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Téléphone destinataire *</AppText>
        <TextInput
          placeholder="Ex : 05 00 00 00 00"
          placeholderTextColor={colors.text.subtle}
          value={state.recipientPhone}
          onChangeText={handlers.setRecipientPhone}
          keyboardType="phone-pad"
          style={[styles.input, { fontVariant: ['tabular-nums'] }]}
        />
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>Nom du destinataire (optionnel)</AppText>
        <TextInput
          placeholder="Ex : Koffi Aya"
          placeholderTextColor={colors.text.subtle}
          value={state.recipientName}
          onChangeText={handlers.setRecipientName}
          style={styles.input}
        />
      </View>
    </View>
  </View>
);
