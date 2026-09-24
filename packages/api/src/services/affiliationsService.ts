import { supabase } from '../supabase';

/*
 * Livreurs affiliés d'un vendeur.
 *
 * Ce service interrogeait une table `affiliated_deliverers` qui n'existe pas :
 * l'écran « Mes livreurs » de l'app était entièrement en erreur. La table
 * réelle est `seller_delivery_affiliations` (statuts pending | active |
 * rejected), la même que celle du web et de l'app livreur.
 */
export const affiliationsService = {
  async getSellerAffiliatedDeliverers(sellerId: string) {
    const { data, error } = await supabase
      .from('seller_delivery_affiliations')
      .select(
        'id, seller_id, delivery_person_id, status, created_at, delivery_persons(id, name, phone, photo_url, is_available, vehicle_type, rating)'
      )
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // La relation revient en tableau ou en objet selon le client : un seul livreur par ligne.
    return (data || []).map((row) => ({
      ...row,
      delivery_persons: Array.isArray(row.delivery_persons) ? row.delivery_persons[0] ?? null : row.delivery_persons,
    }));
  },

  /**
   * Invite un livreur par son numéro. La RPC vérifie le droit du vendeur
   * (Pro ou phase de lancement), retrouve le livreur et crée la demande.
   */
  async inviteByPhone(_sellerId: string, rawPhone: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('invite_delivery_driver_by_phone', {
      p_phone: rawPhone.trim(),
    });
    if (error) throw error;

    const res = data as { success?: boolean; message?: string } | null;
    return {
      success: !!res?.success,
      message:
        res?.message ||
        (res?.success
          ? 'Invitation envoyée.'
          : "Aucun livreur DaloaDelivery trouvé avec ce numéro."),
    };
  },

  async removeAffiliation(affiliationId: string): Promise<void> {
    const { error } = await supabase
      .from('seller_delivery_affiliations')
      .delete()
      .eq('id', affiliationId);

    if (error) throw error;
  },

  async getDeliverySettings(sellerId: string) {
    const { data } = await supabase
      .from('seller_delivery_settings')
      .select('home_delivery_enabled, cash_on_delivery_enabled')
      .eq('seller_id', sellerId)
      .maybeSingle();

    return data ?? { home_delivery_enabled: true, cash_on_delivery_enabled: false };
  },

  async updateDeliverySettings(sellerId: string, homeDelivery: boolean, cod: boolean): Promise<void> {
    const { error } = await supabase
      .from('seller_delivery_settings')
      .upsert({ seller_id: sellerId, home_delivery_enabled: homeDelivery, cash_on_delivery_enabled: cod });

    if (error) throw error;
  },
};
