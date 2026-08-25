import { supabase } from '../supabase';

export const affiliationsService = {
  /**
   * Récupère les livreurs affiliés à une boutique
   */
  async getSellerAffiliatedDeliverers(sellerId: string) {
    const { data, error } = await supabase
      .from('affiliated_deliverers')
      .select('*, delivery_persons(*)')
      .eq('seller_id', sellerId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Demande une affiliation entre un vendeur et un livreur
   */
  async requestAffiliation(sellerId: string, deliveryPersonId: string, customFee?: number | null) {
    const { data, error } = await supabase
      .from('affiliated_deliverers')
      .upsert({
        seller_id: sellerId,
        delivery_person_id: deliveryPersonId,
        custom_delivery_fee: customFee || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Accepte ou refuse une demande d'affiliation (côté livreur)
   */
  async updateAffiliationStatus(affiliationId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('affiliated_deliverers')
      .update({ status })
      .eq('id', affiliationId);

    if (error) throw error;
  },
};
