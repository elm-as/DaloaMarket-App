import {
  ActiveDeliveryRunDetails,
  AvailableDeliveryRun,
  Coordinates,
  DeliveryRunStatus,
} from '@daloa/types';
import { DALOA_CENTER, DALOA_DISTRICT_COORDINATES, PRICING_CONFIG } from '@daloa/config';
import { haversineDistance, isLocationInDaloa } from '@daloa/utils';

/**
 * Part des frais de livraison retenue par la plateforme.
 * Centralisée dans `@daloa/config` (`PRICING_CONFIG.delivery.driverCommissionRate`).
 */
export const PLATFORM_COMMISSION_RATE = PRICING_CONFIG.delivery.driverCommissionRate;

/** Aperçu d'une course à prendre, pour les pastilles et la cloche de l'en-tête. */
export interface AvailableRunBriefItem {
  assignmentId: string;
  pickupLocation: string;
  dropoffLocation: string;
  deliveryPrice: number;
  createdAt: string;
}

export interface AvailableRunsBrief {
  count: number;
  runs: AvailableRunBriefItem[];
}

/**
 * Calcule la commission plateforme prélevée sur le tarif de livraison.
 *
 * @param deliveryPrice Montant brut de la course en FCFA.
 * @returns Montant arrondi de la commission en FCFA.
 */
export const calculatePlatformCommission = (deliveryPrice: number): number =>
  Math.round(deliveryPrice * PLATFORM_COMMISSION_RATE);

/**
 * Extrait adresse et quartier depuis une chaîne formatée « Adresse (Quartier) ».
 * `orders` n'a pas de colonne `delivery_district` dédiée : ce parsing évite de
 * requêter une colonne PostgREST inexistante.
 *
 * @param address Chaîne d'adresse brute issue de `orders.delivery_address`.
 * @returns Objet contenant `address` et `district` nettoyés.
 */
export const parseDropoffAddress = (
  address?: string | null
): { address: string; district: string } => {
  const raw = (address || '').trim();
  const match = raw.match(/^(.*?)\s*\(([^()]+)\)$/);
  return match
    ? { address: match[1].trim(), district: match[2].trim() }
    : { address: raw, district: '' };
};

function resolveDistrictFallback(districtName?: string | null): {
  latitude: number;
  longitude: number;
} | null {
  if (!districtName) return null;
  const map = DALOA_DISTRICT_COORDINATES as Record<
    string,
    { latitude: number; longitude: number } | undefined
  >;
  return map[districtName] || null;
}

function resolveAvailableRunCoords(item: any): {
  pickupCoords: Coordinates;
  dropoffCoords: Coordinates;
} {
  const order = item.orders || {};
  const listing = order.listings || {};
  const seller = order.seller || {};
  const dropoff = parseDropoffAddress(order.delivery_address);

  const isSellerGpsValid =
    seller.shop_latitude != null &&
    seller.shop_longitude != null &&
    isLocationInDaloa(seller.shop_latitude, seller.shop_longitude);

  const sellerFallback =
    resolveDistrictFallback(seller.district) || resolveDistrictFallback(listing.district);

  const pickupCoords: Coordinates = {
    lat: isSellerGpsValid ? seller.shop_latitude : (sellerFallback?.latitude ?? DALOA_CENTER.lat),
    lng: isSellerGpsValid ? seller.shop_longitude : (sellerFallback?.longitude ?? DALOA_CENTER.lng),
  };

  const isOrderGpsValid =
    order.delivery_lat != null &&
    order.delivery_lng != null &&
    isLocationInDaloa(order.delivery_lat, order.delivery_lng);

  const buyerFallback = resolveDistrictFallback(dropoff.district);

  const dropoffCoords: Coordinates = {
    lat: isOrderGpsValid ? order.delivery_lat : (buyerFallback?.latitude ?? DALOA_CENTER.lat),
    lng: isOrderGpsValid ? order.delivery_lng : (buyerFallback?.longitude ?? DALOA_CENTER.lng),
  };

  return { pickupCoords, dropoffCoords };
}

