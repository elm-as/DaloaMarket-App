import {
  DALOA_CENTER,
  DALOA_DISTRICT_COORDINATES,
  DELIVERY_DISTANCE_RULE,
  clampBillableDistanceKm,
} from '@daloa/config';
import { haversineDistance, isLocationInDaloa, getDrivingRoute } from './geo';

/**
 * Devis de livraison — implémentation de référence de la « règle Daloa ».
 *
 * Ce module était jusqu'ici un fichier d'écran
 * (`apps/daloamarket/src/components/checkout/checkout-location.ts`). Il est
 * remonté ici parce que trois autres endroits résolvaient les mêmes points GPS
 * avec des replis différents : le checkout web (aucun repli → 0 km facturé),
 * `ordersService` (repli quartier) et `payments.js` (repli centre-ville). Le
 * même acheteur voyait donc trois prix selon l'endroit où il commandait.
 *
 * Les copies hors monorepo (web Vite, serveur Railway, SQL) doivent reproduire
 * ces règles à l'identique ; `pricing-parity.test.ts` le vérifie.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const center = (): GeoPoint => ({ latitude: DALOA_CENTER.lat, longitude: DALOA_CENTER.lng });

const districtPoint = (district?: string | null): GeoPoint | null => {
  if (!district) return null;
  const point = (DALOA_DISTRICT_COORDINATES as Record<string, GeoPoint>)[district];
  return point ? { latitude: point.latitude, longitude: point.longitude } : null;
};

const usableGps = (lat: unknown, lng: unknown): GeoPoint | null => {
  if (lat == null || lng == null) return null;
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  if (!isLocationInDaloa(nLat, nLng)) return null;
  return { latitude: nLat, longitude: nLng };
};

/**
 * Point de retrait : GPS de la boutique → barycentre du quartier déclaré →
 * centre de Daloa. Accepte aussi bien une annonce complète qu'un objet vendeur.
 */
export function resolveSellerPoint(listing: any): GeoPoint {
  if (!listing) return center();

  const seller = listing.seller || listing.users || {};

  return (
    usableGps(listing.latitude ?? listing.shop_latitude, listing.longitude ?? listing.shop_longitude) ||
    usableGps(seller.shop_latitude ?? seller.latitude, seller.shop_longitude ?? seller.longitude) ||
    districtPoint(seller.district || listing.district) ||
    center()
  );
}

/**
 * Point de livraison : GPS saisi → barycentre du quartier choisi → centre.
 */
export function resolveBuyerPoint(
  coords?: { latitude?: number | null; longitude?: number | null } | null,
  district?: string | null
): GeoPoint {
  return (
    usableGps(coords?.latitude, coords?.longitude) ||
    districtPoint(district) ||
    center()
  );
}

/** Distance à vol d'oiseau bornée — la référence que tout le monde recalcule. */
export function straightDistanceKm(origin: GeoPoint, destination: GeoPoint): number {
  return clampBillableDistanceKm(haversineDistance(origin, destination));
}

/**
 * Distance facturable : itinéraire routier réel (Mapbox, puis OSRM), et à
 * défaut le vol d'oiseau majoré. Toujours bornée à `[minKm, maxKm]`.
 */
export async function resolveBillableDistanceKm(
  origin: GeoPoint,
  destination: GeoPoint
): Promise<number> {
  const straight = haversineDistance(origin, destination);

  try {
    const route = await getDrivingRoute(origin, destination);
    if (route?.isRoadNetwork && route.distanceKm > 0) {
      return clampBillableDistanceKm(route.distanceKm);
    }
  } catch {
    // réseau indisponible : on bascule sur l'estimation géométrique
  }

  return clampBillableDistanceKm(straight * DELIVERY_DISTANCE_RULE.roadFactor);
}
