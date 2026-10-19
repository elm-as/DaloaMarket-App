import React from 'react';
import { View, ScrollView, StyleSheet, TextInput } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';

export const PACKAGE_TYPES = [
  { id: 'parcel', label: 'Colis standard' },
  { id: 'envelope', label: 'Pli / Document' },
  { id: 'food', label: 'Repas / Nourriture' },
  { id: 'merchandise', label: 'Marchandise' },
  { id: 'other', label: 'Autre' },
];

export interface ExpressFormFieldsProps {
  packageType: string;
  setPackageType: (type: string) => void;
  packageDescription: string;
  setPackageDescription: (desc: string) => void;
  pickupDistrict: string;
  onOpenPickupDistrictPicker: () => void;
  pickupAddress: string;
  setPickupAddress: (address: string) => void;
  senderPhone: string;
  setSenderPhone: (phone: string) => void;
  dropoffDistrict: string;
  onOpenDropoffDistrictPicker: () => void;
  dropoffAddress: string;
  setDropoffAddress: (address: string) => void;
  recipientName: string;
  setRecipientName: (name: string) => void;
  recipientPhone: string;
  setRecipientPhone: (phone: string) => void;
  payerRole: 'sender' | 'recipient';
  setPayerRole: (role: 'sender' | 'recipient') => void;
}

export const ExpressFormFields: React.FC<ExpressFormFieldsProps> = ({
  packageType,
  setPackageType,
  packageDescription,
  setPackageDescription,
  pickupDistrict,
  onOpenPickupDistrictPicker,
  pickupAddress,
  setPickupAddress,
  senderPhone,
  setSenderPhone,
  dropoffDistrict,
  onOpenDropoffDistrictPicker,
  dropoffAddress,
  setDropoffAddress,
  recipientName,
  setRecipientName,
  recipientPhone,
  setRecipientPhone,
  payerRole,
  setPayerRole,
}) => {
  const accent = useAccent();

  return (
    <>
      {/* 1. Nature du colis */}
      <View style={styles.section}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          1. Que souhaitez-vous envoyer ?
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {PACKAGE_TYPES.map((pt) => {
            const selected = packageType === pt.id;
            return (
              <AppPressable
                key={pt.id}
                onPress={() => setPackageType(pt.id)}
                style={[
                  styles.typePill,
                  selected && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                ]}
              >
                <AppText
                  variant="caption"
                  color={selected ? colors.text.inverse : colors.text.body}
                >
                  {pt.label}
                </AppText>
              </AppPressable>
            );
          })}
        </ScrollView>

        <TextInput
          placeholder="Ex : Pli de documents, sac de riz, gâteau, habits..."
          placeholderTextColor={colors.text.subtle}
          value={packageDescription}
          onChangeText={setPackageDescription}
          style={styles.input}
        />
      </View>

      {/* 2. Lieu de ramassage (Départ) */}
      <View style={styles.section}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          2. Point de départ (Ramassage)
        </AppText>
        <AppPressable
          onPress={onOpenPickupDistrictPicker}
          style={styles.districtSelector}
        >
          <View style={styles.districtLeft}>
            <MapPin size={16} color={accent.DEFAULT} />
            <AppText variant="body">{pickupDistrict}</AppText>
          </View>
          <ChevronDown size={16} color={colors.text.subtle} />
        </AppPressable>
        <TextInput
          placeholder="Repère précis (ex : Face grande mosquée, près du lavage...)"
          placeholderTextColor={colors.text.subtle}
          value={pickupAddress}
          onChangeText={setPickupAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="Téléphone de l'expéditeur"
          placeholderTextColor={colors.text.subtle}
          value={senderPhone}
          onChangeText={setSenderPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      {/* 3. Lieu de dépôt (Arrivée) */}
      <View style={styles.section}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          3. Point d'arrivée (Destinataire)
        </AppText>
        <AppPressable
          onPress={onOpenDropoffDistrictPicker}
          style={styles.districtSelector}
        >
          <View style={styles.districtLeft}>
            <MapPin size={16} color={colors.status.successDark} />
            <AppText variant="body">{dropoffDistrict}</AppText>
          </View>
          <ChevronDown size={16} color={colors.text.subtle} />
        </AppPressable>
        <TextInput
          placeholder="Repère précis (ex : Carrefour Tazibouo, cour verte...)"
          placeholderTextColor={colors.text.subtle}
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          style={styles.input}
        />
        <View style={styles.rowInputs}>
          <TextInput
            placeholder="Nom destinataire"
            placeholderTextColor={colors.text.subtle}
            value={recipientName}
            onChangeText={setRecipientName}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            placeholder="Téléphone destinataire"
            placeholderTextColor={colors.text.subtle}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
            style={[styles.input, styles.halfInput]}
          />
        </View>
      </View>

      {/* 4. Qui paie la course ? */}
      <View style={styles.section}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          4. Règlement de la course
        </AppText>
        <View style={styles.payerRow}>
          <AppPressable
            onPress={() => setPayerRole('sender')}
            style={[
              styles.payerOption,
              payerRole === 'sender' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
            ]}
          >
            <AppText variant="bodyStrong">Expéditeur</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              Payé au ramassage
            </AppText>
          </AppPressable>
          <AppPressable
            onPress={() => setPayerRole('recipient')}
            style={[
              styles.payerOption,
              payerRole === 'recipient' && { borderColor: accent.DEFAULT, backgroundColor: accent[50] },
            ]}
          >
            <AppText variant="bodyStrong">Destinataire</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              Payé à la réception
            </AppText>
          </AppPressable>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[2],
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  typePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginRight: spacing[2],
    backgroundColor: colors.bg.surface,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.surface,
    color: colors.text.body,
    fontSize: 14,
    marginBottom: spacing[2],
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.surface,
    marginBottom: spacing[2],
  },
  districtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  halfInput: {
    flex: 1,
  },
  payerRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  payerOption: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
});
