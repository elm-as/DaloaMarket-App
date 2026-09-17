/**
 * Decodage base64 -> ArrayBuffer, extrait de `authService.uploadAvatar`.
 *
 * React Native ne fournit pas de Blob exploitable par supabase-js a partir d'une
 * URI locale (`fetch(file://...).blob()` renvoie un corps vide ou tronque). Tous
 * les televersements depuis le mobile doivent donc passer par un ArrayBuffer.
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
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
