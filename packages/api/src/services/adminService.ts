import { supabase } from '../supabase';

/** Éléments en attente d'une action admin (RPC admin_pending_counts, réservée aux admins). */
export interface AdminPendingCounts {
  kyc_a_verifier: number;
  livreurs_sans_pieces: number;
  avis_7j: number;
  avis_sans_reponse: number;
  avis_total: number;
  signalements: number;
  litiges: number;
  messages_contact: number;
  suggestions: number;
  paiements_en_attente: number;
  payouts_en_attente: number;
}

export interface AdminKpis {
  users: number;
  activeListings: number;
  orders: number;
  reports: number;
}

const EMPTY_COUNTS: AdminPendingCounts = {
  kyc_a_verifier: 0,
  livreurs_sans_pieces: 0,
  avis_7j: 0,
  avis_sans_reponse: 0,
  avis_total: 0,
  signalements: 0,
  litiges: 0,
  messages_contact: 0,
  suggestions: 0,
  paiements_en_attente: 0,
  payouts_en_attente: 0,
};

/** Données de la console d'administration mobile : mêmes sources que l'admin du site. */
export const adminService = {
  async getPendingCounts(): Promise<AdminPendingCounts> {
    const { data, error } = await (supabase.rpc as any)('admin_pending_counts');
    if (error) throw error;
    return { ...EMPTY_COUNTS, ...((data as Partial<AdminPendingCounts>) || {}) };
  },

  async getKpis(): Promise<AdminKpis> {
    // `select('id')` et non `*` : les colonnes privées de `users` sont fermées.
    const [users, listings, orders, reports] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
    ]);
    return {
      users: users.count ?? 0,
      activeListings: listings.count ?? 0,
      orders: orders.count ?? 0,
      reports: reports.count ?? 0,
    };
  },
};
