import React from 'react';
import { View, ScrollView, StyleSheet, TextInput, Switch } from 'react-native';
import {
  MapPin,
  ChevronDown,
  Package,
  FileText,
  UtensilsCrossed,
  ShoppingBag,
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Lock,
  AlertTriangle,
  UserCheck,
} from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { ExpressQuoteCard } from './ExpressQuoteCard';

export const PACKAGE_TYPES = [
  { id: 'envelope', label: 'Pli scellé / Doc', icon: FileText },
  { id: 'small_parcel', label: 'Petit colis (< 1kg)', icon: Package },
  { id: 'parcel', label: 'Colis standard (< 3kg)', icon: Boxes },
  { id: 'food', label: 'Repas / Alimentaire', icon: UtensilsCrossed },
  { id: 'bulky', label: 'Colis lourd (< 10kg)', icon: ShoppingBag },
];

export interface ExpressFormFieldsProps {
  currentStep: number;
  packageType: string;
  setPackageType: (type: string) => void;
  packageDescription: string;
  setPackageDescription: (desc: string) => void;
  isSealed: boolean;
  setIsSealed: (v: boolean) => void;
  isFragile: boolean;
  setIsFragile: (v: boolean) => void;
  isHandDelivery: boolean;
  setIsHandDelivery: (v: boolean) => void;
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
  distanceKm: number;
  deliveryFee: number;
  driverNetGain: number;
}

