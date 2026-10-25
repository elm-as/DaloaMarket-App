import { supabase } from '../supabase';
import { decodeBase64ToArrayBuffer } from '../lib/base64';

export interface ListingUploadImageInput {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
}

/**
 * Service dédié au stockage et à l'optimisation des photos d'annonces
 */
export const listingMediaService = {
  /**
   * Téléverse une photo d'annonce vers Supabase Storage (bucket `listings`).
   * Gère le format ArrayBuffer pour mobile (React Native) et Blob pour le Web.
   */
  async uploadImage(
    input: string | ListingUploadImageInput,
    folder = 'general'
  ): Promise<string> {
    const photo = typeof input === 'string' ? { uri: input } : input;
    const uri = photo.uri;
    const base64 = 'base64' in photo ? photo.base64 : null;

    let contentType = ('mimeType' in photo && photo.mimeType) || '';
    let body: ArrayBuffer | Blob;

    if (base64) {
      body = decodeBase64ToArrayBuffer(base64);
      if (!contentType) {
        contentType = uri.toLowerCase().endsWith('.png')
          ? 'image/png'
          : uri.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
      }
    } else {
      const response = await fetch(uri);
      const blob = await response.blob();
      if (!blob.size) {
        throw new Error(
          "La photo n'a pas pu être lue sur l'appareil. Reprenez-la puis réessayez."
        );
      }
      body = blob;
      contentType = contentType || blob.type || 'image/jpeg';
    }

    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
      ? 'webp'
      : 'jpg';
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage.from('listings').upload(filename, body, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('Erreur upload image:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from('listings').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },
};
