import { supabase } from '../supabase';
import { DeliveryPersonRow, DriverDailyStats } from '@daloa/types';
import { calculatePlatformCommission } from './deliveryRunMapper';

/**
 * Récupère les statistiques quotidiennes et le solde réel disponible du livreur
 * (gains nets cumulés moins versements déjà payés ou en traitement).
 *
 * @param driverId Identifiant du profil livreur (`delivery_persons.id`).
 * @returns Agrégats financiers du jour, encours escrow et solde disponible.
 */
export async function fetchDriverDailyStats(driverId: string): Promise<DriverDailyStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: driver, error: driverError } = await supabase
    .from('delivery_persons')
    .select('id, user_id, rating, is_available')
    .eq('id', driverId)
    .maybeSingle();

  if (driverError) throw driverError;

  const driverUserId = driver?.user_id || driverId;

  const [deliveredRes, activeRes, payoutsRes] = await Promise.all([
    supabase
      .from('delivery_assignments')
      .select('delivery_price, delivered_at')
      .eq('delivery_person_id', driverId)
      .eq('status', 'delivered'),
    supabase
      .from('delivery_assignments')
      .select('delivery_price')
      .eq('delivery_person_id', driverId)
      .in('status', ['assigned', 'picked_up', 'in_transit']),
    supabase
      .from('payouts')
      .select('amount, status')
      .eq('user_id', driverUserId)
      .eq('type', 'delivery'),
  ]);

  if (deliveredRes.error) throw deliveredRes.error;
  if (activeRes.error) throw activeRes.error;
  if (payoutsRes.error) throw payoutsRes.error;

  const allDelivered = deliveredRes.data || [];
  const activeRuns = activeRes.data || [];
  const payouts = payoutsRes.data || [];

  let earningsToday = 0;
  let completedRunsToday = 0;
  let totalLifetimeEarnings = 0;

  allDelivered.forEach((run) => {
    const price = Number(run.delivery_price) || 0;
    const net = price - calculatePlatformCommission(price);
    totalLifetimeEarnings += net;

    if (run.delivered_at && new Date(run.delivered_at) >= today) {
      earningsToday += net;
      completedRunsToday += 1;
    }
  });

  const pendingEscrowAmount = activeRuns.reduce((sum, run) => {
    const price = Number(run.delivery_price) || 0;
    return sum + (price - calculatePlatformCommission(price));
  }, 0);

  const pendingPayoutAmount = payouts
    .filter((payout) => payout.status === 'pending' || payout.status === 'processing')
    .reduce((sum, payout) => sum + (Number(payout.amount) || 0), 0);

  const paidOutAmount = payouts
    .filter((payout) => payout.status === 'paid' || payout.status === 'completed')
    .reduce((sum, payout) => sum + (Number(payout.amount) || 0), 0);

  const totalAvailableBalance = Math.max(
    0,
    totalLifetimeEarnings - paidOutAmount - pendingPayoutAmount
  );

  return {
    completedRunsToday,
    earningsToday,
    pendingEscrowAmount,
    totalAvailableBalance,
    rating: driver?.rating != null ? Number(driver.rating) : null,
    isOnline: Boolean(driver?.is_available),
    totalLifetimeEarnings,
    totalCompletedRuns: allDelivered.length,
    pendingPayoutAmount,
    paidOutAmount,
  };
}

/**
 * Récupère l'annuaire des livreurs partenaires actifs de Daloa avec filtres optionnels.
 *
 * @param vehicleType Type de véhicule (`all` ou vide pour ne pas filtrer).
 * @param zone Quartier couvert (`all` ou vide pour ne pas filtrer).
 * @returns Liste des livreurs disposant d'un nom et d'un téléphone valides.
 */
export async function fetchDeliverersDirectory(
  vehicleType?: string,
  zone?: string
): Promise<DeliveryPersonRow[]> {
  let query = supabase
    .from('delivery_persons_directory')
    .select('*')
    .order('rating', { ascending: false });

  if (vehicleType && vehicleType !== 'all') {
    query = query.eq('vehicle_type', vehicleType);
  }

  if (zone && zone !== 'all') {
    query = query.contains('coverage_zones', [zone]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as unknown as DeliveryPersonRow[]) || []).filter(
    (driver) =>
      Boolean(driver.name && driver.name.trim().length > 0 && driver.phone && driver.phone.trim().length > 0)
  );
}
