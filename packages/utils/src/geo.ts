import { DALOA_CENTER, DALOA_GEOFENCE_RADIUS_KM, MAX_OTP_GPS_DISTANCE_METERS, MAPBOX_PUBLIC_TOKEN } from '@daloa/config';
import { Coordinates } from '@daloa/types';

/**
 * Calcule la distance en kilomètres entre 2 points géographiques (formule de Haversine)
 */
export function haversineDistance(
  coord1: { lat?: number | null; latitude?: number | null; lng?: number | null; longitude?: number | null },
  coord2: { lat?: number | null; latitude?: number | null; lng?: number | null; longitude?: number | null }
): number {
  const lat1 = coord1.lat ?? coord1.latitude;
  const lon1 = coord1.lng ?? coord1.longitude;
  const lat2 = coord2.lat ?? coord2.latitude;
  const lon2 = coord2.lng ?? coord2.longitude;

  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 2.5; // Fallback distance moyenne standard dans Daloa
  }

  const R = 6371; // Rayon moyen de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Vérifie si des coordonnées GPS se situent dans le périmètre de la ville de Daloa
 */
export function isLocationInDaloa(lat: number, lng: number, maxRadiusKm = DALOA_GEOFENCE_RADIUS_KM): boolean {
  const distance = haversineDistance({ lat, lng }, DALOA_CENTER);
  return distance <= maxRadiusKm;
}

/**
 * Vérifie si le livreur est à moins de 100m du point de rendez-vous pour la validation OTP
 */
export function isWithinOtpProximity(
  driverCoords: Coordinates,
  targetCoords: Coordinates,
  maxDistanceMeters = MAX_OTP_GPS_DISTANCE_METERS
): { isWithin: boolean; distanceMeters: number } {
  const distanceKm = haversineDistance(driverCoords, targetCoords);
  const distanceMeters = Math.round(distanceKm * 1000);
  return {
    isWithin: distanceMeters <= maxDistanceMeters,
    distanceMeters,
  };
}

export interface DrivingRouteResult {
  /** Distance routière réelle en kilomètres (arrondie à 1 décimale) */
  distanceKm: number;
  /** Distance routière en mètres */
  distanceMeters: number;
  /** Durée estimée du trajet en minutes (en moto / circulation normale) */
  durationMinutes: number;
  /** Tableau de coordonnées [longitude, latitude] pour tracer la route sur la carte */
  coordinates: [number, number][];
  /** Vrai si l'itinéraire provient du réseau routier réel, faux si estimation */
  isRoadNetwork: boolean;
}

/**
 * Calcule l'itinéraire routier réel entre deux points GPS via Mapbox Directions API,
 * avec bascule transparente de secours vers OpenStreetMap/OSRM puis Haversine.
 */
export async function getDrivingRoute(
  origin: { lat?: number | null; latitude?: number | null; lng?: number | null; longitude?: number | null },
  destination: { lat?: number | null; latitude?: number | null; lng?: number | null; longitude?: number | null },
  customToken?: string
): Promise<DrivingRouteResult> {
  const lat1 = origin.lat ?? origin.latitude;
  const lon1 = origin.lng ?? origin.longitude;
  const lat2 = destination.lat ?? destination.latitude;
  const lon2 = destination.lng ?? destination.longitude;

  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return {
      distanceKm: 2.5,
      distanceMeters: 2500,
      durationMinutes: 7,
      coordinates: [],
      isRoadNetwork: false,
    };
  }

  const token = customToken || MAPBOX_PUBLIC_TOKEN;

  // 1. Mapbox Directions API (haute précision, 100 000 requêtes gratuites/mois)
  if (token) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?geometries=geojson&overview=full&access_token=${token}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const r = data.routes[0];
          const distKm = Math.round((r.distance / 1000) * 10) / 10;
          return {
            distanceKm: Math.max(0.5, distKm),
            distanceMeters: Math.round(r.distance),
            durationMinutes: Math.max(1, Math.round(r.duration / 60)),
            coordinates: r.geometry.coordinates || [],
            isRoadNetwork: true,
          };
        }
      }
    } catch {
      // repli OSRM
    }
  }

  // 2. Repli OpenStreetMap / OSRM public
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const r = data.routes[0];
        const distKm = Math.round((r.distance / 1000) * 10) / 10;
        return {
          distanceKm: Math.max(0.5, distKm),
          distanceMeters: Math.round(r.distance),
          durationMinutes: Math.max(1, Math.round(r.duration / 60)),
          coordinates: r.geometry.coordinates || [],
          isRoadNetwork: true,
        };
      }
    }
  } catch {
    // repli Haversine
  }

  // 3. Repli de secours : distance à vol d'oiseau majorée de 30% (coefficient standard urbain Daloa)
  const straightKm = haversineDistance(origin, destination);
  const roadEstKm = Math.round(straightKm * 1.3 * 10) / 10;
  return {
    distanceKm: Math.max(0.5, roadEstKm),
    distanceMeters: Math.round(roadEstKm * 1000),
    durationMinutes: Math.max(2, Math.round(roadEstKm * 2.5)),
    coordinates: [
      [lon1, lat1],
      [lon2, lat2],
    ],
    isRoadNetwork: false,
  };
}
