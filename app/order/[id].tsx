import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderDetail, ordersService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, Button, Avatar, RatingStars, DeliveryCodeCard, BottomSheet, AppText, AppPressable, useAccent, typography, showAlert } from '@daloa/ui';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  PhoneCall,
  AlertTriangle,
  CreditCard,
  Bike,
  Package,
  Truck,
  PartyPopper,
  MapPin,
  ShieldCheck,
  Store,
  Route,
  ChevronDown,
} from 'lucide-react-native';
import { formatDate, formatFCFA, Haptics, isPickupMode } from '@daloa/utils';
import { OrderStatusHero } from '../../src/components/orders/OrderStatusHero';

/* ─── SummaryRow ──────────────────────────────────────────────────── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText variant="body" color={colors.text.muted} style={styles.summaryLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" numberOfLines={2} style={styles.summaryValue}>
        {value}
      </AppText>
    </View>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */
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
    return () => { channel.unsubscribe(); };
  }, [id, refetch]);

  const handleReportDispute = async () => {
    if (!disputeReason.trim()) return;
    try {
      setIsSubmitting(true);
      await ordersService.reportDispute(order!.id, disputeReason.trim());
      Haptics.warning();
      setIsDisputeOpen(false);
      refetch();
      showAlert(
        'Litige signalé',
        "Votre signalement a été transmis à l'équipe de médiation DaloaMarket."
      );
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de signaler le litige.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Actions vendeur ─────────────────────────────────────────────── */

  const handleConfirmAvailability = async () => {
    try {
      setIsSellerActing(true);
      await ordersService.confirmSellerAvailability(order!.id);
      Haptics.success();
      refetch();
      showAlert(
        'Disponibilité confirmée',
        'La course est maintenant visible par les livreurs. Préparez le colis.'
      );
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Confirmation impossible.');
    } finally {
      setIsSellerActing(false);
    }
  };

  /** Pendant mobile de `SellerSection.handleDispatchCodOrder` du web (scénario COD). */
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

  /** Pendant mobile de `SellerSection.handleConfirmDirectHandover` du web (encaissement COD). */
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

  /** Pendant mobile de `SellerSection.handleCancelUnavailable` du web. */
  const handleCancelUnavailable = () => {
    showAlert(
      "Annuler la commande ?",
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
      await ordersService.completePickupOrder(
        order!.id,
        withOtp ? enteredPickupOtp.trim() : undefined
      );
      Haptics.success();
      setEnteredPickupOtp('');
      refetch();
      showAlert(
        'Retrait validé',
        'La commande est marquée remise. Votre virement Mobile Money est programmé.'
      );
    } catch (err: any) {
      showAlert('Validation refusée', err.message || 'Validation impossible.');
    } finally {
      setIsSellerActing(false);
    }
  };

  /* 1. Loading skeleton (pendant le chargement initial ou tant que la commande n'est pas résolue sans erreur) */
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
          <AppText variant="caption" color={colors.text.muted}>
            Chargement du suivi...
          </AppText>
        </View>
      </View>
    );
  }

  /* 2. État d'erreur / commande introuvable (seulement après fin du chargement et confirmation d'erreur) */
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
          <Button
            title="Réessayer"
            variant="market"
            onPress={() => refetch()}
            style={{ marginTop: spacing[4], minWidth: 160 }}
          />
          <AppPressable
            onPress={() => router.replace('/(tabs)/orders' as any)}
            style={{ marginTop: spacing[3], padding: spacing[2] }}
          >
            <AppText variant="label" color={accent.DEFAULT}>
              Voir mes commandes
            </AppText>
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

  /* Timeline steps */
  /*
   * Trois parcours distincts, comme sur le web (`OrderStatusTimeline`) :
   * retrait en boutique, livraison payée à l'avance, livraison payée à la remise.
   * Le même tableau servait auparavant à tous les modes, si bien qu'un retrait en
   * boutique affichait « Livreur assigné » et « En acheminement » — des étapes qui
   * n'arrivent jamais sans coursier. Le premier jalon parlait aussi de séquestre y
   * compris pour des commandes qui n'en ont aucun.
   */
  const isPickup = isPickupMode(order.delivery_mode);
  const isCod = order.payment_method === 'cod';
  const isCashAtShop = order.payment_method === 'cash_at_shop';
  const isDelivered = order.status === 'delivered' || order.status === 'completed';
  const isClosed = order.status === 'cancelled' || order.status === 'disputed' || assignment?.status === 'disputed';
  // Aucun séquestre en COD ni en paiement boutique : afficher « séquestré » y était trompeur.
  const amountLabel =
    isCod || isCashAtShop ? 'Montant à régler' : 'Montant total séquestré';
  const sellerConfirmed =
    Boolean(assignment?.pickup_confirmed_by_seller) ||
    !['pending_seller_confirmation', 'pending'].includes(assignment?.status ?? '');

  const steps = isPickup
    ? [
        {
          key: 'reserved',
          label: 'Réservation enregistrée',
          sub: isCashAtShop
            ? 'Vous réglerez directement en boutique'
            : 'Montant mis en séquestre sécurisé',
          icon: CreditCard,
          done: true,
        },
        {
          key: 'seller_confirmed',
          label: 'Article mis de côté',
          sub: 'Le vendeur a confirmé la disponibilité',
          icon: Package,
          done: sellerConfirmed || order.status !== 'pending',
        },
        {
          key: 'ready_pickup',
          label: 'Prêt pour le retrait',
          sub: 'Rendez-vous en boutique avec votre code',
          icon: Store,
          done: sellerConfirmed || order.status !== 'pending',
        },
        {
          key: 'delivered',
          label: 'Article retiré',
          sub: isCashAtShop
            ? 'Paiement encaissé en boutique'
            : 'Fonds débloqués vers le vendeur',
          icon: PartyPopper,
          done: isDelivered,
        },
      ]
    : [
        {
          key: 'paid',
          label: isCod ? 'Commande enregistrée' : 'Commande payée',
          sub: isCod
            ? 'Vous réglerez à la remise du colis'
            : 'Montant mis en séquestre sécurisé',
          icon: CreditCard,
          done: true,
        },
        {
          key: 'seller_confirmed',
          label: 'Vendeur prêt',
          sub: 'Le colis est préparé et disponible',
          icon: Package,
          done: sellerConfirmed || ['in_transit', 'delivered', 'completed'].includes(order.status),
        },
        ...(isCod
          ? []
          : [
              {
                key: 'assigned',
                label: 'Livreur assigné',
                sub: 'Un coursier a accepté la course',
                icon: Bike,
                done: Boolean(assignment?.delivery_person_id),
              },
            ]),
        {
          key: 'in_transit',
          label: 'En acheminement',
          sub: 'En route vers votre adresse de livraison',
          icon: Truck,
          // `verify_pickup` écrit `in_transit`, jamais `picked_up`.
          done:
            ['picked_up', 'in_transit', 'delivered'].includes(assignment?.status ?? '') ||
            ['in_transit', 'delivered', 'completed'].includes(order.status),
        },
        {
          key: 'delivered',
          label: isCod ? 'Livré & encaissé' : 'Livré & validé',
          sub: isCod ? 'Paiement remis au livreur' : 'Fonds débloqués vers le vendeur',
          icon: PartyPopper,
          done: isDelivered,
        },
      ];

  const firstPendingIdx = steps.findIndex((s) => !s.done);

  return (
    <View style={styles.container}>
      {/* ── En-tête sobre : le statut et le montant sont dans l'encadré d'état et le récapitulatif ── */}
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
          <AppText variant="bodyStrong" numberOfLines={1}>
            {listing?.title || 'Commande DaloaMarket'}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at, true)}
          </AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── État de la commande ── */}
        <OrderStatusHero
          order={order}
          steps={steps}
          isSeller={isSeller}
          userId={user?.id}
          driverPhone={driver?.phone}
        />

        {/* ── Articles de la commande (multi-articles) ── */}
        {Array.isArray((order as any).order_items) && (order as any).order_items.length > 1 && (
          <View style={styles.itemsCard}>
            <AppText variant="bodyStrong" style={styles.itemsTitle}>
              Articles ({(order as any).order_items.length})
            </AppText>
            {(order as any).order_items.map((it: any) => (
              <View key={it.id} style={styles.itemRow}>
                <Image
                  source={{ uri: it.listing?.photos?.[0] }}
                  style={styles.itemThumb}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.itemInfo}>
                  <AppText variant="caption" numberOfLines={2}>
                    {it.listing?.title || 'Article'}
                    {it.variant_label ? ` · ${it.variant_label}` : ''}
                  </AppText>
                  <AppText variant="caption" color={colors.text.muted}>
                    {formatFCFA(it.unit_price)} × {it.quantity}
                  </AppText>
                </View>
                <AppText variant="bodyStrong" color={accent[600]}>
                  {formatFCFA(it.product_amount)}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {/* ── Actions vendeur : confirmation de disponibilité ── */}
        {isSeller &&
          !isPickup &&
          !isCod &&
          (assignment?.status === 'pending_seller_confirmation' ||
            assignment?.status === 'pending') && (
            <View style={styles.sellerActionCard}>
              <View style={styles.sellerActionHeader}>
                <Package size={18} color={accent[600]} />
                <AppText variant="bodyStrong" color={accent[700]}>
                  Confirmez que vous avez l’article
                </AppText>
              </View>
              <AppText variant="caption" color={colors.text.muted}>
                Aucun livreur ne peut prendre cette course avant votre confirmation.
                Cela évite qu’un livreur se déplace pour un article indisponible.
              </AppText>
              <Button
                title="J’ai l’article : Confirmer"
                variant="market"
                size="md"
                loading={isSellerActing}
                onPress={handleConfirmAvailability}
                leftIcon={<CheckCircle2 size={16} color={colors.text.inverse} />}
                fullWidth
                style={styles.verifyBtn}
              />
              <Button
                title="Je n'ai plus le produit : annuler"
                variant="ghost"
                size="sm"
                disabled={isSellerActing}
                onPress={handleCancelUnavailable}
                fullWidth
              />
            </View>
          )}

        {/* ── Actions vendeur : paiement à la livraison (aucun séquestre, aucun coursier) ── */}
        {isSeller &&
          !isPickup &&
          isCod &&
          ['pending', 'paid', 'in_transit'].includes(order.status) && (
            <View style={styles.sellerActionCard}>
              <View style={styles.sellerActionHeader}>
                <Truck size={18} color={accent[600]} />
                <AppText variant="bodyStrong" color={accent[700]}>
                  Paiement à la livraison
                </AppText>
              </View>
              <AppText variant="caption" color={colors.text.muted}>
                Préparez le colis pour {order.delivery_address || 'Daloa'} et encaissez{' '}
                {formatFCFA(order.total_amount)} au moment de la remise.
              </AppText>
              {order.status === 'in_transit' ? (
                <Button
                  title={`Confirmer la remise & l'encaissement`}
                  variant="success"
                  size="md"
                  loading={isSellerActing}
                  onPress={handleConfirmCodHandover}
                  leftIcon={<CheckCircle2 size={16} color={colors.text.inverse} />}
                  fullWidth
                  style={styles.verifyBtn}
                />
              ) : (
                <Button
                  title="Marquer le colis comme expédié"
                  variant="market"
                  size="md"
                  loading={isSellerActing}
                  onPress={handleDispatchCod}
                  leftIcon={<Package size={16} color={colors.text.inverse} />}
                  fullWidth
                  style={styles.verifyBtn}
                />
              )}
              <Button
                title="Je n'ai plus le produit : annuler"
                variant="ghost"
                size="sm"
                disabled={isSellerActing}
                onPress={handleCancelUnavailable}
                fullWidth
              />
            </View>
          )}

        {/* ── Actions vendeur : validation du retrait en boutique ── */}
        {isSeller &&
          isPickupMode(order.delivery_mode) &&
          order.status !== 'delivered' &&
          order.status !== 'cancelled' && (
            <View style={styles.sellerActionCard}>
              <View style={styles.sellerActionHeader}>
                <ShieldCheck size={18} color={accent[600]} />
                <AppText variant="bodyStrong" color={accent[700]}>
                  Valider le retrait en boutique
                </AppText>
              </View>
              <AppText variant="caption" color={colors.text.muted}>
                Demandez son code à l’acheteur et saisissez-le ici. Le code est
                vérifié par le serveur : 5 tentatives maximum.
              </AppText>
              <TextInput
                style={styles.otpField}
                keyboardType="number-pad"
                placeholder="Code de l’acheteur"
                placeholderTextColor={colors.text.subtle}
                value={enteredPickupOtp}
                onChangeText={(t) => setEnteredPickupOtp(t.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <Button
                title="Vérifier le code et remettre l’article"
                variant="market"
                size="md"
                loading={isSellerActing}
                onPress={() => handleCompletePickup(true)}
                leftIcon={<CheckCircle2 size={16} color={colors.text.inverse} />}
                fullWidth
                style={styles.verifyBtn}
              />
              {/* Sans code, le serveur refuse de libérer un séquestre au
                  profit du vendeur : l'option ne vaut que pour le paiement en
                  boutique, où aucun argent ne transite par DaloaMarket. */}
              {order.payment_method !== 'online' && (
              <AppPressable
                onPress={() =>
                  showAlert(
                    'Remise sans code',
                    "À n'utiliser que si l'acheteur n'a pas son code. La remise sera enregistrée sans vérification.",
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Confirmer la remise', onPress: () => handleCompletePickup(false) },
                    ]
                  )
                }
                style={styles.linkBtn}
              >
                <AppText variant="caption" color={colors.text.muted}>
                  L’acheteur n’a pas son code
                </AppText>
              </AppPressable>
              )}
            </View>
          )}

        {/* ── Code OTP vendeur : ramassage ── */}
        {isSeller &&
          pickupOtp &&
          (assignment?.pickup_confirmed_by_seller ||
            ['awaiting_pickup', 'accepted', 'picked_up'].includes(assignment?.status ?? '')) && (
            <DeliveryCodeCard
              code={pickupOtp}
              type="pickup"
              orderRef={order.id}
              title="Code de ramassage (Vendeur)"
              subtitle="Le livreur scanne ce QR code pour confirmer qu'il prend en charge votre colis."
              style={styles.codeCard}
            />
          )}

        {/* ── Code OTP acheteur : remise ── */}
        {!isSeller &&
          deliveryOtp &&
          order.status !== 'delivered' &&
          order.status !== 'cancelled' && (
            <DeliveryCodeCard
              code={deliveryOtp}
              type="delivery"
              orderRef={order.id}
              title="Votre code de remise"
              subtitle="Donnez ce code au livreur UNIQUEMENT après avoir inspecté votre colis."
              style={styles.codeCard}
            />
          )}

        {/* ── Timeline : masquée si annulée/litige, repliée une fois livrée ── */}
        {isDelivered && !isClosed && (
          <AppPressable
            onPress={() => setShowJourney((v) => !v)}
            style={styles.journeyToggle}
            accessibilityLabel={showJourney ? 'Masquer le parcours' : 'Voir le parcours de la commande'}
          >
            <View style={[styles.journeyIcon, { backgroundColor: accent[50] }]}>
              <Route size={18} color={accent.DEFAULT} />
            </View>
            <View style={styles.journeyText}>
              <AppText variant="bodyStrong">Parcours de la commande</AppText>
              <AppText variant="caption" color={colors.text.muted}>
                {steps.length} étapes
                {order.delivery_assignment?.delivered_at
                  ? ` · terminé le ${formatDate(order.delivery_assignment.delivered_at)}`
                  : ''}
              </AppText>
            </View>
            <ChevronDown
              size={18}
              color={colors.grey[400]}
              style={{ transform: [{ rotate: showJourney ? '180deg' : '0deg' }] }}
            />
          </AppPressable>
        )}
        {!isClosed && (!isDelivered || showJourney) && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Truck size={15} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Progression de la livraison</AppText>
          </View>

          <View style={styles.timeline}>
            {steps.map((step, idx) => {
              const isCurrent = !step.done && idx === firstPendingIdx;
              const Icon = step.icon;
              const isLast = idx === steps.length - 1;

              return (
                <View key={step.key} style={styles.timelineRow}>
                  {/* Left column: dot + line */}
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        step.done && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                        isCurrent && {
                          backgroundColor: colors.bg.surface,
                          borderColor: accent.DEFAULT,
                          borderWidth: 2.5,
                        },
                        !step.done && !isCurrent && {
                          backgroundColor: colors.bg.subtle,
                          borderColor: colors.border.strong,
                        },
                      ]}
                    >
                      {step.done ? (
                        <CheckCircle2 size={14} color={colors.text.inverse} strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <Icon size={13} color={accent.DEFAULT} strokeWidth={2} />
                      ) : (
                        <Clock size={11} color={colors.grey[400]} />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          step.done && { backgroundColor: accent.DEFAULT },
                          isCurrent && { backgroundColor: accent[200] },
                        ]}
                      />
                    )}
                  </View>

                  {/* Right column: text */}
                  <View style={[styles.timelineText, isLast && { paddingBottom: 0 }]}>
                    <AppText
                      variant={step.done || isCurrent ? 'bodyStrong' : 'body'}
                      color={
                        step.done
                          ? colors.text.DEFAULT
                          : isCurrent
                          ? accent[700]
                          : colors.text.subtle
                      }
                    >
                      {step.label}
                    </AppText>
                    <AppText variant="caption" color={colors.text.subtle}>
                      {step.sub}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        )}

        {/* ── Livreur ── */}
        {/* Commande annulée : le livreur n'a plus de rôle, sa fiche encombrait l'écran. */}
        {driver && order.status !== 'cancelled' && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Bike size={15} color={colors.status.successDark} />
              <AppText variant="bodyStrong">Livreur DaloaDelivery</AppText>
            </View>
            <View style={styles.personRow}>
              <Avatar uri={driver.photo_url} name={driver.name} size={50} isOnline />
              <View style={styles.personInfo}>
                <AppText variant="bodyStrong">{driver.name}</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  {driver.vehicle_type?.toUpperCase() || 'MOTO'}
                </AppText>
                <RatingStars
                  rating={driver.rating ?? 0}
                  totalReviews={driver.total_reviews}
                  size={11}
                />
              </View>
              <AppPressable
                onPress={() => {
                  if (!driver.phone) return;
                  Haptics.lightImpact();
                  Linking.openURL(`tel:${driver.phone}`);
                }}
                style={[styles.callBtn, { backgroundColor: colors.status.success }]}
                accessibilityLabel="Appeler le livreur"
              >
                <PhoneCall size={16} color={colors.text.inverse} />
              </AppPressable>
            </View>
          </View>
        )}

        {/* ── Vendeur ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <ShieldCheck size={15} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Vendeur partenaire</AppText>
          </View>
          <View style={styles.personRow}>
            <Avatar
              uri={seller?.shop_logo_url || seller?.avatar_url}
              name={seller?.shop_name || seller?.full_name}
              size={50}
            />
            <View style={styles.personInfo}>
              <AppText variant="bodyStrong">
                {seller?.shop_name || seller?.full_name || 'Boutique Daloa'}
              </AppText>
              <View style={styles.districtRow}>
                <MapPin size={11} color={colors.text.subtle} />
                <AppText variant="caption" color={colors.text.muted}>
                  {seller?.district || 'Daloa'}
                </AppText>
              </View>
            </View>
            <AppPressable
              onPress={() => {
                if (!seller?.phone) return;
                Haptics.lightImpact();
                Linking.openURL(`tel:${seller.phone}`);
              }}
              style={styles.callBtnOutline}
              accessibilityLabel="Appeler le vendeur"
            >
              <PhoneCall size={16} color={colors.grey[700]} />
            </AppPressable>
          </View>
        </View>

        {/* ── Détail commande ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Package size={15} color={accent.DEFAULT} />
            <AppText variant="bodyStrong">Récapitulatif</AppText>
          </View>
          <SummaryRow label="Article" value={listing?.title || 'Article DaloaMarket'} />
          <SummaryRow label="Quantité" value={`×${order.quantity || 1}`} />
          {/* `orders` n'a pas de colonne `delivery_district` : ordersService
              concatene deja le quartier dans `delivery_address`, sous la forme
              « Adresse (Quartier) ». Y rajouter un suffixe affichait « … (Daloa) »
              en double. Les types locaux perimes masquaient l'erreur. */}
          <SummaryRow label="Livraison à" value={order.delivery_address || '—'} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <AppText variant="bodyStrong">{amountLabel}</AppText>
            <AppText variant="h2" color={accent[600]} style={styles.tnum}>
              {formatFCFA(order.total_amount)}
            </AppText>
          </View>
        </View>

        {/* ── Annulation acheteur (si le colis n'est pas encore ramassé) ── */}
        {!isSeller &&
          !['cancelled', 'delivered', 'completed', 'disputed'].includes(order.status) &&
          !['picked_up', 'in_transit', 'delivered', 'auto_released'].includes(assignment?.status ?? '') && (
            <AppPressable
              onPress={handleCancelOrder}
              disabled={isSubmitting}
              style={styles.cancelOrderBtn}
              accessibilityLabel="Annuler la commande"
            >
              <AppText variant="body" color={colors.status.errorDark} style={styles.cancelOrderText}>
                Annuler ma commande
              </AppText>
            </AppPressable>
          )}

        {/* ── Litige ── */}
        {/* Même règle que report_delivery_dispute : possible jusqu'à la clôture, y compris après la remise. */}
        {!['cancelled', 'completed', 'disputed'].includes(order.status) && assignment?.status !== 'disputed' && (
          <AppPressable
            onPress={() => setIsDisputeOpen(true)}
            style={styles.disputeBtn}
          >
            <AlertTriangle size={15} color={colors.status.error} />
            <AppText variant="caption" color={colors.status.error}>
              Signaler un incident ou ouvrir une médiation
            </AppText>
          </AppPressable>
        )}

        <View style={{ height: Math.max(insets.bottom, spacing[6]) }} />
      </ScrollView>

      {/* ── Bottom sheet litige ── */}
      <BottomSheet
        visible={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        title="Signaler un problème"
      >
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
          <Button
            title="Envoyer la réclamation"
            variant="danger"
            onPress={handleReportDispute}
            loading={isSubmitting}
            fullWidth
            style={styles.disputeSubmit}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  journeyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  journeyIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyText: {
    flex: 1,
    gap: 2,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  // ── En-tête ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
  },
  headerThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  // ── Scroll content ──
  scrollContent: {
    padding: spacing[3],
  },
  codeCard: {
    marginBottom: spacing[3],
  },
  itemsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  itemsTitle: {
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
  },
  itemInfo: {
    flex: 1,
    gap: 1,
  },
  verifyBtn: {
    marginTop: spacing[2],
  },
  // ── Actions vendeur ──
  sellerActionCard: {
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.DEFAULT,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sellerActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  otpField: {
    marginTop: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
    color: colors.text.DEFAULT,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
  },
  linkBtn: {
    alignSelf: 'center',
    paddingVertical: spacing[2],
  },
  // ── Cards ──
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  // ── Timeline ──
  timeline: {
    paddingLeft: spacing[1],
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexShrink: 0,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.border.DEFAULT,
    marginVertical: 3,
  },
  timelineText: {
    flex: 1,
    paddingBottom: spacing[4],
    paddingTop: 4,
    gap: 2,
  },
  // ── Person cards ──
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  personInfo: {
    flex: 1,
    gap: 3,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  callBtnOutline: {
    width: 42,
    height: 42,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  // ── Summary ──
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  summaryLabel: {
    flexShrink: 0,
  },
  summaryValue: {
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[2],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  tnum: {
    fontVariant: ['tabular-nums'],
  },
  // ── Litige ──
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.xl,
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    overflow: 'hidden',
  },
  disputeBody: {
    padding: spacing[4],
    gap: spacing[3],
  },
  disputeIntro: {
    lineHeight: 20,
  },
  disputeInput: {
    backgroundColor: colors.grey[50],
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    borderRadius: radii.xl,
    padding: spacing[3],
    fontSize: 13,
    color: colors.text.DEFAULT,
    minHeight: 100,
  },
  disputeSubmit: {
    marginTop: spacing[1],
  },
  // ── Annulation ──
  cancelOrderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    marginBottom: spacing[2],
  },
  cancelOrderText: {
    fontFamily: typography.families.bold,
  },
  // ── Loading & Erreur ──
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[2],
  },
});
