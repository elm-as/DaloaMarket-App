import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  Button,
  showAlert,
} from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { ExpressDeliveryResult } from '@daloa/types';
import { expressDeliveryService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { ExpressQuoteCard } from '../../src/components/express/ExpressQuoteCard';
import { ExpressSuccessView } from '../../src/components/express/ExpressSuccessView';
import { ExpressFormFields } from '../../src/components/express/ExpressFormFields';
import { DistrictPickerModal } from '../../src/components/express/DistrictPickerModal';

export default function ExpressDeliveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // État formulaire
  const [pickupDistrict, setPickupDistrict] = useState(user?.district || 'Commerce');
  const [pickupAddress, setPickupAddress] = useState('');
  const [senderName, setSenderName] = useState(user?.full_name || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');

  const [dropoffDistrict, setDropoffDistrict] = useState('Lobia');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [packageType, setPackageType] = useState('parcel');
  const [packageDescription, setPackageDescription] = useState('');
  const [payerRole, setPayerRole] = useState<'sender' | 'recipient'>('sender');

  // Sélecteur quartier modal
  const [districtPickerTarget, setDistrictPickerTarget] = useState<'pickup' | 'dropoff' | null>(null);

  // État soumission & résultat
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRun, setCreatedRun] = useState<ExpressDeliveryResult | null>(null);

  // Devis calculé en direct
  const quote = useMemo(() => {
    return expressDeliveryService.estimateExpressDelivery({
      pickupDistrict,
      dropoffDistrict,
    });
  }, [pickupDistrict, dropoffDistrict]);

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Connexion requise', 'Connectez-vous pour commander un coursier express.');
      router.push('/login' as any);
      return;
    }

    if (!senderPhone.trim()) {
      showAlert('Téléphone manquant', "Veuillez renseigner le téléphone de l'expéditeur.");
      return;
    }

    if (!recipientPhone.trim()) {
      showAlert('Destinataire manquant', 'Veuillez renseigner le numéro du destinataire.');
      return;
    }

    if (!packageDescription.trim()) {
      showAlert('Description requise', 'Indiquez ce que contient votre colis.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.mediumImpact();

      const res = await expressDeliveryService.createExpressRun({
        pickupDistrict,
        pickupAddress: pickupAddress.trim() || 'Centre',
        dropoffDistrict,
        dropoffAddress: dropoffAddress.trim() || 'Centre',
        packageType,
        packageDescription: packageDescription.trim(),
        senderName: senderName.trim() || user.full_name || 'Expéditeur',
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim() || 'Destinataire',
        recipientPhone: recipientPhone.trim(),
        payerRole,
      });

      if (!res.success) {
        throw new Error(res.error || 'Erreur lors de la réservation.');
      }

      Haptics.success();
      setCreatedRun(res);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de réserver votre coursier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdRun) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[4] }}
      >
        <ExpressSuccessView
          orderId={createdRun.orderId!}
          assignmentId={createdRun.assignmentId}
          deliveryFee={createdRun.deliveryFee!}
          pickupOtp={createdRun.pickupOtp!}
          deliveryOtp={createdRun.deliveryOtp!}
          recipientName={recipientName}
          recipientPhone={recipientPhone}
          senderName={senderName}
          packageDescription={packageDescription}
          pickupDistrict={pickupDistrict}
          dropoffDistrict={dropoffDistrict}
        />
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppPressable
          haptic="light"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color={colors.text.body} />
        </AppPressable>
        <View style={styles.headerTitleBox}>
          <AppText variant="title">Coursier Express</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Envoi et livraison directe dans Daloa
          </AppText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing[3], paddingBottom: insets.bottom + spacing[6] }}
      >
        <ExpressFormFields
          packageType={packageType}
          setPackageType={setPackageType}
          packageDescription={packageDescription}
          setPackageDescription={setPackageDescription}
          pickupDistrict={pickupDistrict}
          onOpenPickupDistrictPicker={() => setDistrictPickerTarget('pickup')}
          pickupAddress={pickupAddress}
          setPickupAddress={setPickupAddress}
          senderPhone={senderPhone}
          setSenderPhone={setSenderPhone}
          dropoffDistrict={dropoffDistrict}
          onOpenDropoffDistrictPicker={() => setDistrictPickerTarget('dropoff')}
          dropoffAddress={dropoffAddress}
          setDropoffAddress={setDropoffAddress}
          recipientName={recipientName}
          setRecipientName={setRecipientName}
          recipientPhone={recipientPhone}
          setRecipientPhone={setRecipientPhone}
          payerRole={payerRole}
          setPayerRole={setPayerRole}
        />

        {/* Devis kilométrique instantané */}
        <ExpressQuoteCard
          distanceKm={quote.distanceKm}
          deliveryFee={quote.deliveryFee}
          driverNetGain={quote.driverNetGain}
          pickupDistrict={pickupDistrict}
          dropoffDistrict={dropoffDistrict}
        />

        {/* Bouton de commande */}
        <Button
          variant="market"
          size="lg"
          title="Commander mon coursier express"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </ScrollView>

      {/* Modal choix quartier */}
      <DistrictPickerModal
        visible={districtPickerTarget !== null}
        selectedDistrict={districtPickerTarget === 'pickup' ? pickupDistrict : dropoffDistrict}
        onSelect={(item) => {
          if (districtPickerTarget === 'pickup') setPickupDistrict(item);
          if (districtPickerTarget === 'dropoff') setDropoffDistrict(item);
          setDistrictPickerTarget(null);
        }}
        onClose={() => setDistrictPickerTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    padding: spacing[2],
    borderRadius: radii.full,
  },
  headerTitleBox: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
