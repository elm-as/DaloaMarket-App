import { supabase, decodeBase64ToArrayBuffer } from '@daloa/api';

/**
 * Téléverse un asset d'image (bannière ou logo de boutique) vers Supabase Storage.
 * En React Native, fetch(file://...).blob() renvoie un corps vide.
 * On utilise le base64 fourni par Expo ImagePicker (`base64: true`).
 */
export async function uploadShopAsset(
  userId: string,
  asset: { uri: string; base64?: string | null; mimeType?: string | null },
  bucket: string
): Promise<string | null> {
  let mimeType = asset.mimeType || '';
  let body: ArrayBuffer | Blob;

  if (asset.base64) {
    body = decodeBase64ToArrayBuffer(asset.base64);
    if (!mimeType) {
      mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    }
  } else {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    if (!blob.size) {
      throw new Error("L'image n'a pas pu être lue sur l'appareil. Réessayez.");
    }
    body = blob;
    mimeType = mimeType || blob.type || 'image/jpeg';
  }

  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
