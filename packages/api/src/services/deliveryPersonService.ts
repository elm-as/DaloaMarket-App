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
  licence_url?: string | null;
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
  licence_url: string | null;
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
   * Téléverse une photo de profil livreur vers le bucket public livreur-photos.
   * Compatible binaire base64 pour éviter les échecs de blob sur Android.
   */
  async uploadProfilePhoto(
    input: string | { fileUri?: string; base64?: string | null; mimeType?: string },
    userId: string
  ): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.jpg`;

    const fileUri = typeof input === 'string' ? input : input.fileUri;
    const base64 = typeof input === 'object' ? input.base64 : null;
    const mimeType = (typeof input === 'object' && input.mimeType) || 'image/jpeg';

    let bodyData: ArrayBuffer | Blob;

    if (base64) {
      bodyData = decodeBase64ToArrayBuffer(base64);
    } else if (fileUri) {
      const response = await fetch(fileUri);
      bodyData = await response.blob();
    } else {
      throw new Error('Aucune photo fournie pour le livreur.');
    }

    const { error: uploadError } = await supabase.storage
      .from('livreur-photos')
      .upload(fileName, bodyData, {
        contentType: mimeType,
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

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleaned = base64.replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s/g, '');
  const atobFn =
    typeof atob === 'function'
      ? atob
      : typeof global !== 'undefined' && typeof (global as any).atob === 'function'
      ? (global as any).atob
      : null;

  if (atobFn) {
    const binary = atobFn(cleaned);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  let bufferLength = cleaned.length * 0.75;
  if (cleaned.endsWith('==')) bufferLength -= 2;
  else if (cleaned.endsWith('=')) bufferLength -= 1;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const enc1 = BASE64_CHARS.indexOf(cleaned[i]);
    const enc2 = BASE64_CHARS.indexOf(cleaned[i + 1]);
    const enc3 = BASE64_CHARS.indexOf(cleaned[i + 2]);
    const enc4 = BASE64_CHARS.indexOf(cleaned[i + 3]);
    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (enc3 !== 64 && enc3 !== -1) bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    if (enc4 !== 64 && enc4 !== -1) bytes[p++] = ((enc3 & 3) << 6) | enc4;
  }
  return bytes.buffer;
}
