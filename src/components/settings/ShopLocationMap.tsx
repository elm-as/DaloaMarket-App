import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { DALOA_CENTER, MAPBOX_PUBLIC_TOKEN } from '@daloa/config';
import { MapPin, Navigation, LocateFixed, AlertTriangle, Plus, Minus, ExternalLink } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

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
  const [zoom, setZoom] = useState(14);
  const currentLat = latitude ?? DALOA_CENTER.lat;
  const currentLng = longitude ?? DALOA_CENTER.lng;
  const hasCustomCoords = latitude != null && longitude != null;

  const handleOpenGoogleMaps = () => {
    Haptics.selection();
    const url = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
    Linking.openURL(url).catch(() => {});
  };

  const activeToken = MAPBOX_PUBLIC_TOKEN;
  const [mapError, setMapError] = useState(false);

  const staticMapUrl = useMemo(() => {
    if (mapError || !activeToken) {
      return `https://staticmap.openstreetmap.de/staticmap.php?center=${currentLat.toFixed(5)},${currentLng.toFixed(5)}&zoom=${zoom}&size=640x360&maptype=mapnik`;
    }
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+EA580C(${currentLng.toFixed(5)},${currentLat.toFixed(5)})/${currentLng.toFixed(5)},${currentLat.toFixed(5)},${zoom},0/640x360@2x?access_token=${activeToken}`;
  }, [currentLat, currentLng, zoom, activeToken, mapError]);

  // HTML interactif Leaflet OpenStreetMap autonome
  const mapHtml = useMemo(() => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0;box-sizing:border-box;}body,html,#map{width:100%;height:100%;background:#e5e7eb;}</style></head><body><div id="map"></div><script>var lat=${currentLat};var lng=${currentLng};var map=L.map('map',{zoomControl:false}).setView([lat,lng],14);L.control.zoom({position:'topright'}).addTo(map);var tileUrl='${MAPBOX_PUBLIC_TOKEN ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_PUBLIC_TOKEN}` : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'}';L.tileLayer(tileUrl,{maxZoom:20,attribution:'© CARTO © OSM'}).addTo(map);var marker=L.marker([lat,lng],{draggable:true}).addTo(map);marker.bindPopup("<b>Boutique</b><br>Déplacez pour ajuster").openPopup();function notifyParent(newLat,newLng){if(window.parent){window.parent.postMessage(JSON.stringify({type:'SHOP_COORDS',latitude:newLat,longitude:newLng}),'*');}}marker.on('dragend',function(e){var p=marker.getLatLng();notifyParent(p.lat,p.lng);});map.on('click',function(e){marker.setLatLng(e.latlng);notifyParent(e.latlng.lat,e.latlng.lng);});</script></body></html>`;
  }, [currentLat, currentLng]);

  // Écoute des messages envoyés par l'iframe (Web)
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type === 'SHOP_COORDS' && payload.latitude && payload.longitude) {
          onChangeLocation({ latitude: payload.latitude, longitude: payload.longitude });
        }
      } catch {
        // Ignorer les messages non JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChangeLocation]);

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
              <AppText variant="caption" color={colors.text.inverse} style={[styles.gpsBtnText, { fontWeight: '800' }]}>
                Me localiser
              </AppText>
            </AppPressable>
          )}
        </View>
      </View>

      {/* Avertissement si coordonnées hors Daloa */}
      {Math.abs(currentLat - DALOA_CENTER.lat) > 0.8 && (
        <AppPressable
          onPress={() => onChangeLocation({ latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng })}
          style={styles.warningBanner}
        >
          <AlertTriangle size={13} color={colors.status.warningDark} />
          <AppText variant="caption" color={colors.status.warningDark} style={styles.flex1}>
            Position hors de Daloa. Touchez ici pour recentrer automatiquement sur Daloa.
          </AppText>
        </AppPressable>
      )}

      {/* Cadre de la carte */}
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe
            srcDoc={mapHtml}
            style={styles.iframe}
            title="Carte d'emplacement de boutique à Daloa"
          />
        ) : (
          <View style={styles.nativeMapContainer}>
            <Image
              source={{ uri: staticMapUrl }}
              style={styles.staticMapImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              onError={() => setMapError(true)}
            />
            {/* Boutons de zoom natifs */}
            <View style={styles.zoomButtons}>
              <AppPressable
                haptic="light"
                onPress={() => setZoom((z) => Math.min(18, z + 1))}
                style={styles.zoomBtn}
                accessibilityLabel="Zoom avant"
              >
                <Plus size={15} color={colors.text.DEFAULT} strokeWidth={2.5} />
              </AppPressable>
              <View style={styles.zoomDivider} />
              <AppPressable
                haptic="light"
                onPress={() => setZoom((z) => Math.max(11, z - 1))}
                style={styles.zoomBtn}
                accessibilityLabel="Zoom arrière"
              >
                <Minus size={15} color={colors.text.DEFAULT} strokeWidth={2.5} />
              </AppPressable>
            </View>

            {/* Bouton Ouvrir dans Google Maps */}
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
          </View>
        )}

        {/* Badge indicateur de coordonnées */}
        <View style={styles.coordsBadge}>
          <MapPin size={11} color={colors.text.inverse} />
          <AppText variant="caption" color={colors.text.inverse} style={styles.coordsText}>
            {hasCustomCoords
              ? `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`
              : 'Daloa Centre (par défaut)'}
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
    fontWeight: '700',
  },
  mapFrame: {
    height: 220,
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
    fontWeight: '700',
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
