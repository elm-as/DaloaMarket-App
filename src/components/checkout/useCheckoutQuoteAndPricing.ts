import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  calculateOrderBreakdown,
  calculateDeliveryFee,
  calculateGroupedDeliveryQuote,
  PRICING_CONFIG,
} from '@daloa/config';
import { resolveSellerPoint, resolveBuyerPoint, resolveBillableDistanceKm } from '@daloa/utils';
import { supabase, quoteService } from '@daloa/api';
import type { AppliedMobilePromo } from './PromoCodeBox';
import type { PaymentMode } from './PaymentMethodSelector';

interface QuoteAndPricingParams {
  isCartMode: boolean;
  cartItems: any[];
  listing: any;
  listingId?: string;
  variantId?: string;
  activePrice: number;
  quantity: number;
  cartProductTotal: number;
  cartQtyTotal: number;
  cartSellerCount: number;
  deliveryMode: 'delivery' | 'pickup';
  paymentMode: PaymentMode;
  deliveryDistrict: string;
  deliveryCoords: { latitude: number; longitude: number } | null;
  deliveryAddress: string;
  step: 1 | 2 | 3;
  isAuthenticated: boolean;
  sellerFeeOverride?: number | null;
  appliedPromo: AppliedMobilePromo | null;
}

export function useCheckoutQuoteAndPricing(params: QuoteAndPricingParams) {
  const {
    isCartMode,
    cartItems,
    listing,
    listingId,
    variantId,
    activePrice,
    quantity,
    cartProductTotal,
    cartQtyTotal,
    cartSellerCount,
    deliveryMode,
    paymentMode,
    deliveryDistrict,
    deliveryCoords,
    deliveryAddress,
    step,
    isAuthenticated,
    sellerFeeOverride,
    appliedPromo,
  } = params;

  const [distanceKm, setDistanceKm] = useState<number>(2.5);
  const [cartDeliveryFees, setCartDeliveryFees] = useState<number[] | null>(null);

  const baseListing: any = isCartMode ? cartItems[0]?.listing : listing;
  const sellerId: string | undefined = baseListing?.user_id || baseListing?.seller?.id;

  const { data: sellerPlace } = useQuery({
    queryKey: ['seller-point', sellerId],
    enabled: Boolean(sellerId),
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('shop_latitude, shop_longitude, district')
        .eq('id', sellerId as string)
        .maybeSingle();
      return data ?? null;
    },
  });

  const sellerCoords = useMemo(() => {
    if (!baseListing) return resolveSellerPoint(null);
    return resolveSellerPoint(
      sellerPlace
        ? { latitude: baseListing.latitude, longitude: baseListing.longitude, district: baseListing.district, seller: sellerPlace }
        : baseListing
    );
  }, [baseListing, sellerPlace]);

  const cartSellerIds = useMemo(
    () =>
      Array.from(
        new Set(cartItems.map((ci) => ci.listing.user_id || ci.listing.seller?.id).filter(Boolean))
      ) as string[],
    [cartItems]
  );

  const { data: cartSellerPlaces } = useQuery({
    queryKey: ['seller-points', cartSellerIds],
    enabled: isCartMode && cartSellerIds.length > 0,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, shop_latitude, shop_longitude, district')
        .in('id', cartSellerIds);
      return (data ?? []) as { id: string; shop_latitude: number | null; shop_longitude: number | null; district: string | null }[];
    },
  });

  useEffect(() => {
    if (isCartMode) return;
    let active = true;
    const buyerPoint = resolveBuyerPoint(deliveryCoords, deliveryDistrict);

    resolveBillableDistanceKm(sellerCoords, buyerPoint).then((calculatedDistance) => {
      if (active && calculatedDistance > 0) setDistanceKm(calculatedDistance);
    });

    return () => {
      active = false;
    };
  }, [isCartMode, sellerCoords, deliveryCoords, deliveryDistrict]);

  useEffect(() => {
    if (!isCartMode || !cartSellerPlaces || cartSellerPlaces.length === 0) {
      setCartDeliveryFees(null);
      return;
    }
    let active = true;
    const buyerPoint = resolveBuyerPoint(deliveryCoords, deliveryDistrict);

    Promise.all(
      cartSellerPlaces.map(async (place) => {
        const km = await resolveBillableDistanceKm(resolveSellerPoint({ seller: place }), buyerPoint);
        return { km, fee: calculateDeliveryFee(km) };
      })
    ).then((rows) => {
      if (!active) return;
      setCartDeliveryFees(rows.map((r) => r.fee));
      setDistanceKm(Math.max(...rows.map((r) => r.km)));
    });

    return () => {
      active = false;
    };
  }, [isCartMode, cartSellerPlaces, deliveryCoords, deliveryDistrict]);

  const rawCartFees = useMemo(
    () => cartDeliveryFees ?? Array(Math.max(1, cartSellerCount)).fill(PRICING_CONFIG.delivery.baseFee),
    [cartDeliveryFees, cartSellerCount]
  );

  const groupedQuote = useMemo(() => {
    if (!isCartMode || cartSellerCount <= 1 || deliveryMode === 'pickup') return null;
    return calculateGroupedDeliveryQuote(rawCartFees);
  }, [isCartMode, cartSellerCount, deliveryMode, rawCartFees]);

  const groupedSavings = groupedQuote?.savings ?? 0;
  const estimatedCartDelivery =
    deliveryMode === 'pickup'
      ? 0
      : groupedQuote
        ? groupedQuote.totalGroupedFee
        : rawCartFees.reduce((sum, fee) => sum + fee, 0);

  const isCashPayment = paymentMode === 'cash_at_shop' || paymentMode === 'cod' || deliveryMode === 'pickup';
  const cartBuyerServiceFee = isCashPayment
    ? 0
    : cartItems.reduce(
        (s, ci) =>
          s + Math.round((ci.variant?.price ?? ci.listing.price) * ci.quantity * PRICING_CONFIG.marketplace.buyerServiceFeeRate),
        0
      );

  const breakdown = isCartMode
    ? {
        productPrice: cartProductTotal,
        quantity: cartQtyTotal,
        productSubtotal: cartProductTotal,
        deliveryFee: estimatedCartDelivery,
        buyerServiceFee: cartBuyerServiceFee,
        groupedDeliveryDiscount: groupedSavings,
        totalAmount: cartProductTotal + estimatedCartDelivery + cartBuyerServiceFee,
        sellerCommission: 0,
        sellerNetPayout: cartProductTotal,
        driverFee: 0,
        driverNetPayout: estimatedCartDelivery,
      }
    : calculateOrderBreakdown({
        productPrice: activePrice,
        quantity,
        distanceKm,
        deliveryMode,
        paymentMethod: paymentMode,
        isProSeller: Boolean(listing?.seller?.pro_until && new Date(listing.seller.pro_until) > new Date()),
        sellerFeeOverride: sellerFeeOverride ?? null,
      });

  const quoteItems = useMemo(
    () =>
      isCartMode
        ? cartItems.map((ci) => ({
            listing_id: ci.listing.id,
            variant_id: ci.variant?.id || null,
            quantity: ci.quantity,
          }))
        : listingId
          ? [{ listing_id: listingId, variant_id: variantId || null, quantity }]
          : [],
    [isCartMode, cartItems, listingId, variantId, quantity]
  );

  const {
    data: serverQuote,
    isFetching: isQuoteLoading,
    isError: isQuoteError,
    error: quoteError,
    refetch: refetchQuote,
  } = useQuery({
    queryKey: [
      'order-quote',
      JSON.stringify(quoteItems),
      deliveryMode,
      paymentMode,
      deliveryCoords?.latitude?.toFixed(5),
      deliveryCoords?.longitude?.toFixed(5),
      deliveryDistrict,
      deliveryAddress.trim(),
    ],
    enabled: step === 3 && isAuthenticated && quoteItems.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 0,
    retry: 1,
    queryFn: () => {
      const resolvedBuyerPoint = resolveBuyerPoint(deliveryCoords, deliveryDistrict);
      return quoteService.getQuote({
        items: quoteItems,
        deliveryMode,
        paymentMethod: paymentMode,
        deliveryLat: resolvedBuyerPoint.latitude,
        deliveryLng: resolvedBuyerPoint.longitude,
        deliveryDistrict,
        deliveryAddress: deliveryMode === 'delivery' ? deliveryAddress.trim() : 'Retrait direct en boutique',
      });
    },
  });

  const quoteIsTechnicalFailure = isQuoteError && !(quoteError as { reason?: string } | null)?.reason;
  const priceStatus: 'loading' | 'error' | 'ready' =
    serverQuote && !isQuoteLoading
      ? 'ready'
      : isQuoteError && !isQuoteLoading
        ? quoteIsTechnicalFailure
          ? 'ready'
          : 'error'
        : 'loading';

  const currentDeliveryFee = serverQuote ? serverQuote.deliveryTotal : breakdown.deliveryFee;
  const currentBuyerServiceFee = isCashPayment
    ? 0
    : serverQuote
      ? serverQuote.buyerFeeTotal
      : breakdown.buyerServiceFee;
  const currentTotalAmount = isCashPayment
    ? (isCartMode ? cartProductTotal : activePrice * quantity) + currentDeliveryFee
    : serverQuote
      ? serverQuote.totalAmount
      : breakdown.totalAmount;
  const daloaCashDiscount = appliedPromo ? Math.min(appliedPromo.discountAmount, currentTotalAmount) : 0;
  const effectiveTotalAmount = Math.max(0, currentTotalAmount - daloaCashDiscount);

  return {
    distanceKm,
    sellerCoords,
    groupedSavings,
    breakdown,
    serverQuote,
    isQuoteLoading,
    isQuoteError,
    quoteError,
    refetchQuote,
    priceStatus,
    currentDeliveryFee,
    currentBuyerServiceFee,
    daloaCashDiscount,
    effectiveTotalAmount,
  };
}
