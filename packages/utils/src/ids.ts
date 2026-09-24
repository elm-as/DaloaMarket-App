/**
 * Identifiant UUID v4.
 *
 * Sert aux variantes d'annonce, stockées dans `listings.variants` (JSON) : tout
 * le parcours d'achat retrouve une variante par son `id`, et `create_cod_order`
 * ne le reprend dans `order_items.variant_id` que s'il a la forme d'un UUID.
 * Hermes ne fournit pas `crypto.randomUUID` ; l'unicité n'a besoin de tenir
 * qu'au sein d'une annonce, `Math.random` suffit.
 */
export function generateUuidV4(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
