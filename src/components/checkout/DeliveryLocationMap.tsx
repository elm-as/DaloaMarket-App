import React, { useEffect, useState } from 'react';
import { LeafletMapView } from '../maps/LeafletMapView';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { DALOA_CENTER } from '@daloa/config';
import { MapPin, Navigation, LocateFixed } from 'lucide-react-native';
import { getDrivingRoute, DrivingRouteResult, Haptics, isLocationInDaloa, withTimeout, GPS_TIMEOUT_MS } from '@daloa/utils';

interface DeliveryLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  sellerCoords?: { latitude: number; longitude: number } | null;
  onChangeLocation: (coords: { latitude: number; longitude: number }) => void;
}

export const DeliveryLocationMap: React.FC<DeliveryLocationMapProps> = ({
  latitude,
  longitude,
  sellerCoords,
  onChangeLocation,
}) => {
  const accent = useAccent();
  const [isLocating, setIsLocating] = useState(false);

  /* Position affichée : celle reçue si elle est exploitable, sinon le centre de
     Daloa — la carte doit toujours pouvoir se dessiner quelque part. */
  const isValidCoords = latitude != null && longitude != null && isLocationInDaloa(latitude, longitude);
  const currentLat = isValidCoords ? latitude : DALOA_CENTER.lat;
  const currentLng = isValidCoords ? longitude : DALOA_CENTER.lng;

  const [routeInfo, setRouteInfo] = useState<DrivingRouteResult>({
    distanceKm: 2.5,
    distanceMeters: 2500,
    durationMinutes: 7,
    coordinates: [],
    isRoadNetwork: false,
  });

  // Calcul dynamique de l'itinéraire routier réel (Mapbox avec replis automatiques)
  useEffect(() => {
    let active = true;
    const rawSLat = sellerCoords?.latitude;
    const rawSLng = sellerCoords?.longitude;
    const isSellerValid = rawSLat != null && rawSLng != null && isLocationInDaloa(rawSLat, rawSLng);
    const sLat = isSellerValid ? rawSLat : DALOA_CENTER.lat;
    const sLng = isSellerValid ? rawSLng : DALOA_CENTER.lng;

    getDrivingRoute(
      { latitude: sLat, longitude: sLng },
      { latitude: currentLat, longitude: currentLng }
    ).then((res) => {
      if (active) {
        // Affichage seul : la distance qui fait foi est celle de l'écran de
        // checkout. Deux calculs concurrents donnaient un prix qui changeait
        // tout seul selon celui qui répondait en dernier.
        setRouteInfo(res);
      }
    });

    return () => {
      active = false;
    };
  }, [currentLat, currentLng, sellerCoords?.latitude, sellerCoords?.longitude]);

  const handleLocateMe = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        GPS_TIMEOUT_MS,
        () => Location.getLastKnownPositionAsync()
      );
      if (!loc?.coords) return;
      Haptics.selection();
      const { latitude: rawLat, longitude: rawLng } = loc.coords;
      if (isLocationInDaloa(rawLat, rawLng)) {
        onChangeLocation({ latitude: rawLat, longitude: rawLng });
      } else {
        onChangeLocation({ latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng });
      }
    } catch (err) {
      console.warn('Erreur localisation GPS:', err);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <AppText variant="caption" color={colors.text.body} style={styles.boldText}>
            Localisation précise sur la carte
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Touchez ou glissez le repère vers votre domicile
          </AppText>
        </View>

        <View style={styles.btnRow}>
          <AppPressable
            haptic="selection"
            onPress={() => onChangeLocation({ latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng })}
            style={styles.quickBtn}
          >
            <MapPin size={12} color={accent.DEFAULT} />
            <AppText variant="caption" color={accent.DEFAULT} style={styles.boldText}>Daloa</AppText>
          </AppPressable>

          <AppPressable
            haptic="light"
            onPress={handleLocateMe}
            disabled={isLocating}
            style={[styles.quickBtn, styles.gpsBtn]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.text.body} />
            ) : (
              <LocateFixed size={12} color={colors.text.body} />
            )}
            <AppText variant="caption" color={colors.text.body}>GPS</AppText>
          </AppPressable>
        </View>
      </View>

      {/* Cadre de la carte */}
      <View style={styles.mapCard}>
        <LeafletMapView
          pin={{ latitude: currentLat, longitude: currentLng }}
          pinLabel="Lieu de livraison"
          onPinChange={onChangeLocation}
          secondary={sellerCoords ?? null}
          secondaryLabel="Boutique du vendeur"
          route={routeInfo.coordinates || []}
          routeColor={accent.DEFAULT}
        />
      </View>

      {/* Bannière de distance calculée en direct */}
      <View style={styles.distanceBanner}>
        <Navigation size={14} color={accent.DEFAULT} />
        <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
          Itinéraire routier : <AppText variant="caption" style={styles.boldText}>{routeInfo.distanceKm} km</AppText>
          {routeInfo.durationMinutes ? ` · ~${routeInfo.durationMinutes} min` : ''}
        </AppText>
        <View style={styles.badgeLive}>
          <AppText variant="overline" color={colors.status.successDark}>
            {routeInfo.isRoadNetwork ? 'ROUTE RÉELLE' : 'TARIF EN DIRECT'}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  titleWrap: {
    flex: 1,
  },
  boldText: {
    fontFamily: typography.families.bold,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  gpsBtn: {
    backgroundColor: colors.bg.surface,
  },
  mapCard: {
    height: 260,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  distanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  badgeLive: {
    backgroundColor: colors.status.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  flex1: {
    flex: 1,
  },
});
