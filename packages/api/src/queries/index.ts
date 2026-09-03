import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

export function useConversations(userId?: string | null) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => (userId ? chatService.getConversations(userId) : []),
    enabled: Boolean(userId),
    refetchInterval: 8000,
  });
}

export function useChatMessages(currentUserId?: string | null, partnerId?: string | null) {
  return useQuery({
    queryKey: ['chat_messages', currentUserId, partnerId],
    queryFn: () => (currentUserId && partnerId ? chatService.getMessages(currentUserId, partnerId) : []),
    enabled: Boolean(currentUserId && partnerId),
    refetchInterval: 4000,
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

export function usePayoutHistory(userId?: string | null) {
  return useQuery({
    queryKey: ['payout_history', userId],
    queryFn: () => (userId ? payoutService.getPayoutHistory(userId) : []),
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
