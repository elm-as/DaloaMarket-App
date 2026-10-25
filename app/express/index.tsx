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
import { ExpressSuccessView } from '../../src/components/express/ExpressSuccessView';
import { ExpressFormFields, PACKAGE_TYPES } from '../../src/components/express/ExpressFormFields';
import { ExpressWizardStepper } from '../../src/components/express/ExpressWizardStepper';
import { DistrictPickerModal } from '../../src/components/express/DistrictPickerModal';

export default function ExpressDeliveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Étape courante du Wizard
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Étape 1 : Colis & Confidentialité anti-vol
  const [packageType, setPackageType] = useState('parcel');
  const [packageDescription, setPackageDescription] = useState('');
  const [isSealed, setIsSealed] = useState(true);
  const [isFragile, setIsFragile] = useState(false);
  const [isHandDelivery, setIsHandDelivery] = useState(true);

  // Étape 2 : Trajet & Contacts
  const [pickupDistrict, setPickupDistrict] = useState(user?.district || 'Commerce');
  const [pickupAddress, setPickupAddress] = useState('');
  const [senderName, setSenderName] = useState(user?.full_name || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');

  const [dropoffDistrict, setDropoffDistrict] = useState('Lobia');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Étape 3 : Règlement
  const [payerRole, setPayerRole] = useState<'sender' | 'recipient'>('sender');

  // Sélecteur quartier modal
  const [districtPickerTarget, setDistrictPickerTarget] = useState<'pickup' | 'dropoff' | null>(null);

  // État soumission & résultat
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRun, setCreatedRun] = useState<ExpressDeliveryResult | null>(null);

  // Devis kilométrique officiel
  const quote = useMemo(() => {
    return expressDeliveryService.estimateExpressDelivery({
      pickupDistrict,
      dropoffDistrict,
    });
  }, [pickupDistrict, dropoffDistrict]);

  const packageTypeLabel = useMemo(() => {
    return PACKAGE_TYPES.find((pt) => pt.id === packageType)?.label || 'Colis standard';
  }, [packageType]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      Haptics.selection();
      return;
    }

    if (currentStep === 2) {
      if (!senderPhone.trim()) {
        showAlert('Téléphone manquant', "Veuillez renseigner le téléphone de l'expéditeur.");
        return;
      }

      if (!recipientPhone.trim()) {
        showAlert('Destinataire manquant', 'Veuillez renseigner le numéro du destinataire.');
        return;
      }

      setCurrentStep(3);
      Haptics.selection();
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      Haptics.lightImpact();
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Connexion requise', 'Connectez-vous pour commander un coursier express.');
      router.push('/login' as any);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.mediumImpact();

      // Description discrète combinant les précautions sans valeur marchande
      const discreteDescription = [
        isSealed ? '[Scellé]' : null,
        isFragile ? '[Fragile]' : null,
        isHandDelivery ? '[En main propre]' : null,
        packageDescription.trim() || null,
      ]
        .filter(Boolean)
        .join(' ') || 'Colis scellé standard';

      const res = await expressDeliveryService.createExpressRun({
        pickupDistrict,
        pickupAddress: pickupAddress.trim() || 'Centre',
        dropoffDistrict,
        dropoffAddress: dropoffAddress.trim() || 'Centre',
        packageType,
        packageDescription: discreteDescription,
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
          recipientName={recipientName || 'Destinataire'}
          recipientPhone={recipientPhone}
          senderName={senderName || user?.full_name || 'Expéditeur'}
          packageDescription={packageDescription}
          packageTypeLabel={packageTypeLabel}
          payerRole={payerRole}
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
          onPress={handlePrevStep}
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color={colors.text.body} />
        </AppPressable>
        <View style={styles.headerTitleBox}>
          <AppText variant="title">Coursier Express</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Étape {currentStep} sur 3 · Livraison directe à Daloa
          </AppText>
        </View>
      </View>

      {/* Stepper bar */}
      <ExpressWizardStepper currentStep={currentStep} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8] }}
      >
        <ExpressFormFields
          currentStep={currentStep}
          packageType={packageType}
          setPackageType={setPackageType}
          packageDescription={packageDescription}
          setPackageDescription={setPackageDescription}
          isSealed={isSealed}
          setIsSealed={setIsSealed}
          isFragile={isFragile}
          setIsFragile={setIsFragile}
          isHandDelivery={isHandDelivery}
          setIsHandDelivery={setIsHandDelivery}
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
          distanceKm={quote.distanceKm}
          deliveryFee={quote.deliveryFee}
          driverNetGain={quote.driverNetGain}
        />

        {/* Boutons de navigation du Wizard */}
        <View style={styles.navRow}>
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="lg"
              title="Précédent"
              onPress={handlePrevStep}
              style={styles.prevBtn}
            />
          )}
          <Button
            variant="market"
            size="lg"
            title={currentStep === 3 ? 'Confirmer la course express' : 'Continuer'}
            onPress={currentStep === 3 ? handleSubmit : handleNextStep}
            loading={isSubmitting}
            style={styles.nextBtn}
          />
        </View>
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  prevBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
});