function buildBaseRunFields(
  item: any,
  coords: { pickupCoords: Coordinates; dropoffCoords: Coordinates },
  buyerFallbackName: string
): AvailableDeliveryRun {
  const order = item.orders || {};
  const listing = order.listings || {};
  const seller = order.seller || {};
  const buyer = order.buyer || {};
  const dropoff = parseDropoffAddress(order.delivery_address);

  const distanceKm = haversineDistance(coords.pickupCoords, coords.dropoffCoords);
  const deliveryPrice = Number(item.delivery_price) || 500;
  const driverFee = calculatePlatformCommission(deliveryPrice);

  const isExpress = Boolean(item.is_express || order.order_type === 'express');
  const senderName =
    order.sender_name || item.sender_name || seller.shop_name || seller.full_name || 'Expéditeur';
  const senderPhone = order.sender_phone || item.sender_phone || seller.phone || null;
  const recipientName =
    order.recipient_name || item.recipient_name || buyer.full_name || 'Destinataire';
  const recipientPhone = order.recipient_phone || item.recipient_phone || buyer.phone || null;
  const packageDesc = order.package_description || item.package_description || null;
  const packageType = order.package_type || item.package_type || null;

  return {
    assignmentId: item.id,
    orderId: item.order_id,
    pickupLocation:
      item.pickup_location ||
      `${seller.shop_name || 'Vendeur'} (${seller.district || listing.district || 'Daloa'})`,
    dropoffLocation:
      item.dropoff_location || item.dropoff_address || dropoff.address || 'Adresse client',
    pickupDistrict: seller.district || listing.district || 'Daloa Centre',
    dropoffDistrict: dropoff.district || 'Daloa',
    pickupCoordinates: coords.pickupCoords,
    dropoffCoordinates: coords.dropoffCoords,
    distanceKm: Math.round(distanceKm * 10) / 10,
    deliveryPrice,
    driverFee,
    driverNetGain: deliveryPrice - driverFee,
    isPrivate: item.is_private ?? false,
    sellerName: isExpress ? senderName : seller.shop_name || seller.full_name || 'Vendeur',
    sellerPhone: isExpress ? senderPhone : seller.phone || null,
    buyerName: isExpress ? recipientName : buyer.full_name || buyerFallbackName,
    buyerPhone: isExpress ? recipientPhone : buyer.phone || null,
    productTitle: isExpress ? packageDesc || '⚡ Course Express Daloa' : listing.title,
    productPhoto: listing.photos?.[0] || null,
    createdAt: item.created_at,
    isExpress,
    packageDescription: packageDesc,
    packageType,
    senderName: isExpress ? senderName : undefined,
    senderPhone: isExpress ? senderPhone : undefined,
    recipientName: isExpress ? recipientName : undefined,
    recipientPhone: isExpress ? recipientPhone : undefined,
    payerRole: item.payer_role || order.payer_role || 'sender',
    isCod: Boolean(
      order.payment_method && ['cod', 'cash', 'cash_at_shop'].includes(order.payment_method)
    ),
    buyerCodReliabilityScore:
      buyer.cod_reliability_score != null ? Number(buyer.cod_reliability_score) : null,
    buyerCodDeliveredCount:
      buyer.cod_delivered_count != null ? Number(buyer.cod_delivered_count) : null,
    buyerCodRefusedCount:
      buyer.cod_refused_count != null ? Number(buyer.cod_refused_count) : null,
    isGrouped: Boolean(item.is_grouped || order.is_grouped),
    deliveryGroupId: item.delivery_group_id || order.delivery_group_id || null,
    groupTotalStops: Number(item.group_total_stops) || 1,
    groupCompletedStops: Number(item.group_completed_stops) || 0,
    groupedStops: Array.isArray(item.grouped_stops) ? item.grouped_stops : undefined,
  };
}

/**
 * Transforme une ligne brute `delivery_assignments` en course disponible typée.
 *
 * @param item Enregistrement Supabase avec jointures `orders`, `seller`, `buyer`, `listings`.
 * @returns Course prête pour l'affichage côté livreur.
 */
export function mapAvailableDeliveryRun(item: any): AvailableDeliveryRun {
  const coords = resolveAvailableRunCoords(item);
  return buildBaseRunFields(item, coords, 'Client DaloaMarket');
}

/**
 * Transforme une ligne brute `delivery_assignments` en course active détaillée.
 *
 * @param item Enregistrement Supabase de la course prise en charge par le livreur.
 * @returns Détails de la course active incluant photos, statuts OTP et horodatages.
 */
export function mapActiveDeliveryRun(item: any): ActiveDeliveryRunDetails {
  const order = item.orders || {};
  const seller = order.seller || {};
  const coords = {
    pickupCoords: {
      lat: seller.shop_latitude ?? DALOA_CENTER.lat,
      lng: seller.shop_longitude ?? DALOA_CENTER.lng,
    },
    dropoffCoords: {
      lat: order.delivery_lat ?? DALOA_CENTER.lat,
      lng: order.delivery_lng ?? DALOA_CENTER.lng,
    },
  };

  const base = buildBaseRunFields(item, coords, 'Client');
  return {
    ...base,
    pickupLocation: item.pickup_location,
    status: item.status as DeliveryRunStatus,
    pickupConfirmedBySeller: item.pickup_confirmed_by_seller,
    pickupConfirmedAt: item.pickup_confirmed_at,
    deliveredAt: item.delivered_at,
    pickupPhotoUrl: item.pickup_photo_url,
    deliveryPhotoUrl: item.delivery_photo_url,
  };
}
