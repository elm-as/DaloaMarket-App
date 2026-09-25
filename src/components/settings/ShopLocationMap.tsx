import React from 'react';
import { View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { LeafletMapView } from '../maps/LeafletMapView';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { DALOA_CENTER } from '@daloa/config';
import { MapPin, LocateFixed, AlertTriangle, ExternalLink } from 'lucide-react-native';
import { Haptics, isLocationInDaloa } from '@daloa/utils';

interface ShopLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onChangeLocation: (coords: { latitude: number; longitude: number }) => void;
  onLocateGps?: () => void;
  isLocating?: boolean;
}

export const ShopLocationMap: React.FC<ShopLocationMapProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  onLocateGps,
  isLocating = false,
}) => {
  const accent = useAccent();
  const isValidCoords = latitude != null && longitude != null && isLocationInDaloa(latitude, longitude);
  const isOutsideDaloa = latitude != null && longitude != null && !isLocationInDaloa(latitude, longitude);
  const currentLat = isValidCoords ? latitude : DALOA_CENTER.lat;
  const currentLng = isValidCoords ? longitude : DALOA_CENTER.lng;

  const handleOpenGoogleMaps = () => {
    Haptics.selection();
    const url = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <AppText variant="bodyStrong">Carte interactive de Daloa</AppText>
          <AppText variant="caption" color={colors.text.subtle}>
            Cliquez ou glissez le repère pour ajuster l'emplacement
          </AppText>
        </View>

        <View style={styles.headerButtons}>
          <AppPressable
            haptic="selection"
            onPress={() => onChangeLocation({ latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng })}
            style={[styles.gpsQuickBtn, { borderColor: accent[200], backgroundColor: accent[50] }]}
            accessibilityLabel="Recentrer sur Daloa"
          >
            <MapPin size={13} color={accent[700]} />
            <AppText variant="caption" color={accent[700]} style={styles.gpsBtnText}>
              Centre Daloa
            </AppText>
          </AppPressable>

          {onLocateGps && (
            <AppPressable
              haptic="light"
              onPress={onLocateGps}
              disabled={isLocating}
              style={[styles.gpsQuickBtn, { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}
              accessibilityLabel="Détecter la position GPS de ma boutique"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <LocateFixed size={13} color={colors.text.inverse} />
              )}
              <AppText variant="caption" color={colors.text.inverse} style={[styles.gpsBtnText, { fontFamily: typography.families.extrabold }]}>
                Me localiser
              </AppText>
            </AppPressable>
          )}
        </View>
      </View>

      {/* Avertissement si coordonnées hors Daloa (ex: testeur à Abidjan) */}
      {isOutsideDaloa && (
        <AppPressable
          onPress={() => onChangeLocation({ latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng })}
          style={styles.warningBanner}
        >
          <AlertTriangle size={13} color={colors.status.warningDark} />
          <AppText variant="caption" color={colors.status.warningDark} style={styles.flex1}>
            Position hors de Daloa détectée (Mode test). Emplacement calé sur Daloa.
          </AppText>
        </AppPressable>
      )}

      {/* Cadre de la carte */}
      <View style={styles.mapFrame}>
        <LeafletMapView
          pin={{ latitude: currentLat, longitude: currentLng }}
          pinLabel="Ma boutique"
          onPinChange={onChangeLocation}
          initialZoom={14}
        />

        {/* Ouvrir dans Google Maps */}
        <AppPressable
          haptic="selection"
          onPress={handleOpenGoogleMaps}
          style={styles.googleMapsFloatingBtn}
          accessibilityLabel="Ouvrir dans Google Maps"
        >
          <ExternalLink size={12} color={colors.text.inverse} />
          <AppText variant="caption" color={colors.text.inverse} style={styles.googleMapsText}>
            Google Maps
          </AppText>
        </AppPressable>

        {/* Badge indicateur de coordonnées */}
        <View style={styles.coordsBadge}>
          <MapPin size={11} color={colors.text.inverse} />
          <AppText variant="caption" color={colors.text.inverse} style={styles.coordsText}>
            {isValidCoords
              ? `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`
              : 'Daloa (calé sur le quartier)'}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  headerRow: {
    gap: spacing[2],
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: radii.md,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1] + 2,
  },
  flex1: {
    flex: 1,
  },
  titleWrap: {
    gap: 2,
  },
  gpsQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 6,
  },
  gpsBtnText: {
    fontFamily: typography.families.bold,
  },
  mapFrame: {
    height: 260,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  nativeMapContainer: {
    ...StyleSheet.absoluteFillObject,
    position: 'relative',
  },
  staticMapImage: {
    width: '100%',
    height: '100%',
  },
  zoomButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  googleMapsFloatingBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.md,
  },
  googleMapsText: {
    fontFamily: typography.families.bold,
    fontSize: 11,
  },
  coordsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordsText: {
    fontVariant: ['tabular-nums'],
    fontSize: 10.5,
  },
});

export default ShopLocationMap;
