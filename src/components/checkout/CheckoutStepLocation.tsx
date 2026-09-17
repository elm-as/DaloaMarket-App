import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radii, spacing, Input, Button, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { MapPin, ChevronDown, Store, ArrowLeft, ArrowRight, Phone, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react-native';
import { DeliveryLocationMap } from './DeliveryLocationMap';
import { Haptics } from '@daloa/utils';

interface CheckoutStepLocationProps {
  deliveryMode: 'delivery' | 'pickup';
  deliveryDistrict: string;
  onOpenDistrictPicker: () => void;
  deliveryCoords: { latitude: number; longitude: number } | null;
  onDeliveryCoordsChange: (coords: { latitude: number; longitude: number }) => void;
  sellerCoords?: { latitude: number; longitude: number } | null;
  onDistanceChange: (dist: number) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (text: string) => void;
  buyerPhone: string;
  onBuyerPhoneChange: (phone: string) => void;
  shopName?: string | null;
  sellerDistrict?: string | null;
  onLocateGps?: () => void;
  isLocatingGps?: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function CheckoutStepLocation({
  deliveryMode,
  deliveryDistrict,
  onOpenDistrictPicker,
  deliveryCoords,
  onDeliveryCoordsChange,
  sellerCoords,
  onDistanceChange,
  deliveryAddress,
  onDeliveryAddressChange,
  buyerPhone,
  onBuyerPhoneChange,
  shopName,
  sellerDistrict,
  onLocateGps,
  isLocatingGps,
  onBack,
  onNext,
}: CheckoutStepLocationProps) {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {deliveryMode === 'delivery' ? (
        <>
          {/* Section Quartier */}
          <View style={styles.sectionCard}>
            <AppText variant="bodyStrong">Quartier de livraison à Daloa</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              Sélectionnez votre quartier de livraison à Daloa
            </AppText>

            <AppPressable
              haptic="selection"
              onPress={onOpenDistrictPicker}
              style={styles.districtBtn}
            >
              <View style={[styles.pinCircle, { backgroundColor: accent[50] }]}>
                <MapPin size={16} color={accent.DEFAULT} />
              </View>
              <AppText variant="bodyStrong" style={styles.flex1}>
                {deliveryDistrict || 'Sélectionner un quartier'}
              </AppText>
              <ChevronDown size={18} color={colors.text.subtle} />
            </AppPressable>
          </View>

          {/* Statut GPS obligatoire pour la livraison */}
          <View style={[styles.gpsStatusCard, deliveryCoords ? styles.gpsCardSuccess : styles.gpsCardAlert]}>
            <View style={[styles.gpsIconCircle, { backgroundColor: deliveryCoords ? colors.status.successLight : '#FEE2E2' }]}>
              {deliveryCoords ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : (
                <AlertTriangle size={18} color="#DC2626" />
              )}
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong" color={deliveryCoords ? '#065F46' : '#991B1B'}>
                {deliveryCoords ? 'Position GPS verrouillée' : 'GPS obligatoire pour la livraison'}
              </AppText>
              <AppText variant="caption" color={deliveryCoords ? '#047857' : '#B91C1C'} style={{ marginTop: 2 }}>
                {deliveryCoords
                  ? `Coordonnées : ${deliveryCoords.latitude.toFixed(4)}, ${deliveryCoords.longitude.toFixed(4)}`
                  : 'Activez votre GPS pour que le livreur reçoive votre position exacte.'}
              </AppText>
            </View>
            {!deliveryCoords && onLocateGps && (
              <AppPressable
                haptic="selection"
                onPress={onLocateGps}
                disabled={isLocatingGps}
                style={[styles.activateGpsBtn, { backgroundColor: accent.DEFAULT }]}
              >
                {isLocatingGps ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Navigation size={13} color="#FFF" />
                    <AppText variant="caption" color="#FFF" style={styles.activateGpsText}>
                      Activer
                    </AppText>
                  </>
                )}
              </AppPressable>
            )}
          </View>

          {/* Carte interactive Leaflet */}
          <View style={styles.sectionCard}>
            <DeliveryLocationMap
              latitude={deliveryCoords?.latitude ?? null}
              longitude={deliveryCoords?.longitude ?? null}
              sellerCoords={sellerCoords}
              onChangeLocation={onDeliveryCoordsChange}
              onDistanceChange={onDistanceChange}
            />
          </View>

          {/* Précisions d'adresse */}
          <View style={styles.sectionCard}>
            <Input
              label="Précisions d'adresse & Repère *"
              placeholder="Ex: Près de la pharmacie, portail vert..."
              value={deliveryAddress}
              onChangeText={onDeliveryAddressChange}
              helperText="Indiquez un point de repère facilement identifiable par le coursier."
            />
          </View>
        </>
      ) : (
        /* Section Retrait en boutique */
        <View style={styles.sectionCard}>
          <View style={styles.pickupHeader}>
            <View style={[styles.pickupIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Store size={22} color="#B45309" />
            </View>
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Point de retrait en boutique</AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Votre article sera réservé et préparé chez le commerçant
              </AppText>
            </View>
          </View>

          <View style={styles.pickupDetails}>
            <View style={styles.pickupDetailRow}>
              <Store size={15} color={colors.text.muted} />
              <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
                Commerce : <AppText variant="caption" style={styles.boldText}>{shopName || 'Boutique Daloa'}</AppText>
              </AppText>
            </View>
            <View style={styles.pickupDetailRow}>
              <MapPin size={15} color={colors.text.muted} />
              <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
                Quartier : <AppText variant="caption" style={styles.boldText}>{sellerDistrict || 'Daloa Centre'}</AppText>
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Numéro de contact */}
      <View style={styles.sectionCard}>
        <Input
          label="Numéro de contact (Mobile Money) *"
          placeholder="Ex: 07 00 00 00 00"
          value={buyerPhone}
          onChangeText={onBuyerPhoneChange}
          keyboardType="phone-pad"
          helperText="Nécessaire pour que le livreur ou le vendeur puisse vous contacter."
        />
      </View>

      {/* Boutons de navigation */}
      <View style={styles.navRow}>
        <Button
          title="Retour"
          variant="outline"
          size="lg"
          leftIcon={<ArrowLeft size={16} color={colors.text.body} />}
          onPress={() => {
            Haptics.lightImpact();
            onBack();
          }}
          style={styles.backBtn}
        />
        <Button
          title="Vers le règlement"
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight size={16} color={colors.text.inverse} />}
          onPress={() => {
            Haptics.lightImpact();
            onNext();
          }}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  sectionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: spacing[2],
  },
  districtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    gap: spacing[2],
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  pickupIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDetails: {
    backgroundColor: colors.bg.subtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    gap: 8,
    marginTop: 4,
  },
  pickupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boldText: {
    fontFamily: typography.families.bold,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  backBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
  flex1: {
    flex: 1,
  },
  gpsStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    gap: spacing[3],
  },
  gpsCardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  gpsCardAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
  },
  activateGpsText: {
    fontFamily: typography.families.extrabold,
  },
});
