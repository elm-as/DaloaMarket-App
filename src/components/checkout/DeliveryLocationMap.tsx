import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { DALOA_CENTER, MAPBOX_PUBLIC_TOKEN } from '@daloa/config';
import { MapPin, Navigation, LocateFixed } from 'lucide-react-native';
import { haversineDistance, getDrivingRoute, DrivingRouteResult, Haptics, isLocationInDaloa, withTimeout, GPS_TIMEOUT_MS } from '@daloa/utils';

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

  // HTML autonome Leaflet & Mapbox pour Web et WebView
  const mapHtml = useMemo(() => {
    const sLat = sellerCoords?.latitude ?? null;
    const sLng = sellerCoords?.longitude ?? null;
    const hasSeller = sLat != null && sLng != null;
    const leafletCoords = (routeInfo.coordinates || []).map(([lng, lat]) => [lat, lng]);
    const sellerSnippet = hasSeller ? `var sM=L.circleMarker([${sLat},${sLng}],{radius:8,fillColor:'#10B981',color:'#fff',weight:2,fillOpacity:0.9}).addTo(map);sM.bindPopup('<b>Boutique Vendeur</b>');` : '';
    const routeSnippet = leafletCoords.length > 0 ? `var poly=L.polyline(${JSON.stringify(leafletCoords)},{color:'${accent.DEFAULT}',weight:4,opacity:0.85}).addTo(map);map.fitBounds(poly.getBounds(),{padding:[30,30]});` : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0;box-sizing:border-box;}body,html{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}body,html,#map{width:100%;height:100%;background:#e5e7eb;}</style></head><body><div id="map"></div><script>var lat=${currentLat};var lng=${currentLng};var map=L.map('map',{zoomControl:false}).setView([lat,lng],14);L.control.zoom({position:'topright'}).addTo(map);var tileUrl='${MAPBOX_PUBLIC_TOKEN ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_PUBLIC_TOKEN}` : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'}';L.tileLayer(tileUrl,{maxZoom:20,attribution:'© CARTO © OSM'}).addTo(map);var marker=L.marker([lat,lng],{draggable:true}).addTo(map);marker.bindPopup('<b>Lieu de livraison</b>').openPopup();${sellerSnippet}${routeSnippet}function notify(nLat,nLng){var m=JSON.stringify({type:'DELIVERY_COORDS',latitude:nLat,longitude:nLng});if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){window.ReactNativeWebView.postMessage(m);}else if(window.parent){window.parent.postMessage(m,'*');}}marker.on('dragend',function(e){var p=marker.getLatLng();notify(p.lat,p.lng);});map.on('click',function(e){marker.setLatLng(e.latlng);notify(e.latlng.lat,e.latlng.lng);});</script></body></html>`;
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
          /* Le natif n'affichait qu'une image statique : impossible d'y
             « toucher ou glisser le repère » comme le promettait le libellé, et
             les boutons +/- n'avaient aucun effet dès qu'un vendeur était
             épinglé (l'URL statique utilisait un cadrage automatique). La carte
             Leaflet existait déjà, elle n'était rendue que sur le web. */
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onMessage={(event) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data);
                if (payload?.type === 'DELIVERY_COORDS' && payload.latitude && payload.longitude) {
                  onChangeLocation({ latitude: payload.latitude, longitude: payload.longitude });
                }
              } catch {
                // message non JSON : ignoré
              }
            }}
          />
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
    height: 175,
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
