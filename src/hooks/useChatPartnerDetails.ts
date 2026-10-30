import { useState, useEffect } from 'react';
import { supabase } from '@daloa/api';

interface ChatPartnerInitialParams {
  partnerId: string;
  partnerName?: string;
  partnerAvatar?: string;
  listingId?: string;
  listingTitle?: string;
  listingPhoto?: string;
  listingPrice?: string;
}

export interface ChatPartnerDetails {
  partnerName: string;
  partnerAvatar: string | null;
  listingId: string | null;
  listingTitle: string | null;
  listingPhoto: string | null;
  listingPrice: string | null;
}

/**
 * Résout et synchronise les métadonnées de la discussion (nom, avatar, annonce liée).
 * Lorsque l'écran est ouvert depuis une notification push ou un lien profond,
 * les paramètres de route peuvent être incomplets. Ce hook interroge la base
 * pour garantir que l'en-tête et l'encart produit s'affichent correctement.
 */
export function useChatPartnerDetails(
  params: ChatPartnerInitialParams,
  messages?: Array<{ listing_id?: string | null }>
): ChatPartnerDetails {
  const {
    partnerId,
    partnerName: initName,
    partnerAvatar: initAvatar,
    listingId: initListingId,
    listingTitle: initTitle,
    listingPhoto: initPhoto,
    listingPrice: initPrice,
  } = params;

  const [partnerName, setPartnerName] = useState<string>(initName || '');
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(initAvatar || null);
  const [listingId, setListingId] = useState<string | null>(
    initListingId && initListingId !== 'support' && initListingId !== 'null' ? initListingId : null
  );
  const [listingTitle, setListingTitle] = useState<string | null>(initTitle || null);
  const [listingPhoto, setListingPhoto] = useState<string | null>(initPhoto || null);
  const [listingPrice, setListingPrice] = useState<string | null>(initPrice || null);

  // 1. Détection automatique de l'annonce depuis l'historique des messages si absente
  useEffect(() => {
    if (listingId || !messages || messages.length === 0) return;
    const msgWithListing = messages.find((m) => m.listing_id && m.listing_id !== 'support');
    if (msgWithListing?.listing_id) {
      setListingId(msgWithListing.listing_id);
    }
  }, [listingId, messages]);

  // 2. Résolution du profil correspondant (nom et avatar)
  useEffect(() => {
    if (!partnerId) return;
    if (partnerName && partnerAvatar) return;

    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, shop_name, avatar_url')
          .eq('id', partnerId)
          .maybeSingle();

        if (error || !data || !isMounted) return;

        const resolvedName = data.shop_name?.trim() || data.full_name || 'Correspondant';
        if (!partnerName && resolvedName) {
          setPartnerName(resolvedName);
        }
        if (!partnerAvatar && data.avatar_url) {
          setPartnerAvatar(data.avatar_url);
        }
      } catch (err) {
        console.warn('[useChatPartnerDetails] Échec chargement profil utilisateur:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [partnerId, partnerName, partnerAvatar]);

  // 3. Résolution des détails de l'annonce liée (titre, photo, prix)
  useEffect(() => {
    if (!listingId || listingId === 'support' || listingId === 'null') return;
    if (listingTitle && listingPhoto && listingPrice) return;

    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, photos, price')
          .eq('id', listingId)
          .maybeSingle();

        if (error || !data || !isMounted) return;

        if (!listingTitle && data.title) {
          setListingTitle(data.title);
        }
        if (!listingPhoto && Array.isArray(data.photos) && data.photos[0]) {
          setListingPhoto(data.photos[0]);
        }
        if (!listingPrice && data.price !== null && data.price !== undefined) {
          setListingPrice(String(data.price));
        }
      } catch (err) {
        console.warn('[useChatPartnerDetails] Échec chargement détails annonce:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [listingId, listingTitle, listingPhoto, listingPrice]);

  return {
    partnerName: partnerName || 'Discussion',
    partnerAvatar,
    listingId,
    listingTitle,
    listingPhoto,
    listingPrice,
  };
}
