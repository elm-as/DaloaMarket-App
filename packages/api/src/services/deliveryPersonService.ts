import { supabase } from '../supabase';

export interface CreateDeliveryPersonPayload {
  user_id: string;
  name: string;
  phone: string;
  photo_url?: string | null;
  is_available?: boolean;
  vehicle_type: string;
  vehicle_details?: string;
  coverage_zones: string[];
  pricing_description?: string;
  description?: string;
  current_location?: { latitude: number; longitude: number } | null;
  payout_network?: string | null;
  payout_number?: string | null;
  cni_url?: string | null;
  selfie_cni_url?: string | null;
  portrait_live_url?: string | null;
}

export interface DeliveryPersonProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  is_available: boolean;
  vehicle_type: string;
  vehicle_details: string | null;
  coverage_zones: string[];
  pricing_description: string | null;
  rating: number;
  total_reviews: number;
  payout_network: string | null;
  payout_number: string | null;
  cni_url: string | null;
  selfie_cni_url: string | null;
  portrait_live_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Service gérant le cycle de vie du profil livreur (delivery_persons).
 * Identique au service Web DaloaDelivery.
 */
export const deliveryPersonService = {
  /**
   * Crée un profil de livreur officiel dans delivery_persons
   */
  async createDeliveryPerson(payload: CreateDeliveryPersonPayload): Promise<DeliveryPersonProfile> {
    const { data, error } = await supabase
      .from('delivery_persons')
      .insert({
        user_id: payload.user_id,
        name: payload.name,
        phone: payload.phone,
        photo_url: payload.photo_url || null,
        is_available: payload.is_available ?? true,
        vehicle_type: payload.vehicle_type,
        vehicle_details: payload.vehicle_details || '',
        coverage_zones: payload.coverage_zones,
        pricing_description: payload.pricing_description || '',
        description: payload.description || '',
        current_location: payload.current_location || null,
        payout_network: payload.payout_network || null,
        payout_number: payload.payout_number || null,
        rating: 0,
        total_reviews: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur createDeliveryPerson:', error);
      throw error;
    }
    return data as DeliveryPersonProfile;
  },

  /**
   * Met à jour le profil d'un livreur
   */
  async updateDeliveryPerson(
    id: string,
    updates: Partial<Omit<DeliveryPersonProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<DeliveryPersonProfile> {
    const { data, error } = await supabase
      .from('delivery_persons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur updateDeliveryPerson:', error);
      throw error;
    }
    return data as DeliveryPersonProfile;
  },

  /**
   * Récupère le profil livreur via l'identifiant utilisateur auth
   */
  async getDeliveryPersonByUserId(userId: string): Promise<DeliveryPersonProfile | null> {
    const { data, error } = await supabase
      .from('delivery_persons')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erreur getDeliveryPersonByUserId:', error);
      throw error;
    }
    return data as DeliveryPersonProfile | null;
  },

  /**
   * Récupère le profil livreur par son ID
   */
  async getDeliveryPersonById(id: string): Promise<DeliveryPersonProfile | null> {
    const { data, error } = await supabase
      .from('delivery_persons_directory')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur getDeliveryPersonById:', error);
      throw error;
    }
    return data as DeliveryPersonProfile | null;
  },

  /**
   * Modifie la disponibilité du livreur
   */
  async toggleAvailability(id: string, isAvailable: boolean): Promise<DeliveryPersonProfile> {
    return this.updateDeliveryPerson(id, { is_available: isAvailable });
  },

  /**
   * Téléverse une photo de profil livreur vers le bucket public livreur-photos
   */
  async uploadProfilePhoto(fileUri: string, userId: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.jpg`;

    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Impossible de lire la photo locale: ${fileUri}`);
    }
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('livreur-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload photo livreur échoué:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('livreur-photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },
};
