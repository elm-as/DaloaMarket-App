import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import {
  colors,
  radii,
  spacing,
  AppText,
  AppPressable,
  Button,
  showAlert,
  typography,
} from '@daloa/ui';
import { Haptics, formatFCFA } from '@daloa/utils';
import { ExpressDeliveryResult } from '@daloa/types';
import { expressDeliveryService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { ExpressSuccessView } from '../../src/components/express/ExpressSuccessView';
import { PACKAGE_TYPES } from '../../src/components/express/expressForm.types';
import { ExpressStepRoute } from '../../src/components/express/ExpressStepRoute';
import { ExpressStepPackage } from '../../src/components/express/ExpressStepPackage';
import { ExpressStepPayment } from '../../src/components/express/ExpressStepPayment';
import { DistrictPickerModal } from '../../src/components/express/DistrictPickerModal';

export default function ExpressDeliveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [packageType, setPackageType] = useState('parcel');
  const [packageDescription, setPackageDescription] = useState('');
  const [isSealed, setIsSealed] = useState(true);
  const [isFragile, setIsFragile] = useState(false);

  const [pickupDistrict, setPickupDistrict] = useState<string>(user?.district || 'Commerce');
  const [pickupAddress, setPickupAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState<string>(user?.phone || '');

  const [dropoffDistrict, setDropoffDistrict] = useState('Lobia');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [payerRole, setPayerRole] = useState<'sender' | 'recipient'>('sender');
  const [districtPickerTarget, setDistrictPickerTarget] = useState<'pickup' | 'dropoff' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRun, setCreatedRun] = useState<ExpressDeliveryResult | null>(null);

  useEffect(() => {
    if (user?.district) {
      setPickupDistrict((prev: string) => (prev === 'Commerce' ? user.district || prev : prev));
    }
    if (user?.phone) {
      setSenderPhone((prev: string) => (prev ? prev : user.phone || ''));
    }
  }, [user?.district, user?.phone]);

  const quote = useMemo(
    () => expressDeliveryService.estimateExpressDelivery({ pickupDistrict, dropoffDistrict }),
    [pickupDistrict, dropoffDistrict],
  );

  const packageTypeLabel = useMemo(
    () => PACKAGE_TYPES.find((pt) => pt.id === packageType)?.label || 'Colis standard',
    [packageType],
  );

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
      showAlert('Destinataire manquant', 'Veuillez renseigner le téléphone du destinataire.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.mediumImpact();

      const discreteDescription = [
        isSealed ? '[Scellé]' : null,
        isFragile ? '[Fragile]' : null,
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
        senderName: user.full_name || 'Expéditeur',
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim() || 'Destinataire',
        recipientPhone: recipientPhone.trim(),
        payerRole,
        paymentMethod: payerRole === 'recipient' ? 'cod' : 'cash',
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
          senderName={user?.full_name || 'Expéditeur'}
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
          <AppText variant="title">Coursier Express Daloa</AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Livraison directe entre quartiers
          </AppText>
        </View>
      </View>

      <View style={styles.liveQuoteBar}>
        <View style={styles.liveRouteRow}>
          <AppText variant="caption" color="#F8FAFC" numberOfLines={1} style={styles.routeLabel}>
            {pickupDistrict}
          </AppText>
          <ArrowRight size={13} color="#FB923C" />
          <AppText variant="caption" color="#F8FAFC" numberOfLines={1} style={styles.routeLabel}>
            {dropoffDistrict}
          </AppText>
          <AppText variant="caption" color="#94A3B8" style={styles.tabular}>
            · ~{quote.distanceKm} km
          </AppText>
        </View>
        <AppText variant="bodyStrong" color="#FB923C" style={styles.tabular}>
          {formatFCFA(quote.deliveryFee)}
        </AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing[3], gap: spacing[3], paddingBottom: spacing[6] }}
      >
        <ExpressStepRoute
          state={{
            pickupDistrict,
            pickupAddress,
            senderPhone,
            dropoffDistrict,
            dropoffAddress,
            recipientName,
            recipientPhone,
          }}
          handlers={{
            onOpenPickupDistrictPicker: () => setDistrictPickerTarget('pickup'),
            setPickupAddress,
            setSenderPhone,
            onOpenDropoffDistrictPicker: () => setDistrictPickerTarget('dropoff'),
            setDropoffAddress,
            setRecipientName,
            setRecipientPhone,
          }}
        />

        <ExpressStepPackage
          state={{ packageType, packageDescription, isSealed, isFragile }}
          handlers={{ setPackageType, setPackageDescription, setIsSealed, setIsFragile }}
        />

        <ExpressStepPayment payerRole={payerRole} onSelectPayer={setPayerRole} />
      </ScrollView>

      <View style={[styles.footerCta, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
        <Button
          variant="market"
          size="lg"
          title={`Commander un coursier · ${formatFCFA(quote.deliveryFee)}`}
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </View>

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
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backBtn: { padding: spacing[2], borderRadius: radii.full },
  headerTitleBox: { flex: 1 },
  liveQuoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
  },
  liveRouteRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeLabel: { fontFamily: typography.families.bold, flexShrink: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  scroll: { flex: 1 },
  footerCta: {
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2] + 2,
  },
});
