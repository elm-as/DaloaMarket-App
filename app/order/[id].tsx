import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useOrderDetail, ordersService, antiLapinService, groupedDeliveryService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import {
  colors,
  spacing,
  Button,
  DeliveryCodeCard,
  BottomSheet,
  AppText,
  AppPressable,
  useAccent,
  showAlert,
} from '@daloa/ui';
import {
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Bike,
  Package,
  Truck,
  PartyPopper,
  Store,
} from 'lucide-react-native';
import { formatDate, formatFCFA, Haptics, isPickupMode } from '@daloa/utils';
import { CodRefusalReason } from '@daloa/types';
import { OrderStatusHero } from '../../src/components/orders/OrderStatusHero';
import { CodRefusalSellerModal } from '../../src/components/orders/CodRefusalSellerModal';
import { OrderSellerActionCards } from '../../src/components/orders/OrderSellerActionCards';
import { OrderTrackingSections, OrderItemsListCard } from '../../src/components/orders/OrderTrackingSections';
import { orderTrackingStyles as styles } from '../../src/components/orders/orderTrackingStyles';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { user } = useAuth();

  const { data: order, isLoading, isError, refetch } = useOrderDetail(id);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSellerActing, setIsSellerActing] = useState(false);
  const [enteredPickupOtp, setEnteredPickupOtp] = useState('');
  const [showJourney, setShowJourney] = useState(false);
  const [isCodRefusalOpen, setIsCodRefusalOpen] = useState(false);
  const [isReportingRefusal, setIsReportingRefusal] = useState(false);

  const { data: groupedRun } = useQuery({
    queryKey: ['grouped-run', order?.delivery_group_id],
    enabled: Boolean(order?.is_grouped && order?.delivery_group_id),
    queryFn: () => groupedDeliveryService.getGroupedRunDetails(order!.delivery_group_id!),
  });

  const handleSellerCodRefusal = async (reason: CodRefusalReason, notes?: string) => {
    if (!order) return;
    try {
      setIsReportingRefusal(true);
      await antiLapinService.reportCodRefusal({ orderId: order.id, reason, notes });
      Haptics.warning();
      setIsCodRefusalOpen(false);
      await refetch();
      showAlert('Refus enregistré (Anti-Lapin)', 'La commande a été clôturée et votre stock a été libéré.');
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible d’enregistrer le refus.');
    } finally {
      setIsReportingRefusal(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    showAlert(
      'Annuler cette commande ?',
      "Le coursier n'a pas encore récupéré le colis. Souhaitez-vous vraiment annuler votre commande ?",
      [
        { text: 'Non, conserver', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await ordersService.cancelOrder(order.id, "Annulation demandée par l'acheteur");
              Haptics.success();
              await refetch();
              const isOnlinePaid =
                ['paid', 'confirmed'].includes(order.status) &&
                !['cash_at_shop', 'cod'].includes(order.payment_method ?? '');
              showAlert(
                'Commande annulée',
                isOnlinePaid
                  ? 'Votre commande a été annulée. Votre remboursement Mobile Money est en cours de traitement.'
                  : 'Votre commande a été annulée avec succès.'
              );
            } catch (err: any) {
              if (err?.reason === 'cancellation_limit_reached') {
                showAlert(
                  'Annulations bloquées',
                  err.message ||
                    'Vous avez atteint la limite de 3 annulations consécutives. Contactez le support DaloaMarket pour débloquer votre compte.',
                  [
                    { text: 'Fermer', style: 'cancel' },
                    {
                      text: 'Contacter le support',
                      onPress: () => Linking.openURL('https://wa.me/2250704163361'),
                    },
                  ]
                );
                return;
              }
              showAlert('Erreur', err.message || "Impossible d'annuler cette commande.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!id) return;
    const channel = ordersService.subscribeToOrderUpdates(id, () => refetch());
    return () => {
      channel.unsubscribe();
    };
  }, [id, refetch]);

  const handleReportDispute = async () => {
    if (!disputeReason.trim()) return;
    try {
      setIsSubmitting(true);
      await ordersService.reportDispute(order!.id, disputeReason.trim());
      Haptics.warning();
      setIsDisputeOpen(false);
      refetch();
      showAlert('Litige signalé', "Votre signalement a été transmis à l'équipe de médiation DaloaMarket.");
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de signaler le litige.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAvailability = async () => {
    try {
      setIsSellerActing(true);
      await ordersService.confirmSellerAvailability(order!.id);
      Haptics.success();
      refetch();
      showAlert(
        'Disponibilité confirmée',
        order!.payment_method === 'online'
          ? 'La course est maintenant visible par les livreurs. Préparez le colis.'
          : isPickupMode(order!.delivery_mode)
          ? "Préparez l'article : l'acheteur vient le récupérer et vous paie sur place."
          : "Livrez vous-même ou confiez la course à l'un de vos livreurs affiliés. L'acheteur paie à la réception."
      );
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Confirmation impossible.');
    } finally {
      setIsSellerActing(false);
    }
  };

  const handleDispatchCod = async () => {
    try {
      setIsSellerActing(true);
      await ordersService.dispatchCodOrder(order!.id);
      Haptics.success();
      refetch();
      showAlert('Colis expédié', "L'acheteur est informé que sa commande est en route.");
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Mise à jour impossible.');
    } finally {
      setIsSellerActing(false);
    }
  };

  const handleConfirmCodHandover = () => {
    showAlert(
      'Confirmer la remise ?',
      `Confirmez-vous avoir remis le colis et encaissé ${formatFCFA(order!.total_amount)} ?`,
      [
        { text: 'Pas encore', style: 'cancel' },
        {
          text: 'Oui, encaissé',
          onPress: async () => {
            try {
              setIsSellerActing(true);
              await ordersService.completePickupOrder(order!.id);
              Haptics.success();
              refetch();
              showAlert('Commande clôturée', 'La livraison et l’encaissement sont validés.');
            } catch (err: any) {
              showAlert('Erreur', err.message || 'Validation impossible.');
            } finally {
              setIsSellerActing(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelUnavailable = () => {
    showAlert(
      'Annuler la commande ?',
      "Prévenez l'acheteur : la commande sera annulée et la course libérée. Les annulations répétées pénalisent votre boutique.",
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: "Je n'ai plus l'article",
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSellerActing(true);
              await ordersService.cancelOrderUnavailable(order!.id);
              Haptics.warning();
              refetch();
              showAlert('Commande annulée', "L'acheteur a été informé et sera remboursé.");
            } catch (err: any) {
              showAlert('Erreur', err.message || 'Annulation impossible.');
            } finally {
              setIsSellerActing(false);
            }
          },
        },
      ]
    );
  };

  const handleCompletePickup = async (withOtp: boolean) => {
    if (withOtp && enteredPickupOtp.trim().length < 4) {
      showAlert('Code incomplet', "Saisissez le code communiqué par l'acheteur.");
      return;
    }
    try {
      setIsSellerActing(true);
      await ordersService.completePickupOrder(order!.id, withOtp ? enteredPickupOtp.trim() : undefined);
      Haptics.success();
      setEnteredPickupOtp('');
      refetch();
      showAlert('Retrait validé', 'La commande est marquée remise. Votre virement Mobile Money est programmé.');
    } catch (err: any) {
      showAlert('Validation refusée', err.message || 'Validation impossible.');
    } finally {
      setIsSellerActing(false);
    }
  };

  if (isLoading || (!order && !isError)) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={20} color={colors.text.DEFAULT} />
          </AppPressable>
          <AppText variant="bodyStrong">Suivi en direct</AppText>
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={accent.DEFAULT} />
          <AppText variant="caption" color={colors.text.muted}>Chargement du suivi...</AppText>
        </View>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={20} color={colors.text.DEFAULT} />
          </AppPressable>
          <AppText variant="bodyStrong">Suivi de commande</AppText>
        </View>
        <View style={styles.errorBox}>
          <AlertTriangle size={36} color={colors.status.error} />
          <AppText variant="bodyStrong" color={colors.text.body} center style={{ marginTop: spacing[2] }}>
            Impossible de charger le suivi de cette commande.
          </AppText>
          <AppText variant="caption" color={colors.text.muted} center style={{ marginTop: spacing[1] }}>
            Vérifiez votre connexion internet ou réessayez dans un instant.
          </AppText>
          <Button title="Réessayer" variant="market" onPress={() => refetch()} style={{ marginTop: spacing[4], minWidth: 160 }} />
          <AppPressable onPress={() => router.replace('/(tabs)/orders' as any)} style={{ marginTop: spacing[3], padding: spacing[2] }}>
            <AppText variant="label" color={accent.DEFAULT}>Voir mes commandes</AppText>
          </AppPressable>
        </View>
      </View>
    );
  }

  const assignment = order.delivery_assignment;
  const driver = order.delivery_person;
  const seller = order.seller;
  const deliveryOtp = assignment?.delivery_otp;
  const pickupOtp = assignment?.pickup_otp;
  const isSeller = Boolean(user && seller && user.id === seller.id);
  const listing = order.listing;
  const photoUrl = listing?.photos?.[0];
  const isExpress = (order as any).order_type === 'express';

  const isPickup = isPickupMode(order.delivery_mode);
  const isCod = order.payment_method === 'cod';
  const isCashAtShop = order.payment_method === 'cash_at_shop';
  const isDelivered = order.status === 'delivered' || order.status === 'completed';
  const isClosed = order.status === 'cancelled' || order.status === 'disputed' || assignment?.status === 'disputed';
  const amountLabel = isCod || isCashAtShop ? 'Montant à régler' : 'Montant total séquestré';
  const sellerConfirmed = Boolean(assignment?.pickup_confirmed_by_seller) || !['pending_seller_confirmation', 'pending'].includes(assignment?.status ?? '');

  const steps = isPickup
    ? [
        { key: 'reserved', label: 'Réservation enregistrée', sub: isCashAtShop ? 'Vous réglerez directement en boutique' : 'Montant mis en séquestre sécurisé', icon: CreditCard, done: true },
        { key: 'seller_confirmed', label: 'Article mis de côté', sub: 'Le vendeur a confirmé la disponibilité', icon: Package, done: sellerConfirmed || order.status !== 'pending' },
        { key: 'ready_pickup', label: 'Prêt pour le retrait', sub: 'Rendez-vous en boutique avec votre code', icon: Store, done: sellerConfirmed || order.status !== 'pending' },
        { key: 'delivered', label: 'Article retiré', sub: isCashAtShop ? 'Paiement encaissé en boutique' : 'Fonds débloqués vers le vendeur', icon: PartyPopper, done: isDelivered },
      ]
    : [
        { key: 'paid', label: isCod ? 'Commande enregistrée' : 'Commande payée', sub: isCod ? 'Vous réglerez à la remise du colis' : 'Montant mis en séquestre sécurisé', icon: CreditCard, done: true },
        { key: 'seller_confirmed', label: 'Vendeur prêt', sub: 'Le colis est préparé et disponible', icon: Package, done: sellerConfirmed || ['in_transit', 'delivered', 'completed'].includes(order.status) },
        ...(isCod ? [] : [{ key: 'assigned', label: 'Livreur assigné', sub: 'Un coursier a accepté la course', icon: Bike, done: Boolean(assignment?.delivery_person_id) }]),
        { key: 'in_transit', label: 'En acheminement', sub: 'En route vers votre adresse de livraison', icon: Truck, done: ['picked_up', 'in_transit', 'delivered'].includes(assignment?.status ?? '') || ['in_transit', 'delivered', 'completed'].includes(order.status) },
        { key: 'delivered', label: isCod ? 'Livré & encaissé' : 'Livré & validé', sub: isCod ? 'Paiement remis au livreur' : 'Fonds débloqués vers le vendeur', icon: PartyPopper, done: isDelivered },
      ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
          <ArrowLeft size={20} color={colors.text.DEFAULT} />
        </AppPressable>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.headerThumb} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.headerThumb, styles.headerThumbFallback]}>
            <Package size={18} color={colors.grey[400]} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <AppText variant="bodyStrong" numberOfLines={1}>{listing?.title || 'Commande DaloaMarket'}</AppText>
          <AppText variant="caption" color={colors.text.muted}>#{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at, true)}</AppText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <OrderStatusHero order={order} steps={steps} isSeller={isSeller} userId={user?.id} driverPhone={driver?.phone} />
        <OrderItemsListCard orderItems={(order as any).order_items} />

        {isSeller && (
          <OrderSellerActionCards
            order={order}
            isSellerActing={isSellerActing}
            enteredPickupOtp={enteredPickupOtp}
            onPickupOtpChange={setEnteredPickupOtp}
            onConfirmAvailability={handleConfirmAvailability}
            onCancelUnavailable={handleCancelUnavailable}
            onDispatchCod={handleDispatchCod}
            onConfirmCodHandover={handleConfirmCodHandover}
            onCompletePickup={handleCompletePickup}
            onOpenCodRefusal={() => setIsCodRefusalOpen(true)}
          />
        )}

        {(isSeller || isExpress) && pickupOtp && (assignment?.pickup_confirmed_by_seller || ['awaiting_pickup', 'accepted', 'picked_up'].includes(assignment?.status ?? '')) && (
          <DeliveryCodeCard
            code={pickupOtp}
            type="pickup"
            orderRef={order.id}
            title={isExpress ? 'Code de ramassage (Expéditeur)' : 'Code de ramassage (Vendeur)'}
            subtitle={isExpress ? "Donnez ce code au livreur pour confirmer l'enlèvement du colis." : "Le livreur scanne ce QR code pour confirmer qu'il prend en charge votre colis."}
            style={styles.codeCard}
          />
        )}

        {((!isSeller && order.payment_method === 'online') || isExpress) && deliveryOtp && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <DeliveryCodeCard
            code={deliveryOtp}
            type="delivery"
            orderRef={order.id}
            title={isExpress ? 'Code de remise (Destinataire)' : isPickup ? 'Votre code de retrait' : 'Votre code de remise'}
            subtitle={isExpress ? 'Le destinataire donne ce code au coursier lors de la livraison.' : isPickup ? 'Donnez ce code au vendeur UNIQUEMENT après avoir vérifié votre article.' : 'Donnez ce code au livreur UNIQUEMENT après avoir inspecté votre colis.'}
            style={styles.codeCard}
          />
        )}

        <OrderTrackingSections
          order={order}
          steps={steps}
          isSeller={isSeller}
          isDelivered={isDelivered}
          isClosed={isClosed}
          showJourney={showJourney}
          onToggleJourney={() => setShowJourney((v) => !v)}
          amountLabel={amountLabel}
          groupedRun={groupedRun}
        />

        {!isSeller &&
          !['in_transit', 'picked_up', 'cancelled', 'delivered', 'completed', 'disputed'].includes(order.status) &&
          !['picked_up', 'in_transit', 'delivered', 'auto_released'].includes(assignment?.status ?? '') && (
            <AppPressable onPress={handleCancelOrder} disabled={isSubmitting} style={styles.cancelOrderBtn} accessibilityLabel="Annuler la commande">
              <AppText variant="body" color={colors.status.errorDark} style={styles.cancelOrderText}>Annuler ma commande</AppText>
            </AppPressable>
          )}

        {!['cancelled', 'completed', 'disputed'].includes(order.status) && assignment?.status !== 'disputed' && (
          <AppPressable onPress={() => setIsDisputeOpen(true)} style={styles.disputeBtn}>
            <AlertTriangle size={15} color={colors.status.error} />
            <AppText variant="caption" color={colors.status.error}>Signaler un incident ou ouvrir une médiation</AppText>
          </AppPressable>
        )}

        <View style={{ height: Math.max(insets.bottom, spacing[6]) }} />
      </ScrollView>

      <BottomSheet visible={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} title="Signaler un problème">
        <View style={styles.disputeBody}>
          <AppText variant="body" color={colors.text.muted} style={styles.disputeIntro}>
            Décrivez le motif de votre réclamation : produit non conforme, livreur injoignable, retard anormal…
          </AppText>
          <TextInput
            style={styles.disputeInput}
            multiline
            numberOfLines={4}
            placeholder="Décrivez votre problème ici..."
            placeholderTextColor={colors.text.subtle}
            value={disputeReason}
            onChangeText={setDisputeReason}
            textAlignVertical="top"
          />
          <Button title="Envoyer la réclamation" variant="danger" onPress={handleReportDispute} loading={isSubmitting} fullWidth style={styles.disputeSubmit} />
        </View>
      </BottomSheet>

      <CodRefusalSellerModal visible={isCodRefusalOpen} onClose={() => setIsCodRefusalOpen(false)} onSubmit={handleSellerCodRefusal} loading={isReportingRefusal} />
    </View>
  );
}
