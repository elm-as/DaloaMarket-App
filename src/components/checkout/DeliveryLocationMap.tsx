import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { DALOA_CENTER, MAPBOX_PUBLIC_TOKEN } from '@daloa/config';
import { MapPin, Navigation, LocateFixed } from 'lucide-react-native';
import { haversineDistance, getDrivingRoute, DrivingRouteResult, Haptics } from '@daloa/utils';

interface DeliveryLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  sellerCoords?: { latitude: number; longitude: number } | null;
  onChangeLocation: (coords: { latitude: number; longitude: number }) => void;
  onDistanceChange?: (distanceKm: number) => void;
}

export const DeliveryLocationMap: React.FC<DeliveryLocationMapProps> = ({
  latitude,
  longitude,
  sellerCoords,
  onChangeLocation,
  onDistanceChange,
}) => {
  const accent = useAccent();
  const currentLat = latitude ?? DALOA_CENTER.lat;
  const currentLng = longitude ?? DALOA_CENTER.lng;
  const [isLocating, setIsLocating] = useState(false);

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
    const sLat = sellerCoords?.latitude ?? DALOA_CENTER.lat;
    const sLng = sellerCoords?.longitude ?? DALOA_CENTER.lng;

    getDrivingRoute(
      { latitude: sLat, longitude: sLng },
      { latitude: currentLat, longitude: currentLng }
    ).then((res) => {
      if (active) {
        setRouteInfo(res);
        if (onDistanceChange) {
          onDistanceChange(res.distanceKm);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [sellerCoords, currentLat, currentLng, onDistanceChange]);

  const handleLocateMe = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      onChangeLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      Haptics.success();
    } finally {
      setIsLocating(false);
    }
  };

  // HTML autonome Leaflet & Mapbox pour Web et WebView
  const mapHtml = useMemo(() => {
    const sLat = sellerCoords?.latitude ?? null;
    const sLng = sellerCoords?.longitude ?? null;
    const hasSeller = sLat != null && sLng != null;
    const leafletCoords = (routeInfo.coordinates || []).map(([lng, lat]) => [lat, lng]);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html, #map { width: 100%; height: 100%; background: #e5e7eb; }
          .leaflet-control-attribution { font-size: 8px !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var lat = ${currentLat};
          var lng = ${currentLng};
          var map = L.map('map', { zoomControl: false }).setView([lat, lng], 14);
          L.control.zoom({ position: 'topright' }).addTo(map);

          var mapboxUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_PUBLIC_TOKEN}';
          L.tileLayer(mapboxUrl, {
            maxZoom: 19,
            attribution: '© Mapbox © OpenStreetMap',
            tileSize: 512,
            zoomOffset: -1
          }).addTo(map);

          var marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.bindPopup("<b>Lieu de livraison</b><br>Glissez pour ajuster").openPopup();

          ${hasSeller ? `
          var sellerMarker = L.circleMarker([${sLat}, ${sLng}], {
            radius: 8,
            fillColor: '#10B981',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map);
          sellerMarker.bindPopup("<b>Boutique Vendeur</b>");
          ` : ''}

          var routeCoords = ${JSON.stringify(leafletCoords)};
          if (routeCoords && routeCoords.length > 0) {
            var polyline = L.polyline(routeCoords, { color: '${accent.DEFAULT}', weight: 4, opacity: 0.85, lineJoin: 'round' }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
          }

          function notifyParent(newLat, newLng) {
            if (window.parent) {
              window.parent.postMessage(JSON.stringify({ type: 'DELIVERY_COORDS', latitude: newLat, longitude: newLng }), '*');
            }
          }

          marker.on('dragend', function(e) {
            var pos = marker.getLatLng();
            notifyParent(pos.lat, pos.lng);
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            notifyParent(e.latlng.lat, e.latlng.lng);
          });
        </script>
      </body>
      </html>
    `;
  }, [currentLat, currentLng, sellerCoords, routeInfo.coordinates, accent.DEFAULT]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type === 'DELIVERY_COORDS' && payload.latitude && payload.longitude) {
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
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe
            srcDoc={mapHtml}
            style={styles.iframe}
            title="Carte de livraison à Daloa"
          />
        ) : (
          <View style={styles.nativeFallback}>
            <MapPin size={24} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </AppText>
          </View>
        )}
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
    fontWeight: '700',
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
    height: 175,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
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
