import { supabase } from '../supabase';
import {
  DeliveryLiveLocationEvent,
  RunTrackingFreshness,
  Coordinates,
} from '@daloa/types';
import { haversineDistance } from '@daloa/utils';

/**
 * Vitesse moyenne d'un deux-roues en zone urbaine à Daloa (km/h)
 * Utilisée pour estimer le délai d'arrivée (ETA).
 */
const DALOA_AVERAGE_MOTO_SPEED_KMH = 22;

/**
 * Calcule l'état de fraîcheur du signal GPS :
 * - 'live' : reçu il y a moins de 20 secondes (point vert pulsant)
 * - 'stale' : entre 20s et 60s (point orange, signal faible)
 * - 'disconnected' : plus de 60s (point gris, déconnecté)
 */
export function calculateTrackingFreshness(
  timestampMs: number,
  nowMs: number = Date.now()
): RunTrackingFreshness {
  const elapsedMs = Math.max(0, nowMs - timestampMs);
  if (elapsedMs < 20_000) return 'live';
  if (elapsedMs < 60_000) return 'stale';
  return 'disconnected';
}

/**
 * Estime le temps d'arrivée en minutes en fonction de la distance à vol d'oiseau
 * avec un facteur d'itinéraire urbain (1.3x) et vitesse moto.
 */
export function estimateEtaMinutes(
  distanceKm: number,
  averageSpeedKmh: number = DALOA_AVERAGE_MOTO_SPEED_KMH
): number {
  if (distanceKm <= 0.05) return 1;
  const urbanDistanceKm = distanceKm * 1.3;
  const hours = urbanDistanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  return Math.max(1, minutes);
}

/**
 * Calcule la distance restante et l'ETA entre la position du livreur et la destination
 */
export function computeDriverEta(
  driverCoords: Coordinates,
  destinationCoords: Coordinates
): { distanceKm: number; etaMinutes: number } {
  const distanceKm = haversineDistance(driverCoords, destinationCoords);
  const roundedKm = Math.round(distanceKm * 10) / 10;
  const etaMinutes = estimateEtaMinutes(distanceKm);
  return { distanceKm: roundedKm, etaMinutes };
}

/**
 * Service gérant la diffusion et la réception de géolocalisation en temps réel (F07)
 */
export const deliveryTrackingService = {
  /**
   * Diffuse la position actuelle du livreur sur le canal Supabase Realtime éphémère
   */
  async broadcastDriverLocation(event: DeliveryLiveLocationEvent): Promise<void> {
    const channelName = `run_tracking:${event.assignmentId}`;
    const channel = supabase.channel(channelName);

    await channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: event,
    });
  },

  /**
   * Enregistre un point de géolocalisation persistant en base (RPC sécurisée)
   * pour historique et reprise après reconnexion
   */
  async saveDriverLocationSnapshot(
    assignmentId: string,
    lat: number,
    lng: number
  ): Promise<boolean> {
    const { data, error } = await (supabase.rpc as any)('update_driver_run_location', {
      p_assignment_id: assignmentId,
      p_lat: lat,
      p_lng: lng,
    });

    if (error) {
      console.warn('[deliveryTracking] Erreur mise à jour position en base:', error.message);
      return false;
    }
    return Boolean(data);
  },

  /**
   * S'abonne aux mises à jour GPS en temps réel d'une course active
   * @param assignmentId Identifiant de la mission de livraison
   * @param onUpdate Callback exécuté à chaque nouvelle coordonnée reçue
   * @returns Fonction de désabonnement / nettoyage
   */
  subscribeToRunLocation(
    assignmentId: string,
    onUpdate: (event: DeliveryLiveLocationEvent) => void
  ): () => void {
    const channelName = `run_tracking:${assignmentId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        if (!payload || typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
          return;
        }
        onUpdate(payload as DeliveryLiveLocationEvent);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
