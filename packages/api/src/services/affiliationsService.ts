import { supabase } from '../supabase';

function normalizeIvorianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('225') && digits.length === 13) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `+225${digits.slice(1)}`;
  if (digits.length === 9) return `+225${digits}`;
  return raw;
}

export const affiliationsService = {
  async getSellerAffiliatedDeliverers(sellerId: string) {
    const { data, error } = await supabase
      .from('affiliated_deliverers')
      .select('*, delivery_persons(*)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

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

  async updateAffiliationStatus(affiliationId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('affiliated_deliverers')
      .update({ status })
      .eq('id', affiliationId);

    if (error) throw error;
  },

  async inviteByPhone(sellerId: string, rawPhone: string): Promise<{ success: boolean; message: string }> {
    const normalized = normalizeIvorianPhone(rawPhone);

    const { data: person } = await supabase
      .from('delivery_persons')
      .select('id, name, phone, vehicle_type, photo_url')
      .or(`phone.eq.${rawPhone},phone.eq.${normalized}`)
      .maybeSingle();

    if (!person) {
      return { success: false, message: "Aucun livreur DaloaDelivery trouvé avec ce numéro." };
    }

    const { data: existing } = await supabase
      .from('affiliated_deliverers')
      .select('id, status')
      .eq('seller_id', sellerId)
      .eq('delivery_person_id', person.id)
      .maybeSingle();

    if (existing) {
      const msg = existing.status === 'pending'
        ? "Une invitation est déjà en attente pour ce livreur."
        : "Ce livreur est déjà affilié à votre boutique.";
      return { success: false, message: msg };
    }

    const { error } = await supabase
      .from('affiliated_deliverers')
      .insert({ seller_id: sellerId, delivery_person_id: person.id, status: 'pending' });

    if (error) throw error;
    return { success: true, message: `Invitation envoyée à ${person.name} !` };
  },

  async removeAffiliation(affiliationId: string): Promise<void> {
    const { error } = await supabase
      .from('affiliated_deliverers')
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
