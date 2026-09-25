import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { listingsService } from '../services/listingsService';
import { ordersService } from '../services/ordersService';
import { deliveryService } from '../services/deliveryService';
import { chatService } from '../services/chatService';
import { payoutService } from '../services/payoutService';
import { affiliationsService } from '../services/affiliationsService';
import { reviewsService } from '../services/reviewsService';
import { favoritesService } from '../services/favoritesService';
import { systemSettingsService } from '../services/systemSettingsService';
import { ListingFilters, Coordinates } from '@daloa/types';

// ==========================================
// SYSTEM SETTINGS (maintenance, phase, paiement)
// ==========================================

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: () => systemSettingsService.getSettings(),
    staleTime: 1000 * 60, // 1 min
    refetchInterval: 1000 * 60 * 2, // resynchronise toutes les 2 min
    refetchOnWindowFocus: true,
  });
}

// ==========================================
// LISTINGS QUERIES & MUTATIONS
// ==========================================

export function useListings(filters: ListingFilters = {}, page = 0) {
  return useQuery({
    queryKey: ['listings', filters, page],
    queryFn: () => listingsService.getListings(filters, page),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Liste paginée en scroll infini (résout le plafond de 20 annonces).
 * Utiliser data.pages.flatMap(p => p.data) pour la liste aplatie.
 */
export function useInfiniteListings(filters: ListingFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['listings_infinite', filters],
    queryFn: ({ pageParam }) => listingsService.getListings(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
    staleTime: 1000 * 60 * 2,
  });
}

export function useListingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => (id ? listingsService.getListingById(id) : null),
    enabled: Boolean(id),
  });
}

export function useFavoriteListings(userId?: string) {
  return useQuery({
    queryKey: ['favorite_listings', userId],
    queryFn: () => (userId ? favoritesService.getFavoriteListings(userId) : []),
    enabled: Boolean(userId),
  });
}

export function useGuestFavoriteListings(favoriteIds: string[]) {
  return useQuery({
    queryKey: ['guest_favorite_listings', favoriteIds],
    queryFn: () => favoritesService.getListingsByIds(favoriteIds),
    enabled: favoriteIds.length > 0,
  });
}

export function useSimilarListings(category?: string, currentId?: string) {
  return useQuery({
    queryKey: ['similar_listings', category, currentId],
    queryFn: () => (category && currentId ? listingsService.getSimilarListings(category, currentId) : []),
    enabled: Boolean(category && currentId),
  });
}

// ==========================================
// ORDERS QUERIES & MUTATIONS
// ==========================================

export function useUserOrders(userId?: string | null, role: 'buyer' | 'seller' = 'buyer', statusFilter?: string) {
  return useQuery({
    queryKey: ['user_orders', userId, role, statusFilter],
    queryFn: () => (userId ? ordersService.getUserOrders(userId, role, statusFilter) : []),
    enabled: Boolean(userId),
    refetchInterval: 10000, // rafraîchissement automatique toutes les 10s
  });
}

/**
 * Décompte des commandes actives (achats + ventes) pour les pastilles de
 * DaloaMarket. Rythme volontairement plus lent que `useUserOrders` : une
 * pastille n'a pas besoin de la fraîcheur d'un écran de suivi.
 */
export function useActiveOrdersCount(userId?: string | null) {
  return useQuery({
    queryKey: ['active_orders_count', userId],
    queryFn: () =>
      userId ? ordersService.countActiveOrders(userId) : { buying: 0, selling: 0, total: 0 },
    enabled: Boolean(userId),
    refetchInterval: 30000,
  });
}

export function useOrderDetail(orderId?: string | null) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => (orderId ? ordersService.getOrderById(orderId) : null),
    enabled: Boolean(orderId),
    refetchInterval: 5000, // rafraîchissement rapide pour le suivi live
  });
}

// ==========================================
// DELIVERY / DRIVER QUERIES & MUTATIONS
// ==========================================

export function useAvailableRuns(driverCoords?: Coordinates | null, isOnline = true) {
  return useQuery({
    queryKey: ['available_runs', driverCoords],
    queryFn: () => deliveryService.getAvailableRuns(driverCoords),
    enabled: isOnline,
    refetchInterval: 6000, // sondage rapide des courses disponibles
  });
}

