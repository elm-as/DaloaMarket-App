import { DALOA_CENTER } from '@daloa/config';
import { isLocationInDaloa, getDrivingRoute, haversineDistance } from '@daloa/utils';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Résout la position GPS réelle du vendeur sur la carte.
 * 1. Coordonnées directes de l'article (si géolocalisé)
 * 2. Coordonnées de la boutique du vendeur (shop_latitude / shop_longitude)
 * 3. Repli par défaut : Centre de Daloa
 */
export function resolveSellerLocation(listing: any): GeoPoint {
  if (!listing) {
    return { latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng };
  }

  const listLat = listing.latitude ?? listing.shop_latitude;
  const listLng = listing.longitude ?? listing.shop_longitude;
  if (
    listLat != null &&
    listLng != null &&
    isLocationInDaloa(Number(listLat), Number(listLng))
  ) {
    return { latitude: Number(listLat), longitude: Number(listLng) };
  }

  const shopLat = listing.seller?.shop_latitude;
  const shopLng = listing.seller?.shop_longitude;
  if (
    shopLat != null &&
    shopLng != null &&
    isLocationInDaloa(Number(shopLat), Number(shopLng))
  ) {
    return { latitude: Number(shopLat), longitude: Number(shopLng) };
  }

  return { latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng };
}

/**
 * Résout la position GPS réelle choisie par l'acheteur sur la carte ou via GPS.
 */
export function resolveBuyerLocation(deliveryCoords?: GeoPoint | null): GeoPoint {
  if (
    deliveryCoords?.latitude != null &&
    deliveryCoords?.longitude != null &&
    isLocationInDaloa(deliveryCoords.latitude, deliveryCoords.longitude)
  ) {
    return { latitude: deliveryCoords.latitude, longitude: deliveryCoords.longitude };
  }

  return { latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng };
}

/**
 * Calcule la distance routière réelle via le moteur cartographique (Mapbox Directions API).
 * Mapbox calcule l'itinéraire selon le tracé routier réel de Daloa.
 */
export async function calculateDrivingDistanceKm(
  origin: GeoPoint,
  destination: GeoPoint
): Promise<number> {
  if (
    origin.latitude === destination.latitude &&
    origin.longitude === destination.longitude
  ) {
    return 1.0; // Même point (livraison de proximité immédiate)
  }

  try {
    const route = await getDrivingRoute(origin, destination);
    if (route && route.distanceKm > 0) {
      return Number(route.distanceKm.toFixed(1));
    }
  } catch (error) {
    console.warn('[checkout-location] Erreur calcul itinéraire Mapbox:', error);
  }

  // Repli géométrique Haversine urbain si réseau indisponible
  const straightDistance = haversineDistance(origin, destination);
  return Math.max(0.8, Number((straightDistance * 1.3).toFixed(1)));
}
