import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAPBOX_PUBLIC_TOKEN } from '@daloa/config';

type LatLng = { latitude: number; longitude: number };

interface LeafletMapViewProps {
  /** Repère déplaçable (lieu de livraison, boutique…). */
  pin: LatLng;
  pinLabel: string;
  onPinChange: (coords: LatLng) => void;
  /** Point secondaire fixe (boutique du vendeur au checkout). */
  secondary?: LatLng | null;
  secondaryLabel?: string;
  /** Tracé d'itinéraire, en [lng, lat] comme Mapbox. */
  route?: [number, number][];
  routeColor?: string;
  /** Zoom de départ, sans point secondaire. 13 : le quartier et ses voisins. */
  initialZoom?: number;
}

/**
 * Carte Leaflet interactive, chargée UNE seule fois.
 *
 * Les anciennes cartes régénéraient leur HTML à chaque déplacement du repère
 * ou à chaque nouvel itinéraire : la page se rechargeait, le zoom choisi par
 * l'utilisateur était perdu et la carte revenait à un cadrage très serré —
 * d'où l'impression d'une carte « figée ». Ici on ne pousse que les mises à
 * jour (repère, point secondaire, tracé) ; la vue n'est recadrée que quand un
 * nouvel élément à montrer arrive, jamais après un geste de l'utilisateur.
 */
export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  pin,
  pinLabel,
  onPinChange,
  secondary = null,
  secondaryLabel = 'Boutique',
  route = [],
  routeColor = '#FF9800',
  initialZoom = 13,
}) => {
  const webRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const readyRef = useRef(false);
  // Dernière position émise par la carte elle-même : quand elle revient en
  // props, inutile de recadrer (l'utilisateur vient de la choisir).
  const fromMapRef = useRef<string | null>(null);

  // Le HTML ne dépend que de la position initiale : il n'est jamais régénéré.
  const initialPin = useRef(pin).current;
  const html = useMemo(() => {
    const tileUrl = MAPBOX_PUBLIC_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_PUBLIC_TOKEN}`
      : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0;box-sizing:border-box;}body,html,#map{width:100%;height:100%;background:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}</style></head><body><div id="map"></div><script>
var map=L.map('map',{zoomControl:false,minZoom:10}).setView([${initialPin.latitude},${initialPin.longitude}],${initialZoom});
L.control.zoom({position:'topright'}).addTo(map);
L.tileLayer('${tileUrl}',{maxZoom:19,attribution:'© Mapbox © OSM'}).addTo(map);
var marker=L.marker([${initialPin.latitude},${initialPin.longitude}],{draggable:true}).addTo(map);
marker.bindPopup(${JSON.stringify(`<b>${pinLabel}</b>`)});
var second=null,line=null;
function send(o){var m=JSON.stringify(o);if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){window.ReactNativeWebView.postMessage(m);}else if(window.parent){window.parent.postMessage(m,'*');}}
function moved(ll){send({type:'PIN',latitude:ll.lat,longitude:ll.lng});}
marker.on('dragend',function(){moved(marker.getLatLng());});
map.on('click',function(e){marker.setLatLng(e.latlng);moved(e.latlng);});
function fit(){var pts=[marker.getLatLng()];if(second)pts.push(second.getLatLng());if(line)pts=pts.concat(line.getLatLngs());if(pts.length>1){map.fitBounds(L.latLngBounds(pts),{padding:[36,36],maxZoom:15});}else{map.setView(pts[0],Math.max(map.getZoom(),${initialZoom}));}}
window.__update=function(d){
 if(d.pin){marker.setLatLng([d.pin.latitude,d.pin.longitude]);}
 if(d.secondary){if(!second){second=L.circleMarker([d.secondary.latitude,d.secondary.longitude],{radius:8,fillColor:'#10B981',color:'#fff',weight:2,fillOpacity:0.95}).addTo(map);second.bindPopup(${JSON.stringify(`<b>${secondaryLabel}</b>`)});}else{second.setLatLng([d.secondary.latitude,d.secondary.longitude]);}}
 else if(second){map.removeLayer(second);second=null;}
 if(line){map.removeLayer(line);line=null;}
 if(d.route&&d.route.length>1){line=L.polyline(d.route.map(function(c){return[c[1],c[0]];}),{color:'${routeColor}',weight:4,opacity:0.85}).addTo(map);}
 if(d.fit)fit();
};
window.addEventListener('message',function(e){try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;if(d&&d.type==='UPDATE')window.__update(d);}catch(err){}});
send({type:'READY'});
</script></body></html>`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const push = (fit: boolean) => {
    if (!readyRef.current) return;
    const payload = { type: 'UPDATE', pin, secondary, route, fit };
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(payload), '*');
    } else {
      webRef.current?.injectJavaScript(`window.__update(${JSON.stringify(payload)});true;`);
    }
  };

  // Recadrage seulement si le repère a été déplacé hors de la carte (GPS,
  // bouton « Daloa »…) ou si un nouveau point / tracé apparaît.
  const pinKey = `${pin.latitude.toFixed(6)},${pin.longitude.toFixed(6)}`;
  const secondaryKey = secondary ? `${secondary.latitude.toFixed(6)},${secondary.longitude.toFixed(6)}` : '';
  const routeKey = route.length > 1 ? `${route.length}:${route[0].join(',')}:${route[route.length - 1].join(',')}` : '';
  // Après un geste sur la carte, l'itinéraire recalculé arrive un peu plus
  // tard : on ne recadre pas non plus, sinon le zoom choisi serait perdu.
  const userDrivenRef = useRef(false);
  const prevPinKeyRef = useRef(pinKey);
  useEffect(() => {
    if (prevPinKeyRef.current !== pinKey) {
      userDrivenRef.current = fromMapRef.current === pinKey;
      prevPinKeyRef.current = pinKey;
    }
    fromMapRef.current = null;
    push(!userDrivenRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinKey, secondaryKey, routeKey]);

  const handleMessage = (raw: string) => {
    try {
      const d = JSON.parse(raw);
      if (d?.type === 'READY') {
        readyRef.current = true;
        push(true);
      } else if (d?.type === 'PIN' && Number.isFinite(d.latitude) && Number.isFinite(d.longitude)) {
        fromMapRef.current = `${Number(d.latitude).toFixed(6)},${Number(d.longitude).toFixed(6)}`;
        onPinChange({ latitude: d.latitude, longitude: d.longitude });
      }
    } catch {
      // message non JSON : ignoré
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const listener = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      handleMessage(typeof event.data === 'string' ? event.data : JSON.stringify(event.data));
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  });

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fill}>
        {/* @ts-ignore — iframe DOM sur le web */}
        <iframe ref={iframeRef} srcDoc={html} style={styles.iframe} title={pinLabel} />
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      style={styles.fill}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      // Android : sans ça, la page qui défile capte les glissements du doigt
      // et la carte ne se déplace pas.
      nestedScrollEnabled
      scrollEnabled={false}
      overScrollMode="never"
      onMessage={(event) => handleMessage(event.nativeEvent.data)}
    />
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
});
