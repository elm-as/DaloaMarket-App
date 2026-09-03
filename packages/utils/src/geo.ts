import { DALOA_CENTER, DALOA_GEOFENCE_RADIUS_KM, MAX_OTP_GPS_DISTANCE_METERS } from '@daloa/config';
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