export const ExpressFormFields: React.FC<ExpressFormFieldsProps> = ({
  currentStep,
  packageType,
  setPackageType,
  packageDescription,
  setPackageDescription,
  isSealed,
  setIsSealed,
  isFragile,
  setIsFragile,
  isHandDelivery,
  setIsHandDelivery,
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
  distanceKm,
  deliveryFee,
  driverNetGain,
}) => {
  const accent = useAccent();

  if (currentStep === 1) {
    return (
      <View style={styles.stepContainer}>
        {/* En-tête de l'étape */}
        <AppText variant="h2" style={styles.stepHeaderTitle}>
          Que souhaitez-vous envoyer ?
        </AppText>
        <AppText variant="caption" color={colors.text.muted} style={styles.stepHeaderSubtitle}>
          Sélectionnez le format indicatif du colis.
        </AppText>

        {/* Bannière de confidentialité anti-vol */}
        <View style={[styles.antiTheftBanner, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <ShieldCheck size={18} color="#16A34A" />
          <View style={styles.antiTheftTexts}>
            <AppText variant="caption" color="#166534" style={styles.antiTheftTitle}>
              Confidentialité & Sécurité Anti-Vol
            </AppText>
            <AppText variant="caption" color="#15803D" style={styles.antiTheftSub}>
              Le livreur voit uniquement le format et les consignes. Ne mentionnez pas de marque ni de valeur marchande.
            </AppText>
          </View>
        </View>

        {/* Sélection du format du paquet */}
        <AppText variant="label" style={styles.inputLabel}>
          Format du paquet
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {PACKAGE_TYPES.map((pt) => {
            const selected = packageType === pt.id;
            const IconComponent = pt.icon;
            return (
              <AppPressable
                key={pt.id}
                haptic="selection"
                onPress={() => setPackageType(pt.id)}
                style={[
                  styles.typePill,
                  selected
                    ? { backgroundColor: accent[500], borderColor: accent[600] }
                    : { backgroundColor: colors.bg.surface, borderColor: colors.border.DEFAULT },
                ]}
              >
                <IconComponent size={15} color={selected ? colors.text.inverse : colors.text.body} />
                <AppText
                  variant="label"
                  numberOfLines={1}
                  color={selected ? colors.text.inverse : colors.text.body}
                >
                  {pt.label}
                </AppText>
              </AppPressable>
            );
          })}
        </ScrollView>

        {/* Options de précaution */}
        <AppText variant="label" style={styles.inputLabel}>
          Précautions de transport
        </AppText>
        <View style={styles.optionsCard}>
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Lock size={15} color={accent[700]} />
              <View>
                <AppText variant="bodyStrong">Emballage scellé / fermé</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Le coursier prend une photo du scellé au ramassage
                </AppText>
              </View>
            </View>
            <Switch
              value={isSealed}
              onValueChange={setIsSealed}
              trackColor={{ false: colors.border.DEFAULT, true: accent[500] }}
            />
          </View>

          <View style={styles.optionDivider} />

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <AlertTriangle size={15} color="#D97706" />
              <View>
                <AppText variant="bodyStrong">Contenu fragile</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Nécessite une manipulation délicate sur la moto
                </AppText>
              </View>
            </View>
            <Switch
              value={isFragile}
              onValueChange={setIsFragile}
              trackColor={{ false: colors.border.DEFAULT, true: accent[500] }}
            />
          </View>

          <View style={styles.optionDivider} />

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <UserCheck size={15} color="#2563EB" />
              <View>
                <AppText variant="bodyStrong">Remise en main propre</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Ne pas confier à un voisin ou gardien
                </AppText>
              </View>
            </View>
            <Switch
              value={isHandDelivery}
              onValueChange={setIsHandDelivery}
              trackColor={{ false: colors.border.DEFAULT, true: accent[500] }}
            />
          </View>
        </View>

        {/* Consignes pour le coursier */}
        <AppText variant="label" style={styles.inputLabel}>
          Consignes pratiques pour le coursier
        </AppText>
        <TextInput
          placeholder="Ex : Appeler 5 min avant, remettre au portail blanc..."
          placeholderTextColor={colors.text.subtle}
          value={packageDescription}
          onChangeText={setPackageDescription}
          style={styles.input}
        />
      </View>
    );
  }

  if (currentStep === 2) {
    return (
      <View style={styles.stepContainer}>
        {/* Étape 2 : Trajet */}
        <AppText variant="h2" style={styles.stepHeaderTitle}>
          Où et à qui livrer ?
        </AppText>
        <AppText variant="caption" color={colors.text.muted} style={styles.stepHeaderSubtitle}>
          Renseignez les quartiers et les numéros de contact.
        </AppText>

        {/* Ramassage */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <MapPin size={16} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Point de départ (Ramassage)</AppText>
          </View>

          <AppPressable onPress={onOpenPickupDistrictPicker} style={styles.districtSelector}>
            <AppText variant="bodyStrong">{pickupDistrict}</AppText>
            <ChevronDown size={16} color={colors.text.subtle} />
          </AppPressable>

          <TextInput
            placeholder="Repère précis (ex : Face grande mosquée, lavage...)"
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

        {/* Destination */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <MapPin size={16} color={colors.status.successDark} />
            <AppText variant="bodyStrong">Point d'arrivée (Destinataire)</AppText>
          </View>

          <AppPressable onPress={onOpenDropoffDistrictPicker} style={styles.districtSelector}>
            <AppText variant="bodyStrong">{dropoffDistrict}</AppText>
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
      </View>
    );
  }

  // Étape 3 : Règlement & Devis
  return (
    <View style={styles.stepContainer}>
      <AppText variant="h2" style={styles.stepHeaderTitle}>
        Règlement & Devis officiel
      </AppText>
      <AppText variant="caption" color={colors.text.muted} style={styles.stepHeaderSubtitle}>
        Choisissez qui paie la livraison au coursier.
      </AppText>

      {/* Qui règle la course */}
      <View style={styles.payerRow}>
        <AppPressable
          haptic="selection"
          onPress={() => setPayerRole('sender')}
          style={[
            styles.payerOption,
            payerRole === 'sender'
              ? { borderColor: accent.DEFAULT, backgroundColor: accent[50], borderWidth: 1.5 }
              : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface, borderWidth: 1 },
          ]}
        >
          <View style={styles.payerHeader}>
            <View style={[styles.payerIconCircle, { backgroundColor: payerRole === 'sender' ? accent[100] : colors.bg.subtle }]}>
              <ArrowUpRight size={14} color={payerRole === 'sender' ? accent[800] : colors.text.muted} />
            </View>
            {payerRole === 'sender' ? (
              <CheckCircle2 size={16} color={accent.DEFAULT} />
            ) : (
              <Circle size={16} color={colors.text.subtle} />
            )}
          </View>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT}>Expéditeur</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Payé au ramassage
          </AppText>
        </AppPressable>

        <AppPressable
          haptic="selection"
          onPress={() => setPayerRole('recipient')}
          style={[
            styles.payerOption,
            payerRole === 'recipient'
              ? { borderColor: accent.DEFAULT, backgroundColor: accent[50], borderWidth: 1.5 }
              : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface, borderWidth: 1 },
          ]}
        >
          <View style={styles.payerHeader}>
            <View style={[styles.payerIconCircle, { backgroundColor: payerRole === 'recipient' ? accent[100] : colors.bg.subtle }]}>
              <ArrowDownLeft size={14} color={payerRole === 'recipient' ? accent[800] : colors.text.muted} />
            </View>
            {payerRole === 'recipient' ? (
              <CheckCircle2 size={16} color={accent.DEFAULT} />
            ) : (
              <Circle size={16} color={colors.text.subtle} />
            )}
          </View>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT}>Destinataire</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Payé à la réception
          </AppText>
        </AppPressable>
      </View>

      {/* Carte devis kilométrique anti-débordement */}
      <ExpressQuoteCard
        distanceKm={distanceKm}
        deliveryFee={deliveryFee}
        driverNetGain={driverNetGain}
        pickupDistrict={pickupDistrict}
        dropoffDistrict={dropoffDistrict}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    gap: spacing[2],
  },
  stepHeaderTitle: {
    fontFamily: typography.families.extrabold,
    fontSize: 20,
    lineHeight: 26,
  },
  stepHeaderSubtitle: {
    marginBottom: spacing[2],
  },
  inputLabel: {
    marginTop: spacing[2],
    marginBottom: 4,
  },
  antiTheftBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  antiTheftTexts: {
    flex: 1,
    gap: 2,
  },
  antiTheftTitle: {
    fontFamily: typography.families.bold,
    fontSize: 12,
  },
  antiTheftSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  pillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  optionsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginVertical: spacing[1],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 4,
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
  sectionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: colors.bg.subtle,
    marginBottom: spacing[2],
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
  },
  payerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  payerIconCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