/**
 * Décompte + aperçu des courses à prendre, pour la pastille d'onglet et la
 * cloche de DaloaDelivery. Clé distincte de `available_runs` (qui dépend de la
 * position du livreur) et sondage plus lent : c'est un indicateur, pas la file.
 */
export function useAvailableRunsBrief(enabled = true) {
  return useQuery({
    queryKey: ['available_runs_brief'],
    queryFn: () => deliveryService.getAvailableRunsBrief(),
    enabled,
    refetchInterval: 15000,
  });
}

export function useActiveDriverRun(driverId?: string | null) {
  return useQuery({
    queryKey: ['active_driver_run', driverId],
    queryFn: () => (driverId ? deliveryService.getActiveRun(driverId) : null),
    enabled: Boolean(driverId),
    refetchInterval: 5000,
  });
}

export function useDriverDailyStats(driverId?: string | null) {
  return useQuery({
    queryKey: ['driver_stats', driverId],
    queryFn: () => (driverId ? deliveryService.getDriverDailyStats(driverId) : null),
    enabled: Boolean(driverId),
  });
}

export function useDeliverersDirectory(vehicleType?: string, zone?: string) {
  return useQuery({
    queryKey: ['deliverers_directory', vehicleType, zone],
    queryFn: () => deliveryService.getDeliverersDirectory(vehicleType, zone),
  });
}

// ==========================================
// CHAT & MESSAGING QUERIES
// ==========================================

/**
 * Boîte de réception en temps réel : un message reçu (ou marqué lu) recharge
 * les conversations et le fil concerné. Remplace le sondage de toute la
 * messagerie toutes les 8 s (et du fil ouvert toutes les 4 s), qui tournait
 * en permanence depuis la barre d'onglets.
 */
export function useInboxRealtime(userId?: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      queryClient.invalidateQueries({ queryKey: ['chat_messages', userId] });
    };
    const channel = supabase
      .channel(`inbox_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export function useConversations(userId?: string | null) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => (userId ? chatService.getConversations(userId) : []),
    enabled: Boolean(userId),
    // Filet de sécurité si la connexion temps réel décroche.
    refetchInterval: 60000,
  });
}

export function useChatMessages(currentUserId?: string | null, partnerId?: string | null, listingId?: string | null) {
  return useQuery({
    queryKey: ['chat_messages', currentUserId, partnerId, listingId || 'support'],
    queryFn: () => (currentUserId && partnerId ? chatService.getMessages(currentUserId, partnerId, listingId) : []),
    enabled: Boolean(currentUserId && partnerId),
    refetchInterval: 30000, // filet de sécurité : le temps réel (useInboxRealtime) recharge à chaque message
  });
}

// ==========================================
// PAYOUTS & REVENUE QUERIES
// ==========================================

export function usePayoutSettings(userId?: string | null) {
  return useQuery({
    queryKey: ['payout_settings', userId],
    queryFn: () => (userId ? payoutService.getPayoutSettings(userId) : null),
    enabled: Boolean(userId),
  });
}

export function usePayoutHistory(userId?: string | null, type?: string) {
  return useQuery({
    queryKey: ['payout_history', userId, type],
    queryFn: () => (userId ? payoutService.getPayoutHistory(userId, type) : []),
    enabled: Boolean(userId),
  });
}

// ==========================================
// AFFILIATIONS & REVIEWS QUERIES
// ==========================================

export function useAffiliatedDeliverers(sellerId?: string | null) {
  return useQuery({
    queryKey: ['affiliated_deliverers', sellerId],
    queryFn: () => (sellerId ? affiliationsService.getSellerAffiliatedDeliverers(sellerId) : []),
    enabled: Boolean(sellerId),
  });
}

export function useReviews(targetType: 'seller' | 'driver' | 'listing', targetId?: string | null) {
  return useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: () => (targetId ? reviewsService.getReviewsForTarget(targetType, targetId) : []),
    enabled: Boolean(targetId),
  });
}
