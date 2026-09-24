import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, StyleSheet, TextInput, View } from 'react-native';
import { AlertTriangle, CheckCircle2, MessageCircle, PhoneCall, Star, Store, Truck, XCircle } from 'lucide-react-native';
import { supabase } from '@daloa/api';
import { AppPressable, AppText, Button, colors, radii, spacing, useAccent, showAlert } from '@daloa/ui';
import { formatDate, formatFCFA, Haptics, isPickupMode } from '@daloa/utils';

export interface HeroStep {
  label: string;
  sub: string;
  done: boolean;
}

interface OrderStatusHeroProps {
  order: any;
  steps: HeroStep[];
  isSeller: boolean;
  userId?: string | null;
  driverPhone?: string | null;
}

const SUPPORT_WHATSAPP = 'https://wa.me/2250704163361';

/** Texte d'une commande annulée ou en litige ; même logique que le web (`orderClosedCopy.ts`). */
function getClosedCopy(order: any, isSeller: boolean) {
  const assignment = order.delivery_assignment;
  const isDisputed = order.status === 'disputed' || assignment?.status === 'disputed';
  if (order.status !== 'cancelled' && !isDisputed) return null;

  const isPickup = isPickupMode(order.delivery_mode);
  const isCod = order.payment_method === 'cod';
  const isCashAtShop = order.payment_method === 'cash_at_shop';
  const unavailable = order.cancel_reason === 'unavailable' || order.cancel_reason === 'seller_unavailable';

  if (isDisputed) {
    return {
      kind: 'dispute' as const,
      title: 'Litige en cours',
      message: isSeller
        ? 'Un problème a été signalé sur cette vente. L’équipe DaloaMarket examine le dossier et revient vers vous.'
        : 'Un problème a été signalé sur votre livraison. L’équipe DaloaMarket examine le dossier et revient vers vous.',
      money: isCod || isCashAtShop ? 'Aucun paiement en ligne' : 'Argent bloqué en séquestre jusqu’à la décision',
    };
  }
  if (isCashAtShop || isCod) {
    return {
      kind: 'cancelled' as const,
      title: isSeller ? 'Commande annulée par le client' : isCashAtShop ? 'Réservation annulée' : 'Commande annulée',
      message: isSeller ? 'L’article est remis en vente.' : 'Votre commande a bien été annulée.',
      money: isSeller ? 'Aucun paiement' : 'Rien n’a été débité',
    };
  }
  if (isSeller) {
    return {
      kind: 'cancelled' as const,
      title: unavailable ? 'Commande annulée (article indisponible)' : 'Commande annulée par l’acheteur',
      message: unavailable
        ? 'Vous avez annulé cette commande car l’article n’est plus disponible.'
        : 'L’acheteur a annulé sa commande avant l’expédition. L’article a été remis en stock.',
      money: 'Acheteur remboursé',
    };
  }
  return {
    kind: 'cancelled' as const,
    title: unavailable ? 'Article indisponible chez le vendeur' : isPickup ? 'Réservation annulée' : 'Commande annulée',
    message: unavailable ? 'Le vendeur ne peut pas honorer la commande.' : 'Votre commande a été annulée.',
    money: `Remboursement de ${formatFCFA(order.total_amount)} en cours vers votre Mobile Money`,
  };
}

/**
 * Encadré d'état en tête du suivi : il change de forme avec la commande (en
 * cours, livrée, annulée, en litige) au lieu de se limiter à la pastille du
 * bandeau, et dit où en est la commande et quoi faire.
 */
export function OrderStatusHero({ order, steps, isSeller, userId, driverPhone }: OrderStatusHeroProps) {
  const accent = useAccent();
  const isPickup = isPickupMode(order.delivery_mode);
  const isDelivered = order.status === 'delivered' || order.status === 'completed';
  const closed = getClosedCopy(order, isSeller);

  if (closed) {
    const isDispute = closed.kind === 'dispute';
    return (
      <View
        style={[
          styles.card,
          isDispute
            ? { backgroundColor: colors.status.warningLight, borderColor: colors.status.warningBorder }
            : { backgroundColor: colors.bg.surface, borderColor: colors.border.DEFAULT },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.bubble, { backgroundColor: isDispute ? colors.status.warning : colors.bg.subtle }]}>
            {isDispute ? (
              <AlertTriangle size={24} color={colors.text.inverse} />
            ) : (
              <XCircle size={24} color={colors.grey[500]} />
            )}
          </View>
          <View style={styles.flex}>
            <AppText variant="title">{closed.title}</AppText>
            <AppText variant="caption" color={colors.text.muted}>{closed.message}</AppText>
          </View>
        </View>
        <View style={styles.moneyBox}>
          <AppText variant="bodyStrong">{closed.money}</AppText>
        </View>
        <AppPressable onPress={() => Linking.openURL(SUPPORT_WHATSAPP)} style={styles.helpBtn}>
          <MessageCircle size={15} color={colors.whatsappDark} />
          <AppText variant="label" color={colors.whatsappDark}>Aide WhatsApp</AppText>
        </AppPressable>
      </View>
    );
  }

  if (isDelivered) {
    const a = order.delivery_assignment;
    const when = a?.delivered_at || a?.buyer_confirmed_at;
    const title = isSeller ? 'Vente conclue' : isPickup ? 'Article retiré' : 'Commande livrée';
    return (
      <View style={[styles.card, { backgroundColor: colors.status.successLight, borderColor: colors.status.successBorder }]}>
        <View style={styles.row}>
          <PopIn>
            <View style={[styles.bubble, { backgroundColor: colors.status.success }]}>
              <CheckCircle2 size={24} color={colors.text.inverse} />
            </View>
          </PopIn>
          <View style={styles.flex}>
            <AppText variant="title">{title}</AppText>
            <AppText variant="caption" color={colors.text.muted}>
              {when ? `Le ${formatDate(when, true)}` : 'Remise confirmée'} · {formatFCFA(order.total_amount)}
            </AppText>
          </View>
        </View>
        <Segments done={1} total={1} color={colors.status.success} />
        {!isSeller && userId && order.listing_id && order.seller_id && (
          <View style={[styles.ratingBox, { borderTopColor: colors.status.successBorder }]}>
            <InlineSellerRating userId={userId} sellerId={order.seller_id} listingId={order.listing_id} />
          </View>
        )}
      </View>
    );
  }

  const done = steps.filter((s) => s.done).length;
  const current = steps[Math.min(done, steps.length - 1)];
  const Icon = isPickup ? Store : Truck;
  const showCall = !isSeller && !isPickup && !!driverPhone && order.status === 'in_transit';

  return (
    <View style={[styles.card, { backgroundColor: accent[50], borderColor: accent[200] }]}>
      <View style={styles.row}>
        <View style={[styles.bubble, { backgroundColor: accent.DEFAULT }]}>
          <Icon size={24} color={colors.text.inverse} />
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color={accent[700]}>
            Étape {Math.min(done + 1, steps.length)} sur {steps.length}
          </AppText>
          <AppText variant="title">{current.label}</AppText>
          <AppText variant="caption" color={colors.text.muted}>{current.sub}</AppText>
        </View>
      </View>
      <Segments done={done} total={steps.length} color={accent.DEFAULT} />
      {showCall && (
        <AppPressable
          onPress={() => {
            Haptics.lightImpact();
            Linking.openURL(`tel:${driverPhone}`);
          }}
          style={styles.callBtn}
          accessibilityLabel="Appeler le livreur"
        >
          <PhoneCall size={15} color={colors.grey[700]} />
          <AppText variant="label">Appeler le livreur</AppText>
        </AppPressable>
      )}
    </View>
  );
}

/** Coche qui apparaît avec un petit rebond. */
function PopIn({ children }: { children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

function Segments({ done, total, color }: { done: number; total: number; color: string }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.segment, { backgroundColor: i < done ? color : colors.grey[200] }]} />
      ))}
    </View>
  );
}

/** Notation du vendeur depuis le suivi. Un avis par acheteur et par annonce (UNIQUE en base). */
function InlineSellerRating({ userId, sellerId, listingId }: { userId: string; sellerId: string; listingId: string }) {
  const accent = useAccent();
  const [existing, setExisting] = useState<number | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase
      .from('reviews')
      .select('rating')
      .eq('reviewer_id', userId)
      .eq('listing_id', listingId)
      .maybeSingle()
      .then(({ data }) => alive && setExisting(data?.rating ?? null));
    return () => {
      alive = false;
    };
  }, [userId, listingId]);

  if (existing === undefined) return null;

  if (existing !== null) {
    return (
      <View style={styles.thanksRow}>
        <AppText variant="caption" color={colors.status.successDark}>
          Merci, vous avez noté ce vendeur {existing}
        </AppText>
        <Star size={13} color={colors.status.warning} fill={colors.status.warning} />
      </View>
    );
  }

  const submit = async () => {
    if (rating === 0) return;
    setSaving(true);
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: userId,
      reviewed_id: sellerId,
      listing_id: listingId,
      rating,
      comment: comment.trim(),
    });
    setSaving(false);
    if (error && error.code !== '23505') {
      showAlert('Erreur', 'Impossible d’enregistrer votre avis.');
      return;
    }
    Haptics.success();
    setExisting(rating);
  };

  return (
    <View style={styles.ratingInner}>
      <AppText variant="bodyStrong">Comment s’est passé votre achat ?</AppText>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <AppPressable
            key={n}
            onPress={() => {
              Haptics.selection();
              setRating(n);
            }}
            accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}
            style={styles.starBtn}
          >
            <Star
              size={30}
              color={n <= rating ? colors.status.warning : colors.grey[300]}
              fill={n <= rating ? colors.status.warning : 'transparent'}
            />
          </AppPressable>
        ))}
      </View>
      {rating > 0 && (
        <>
          <TextInput
            style={styles.input}
            multiline
            maxLength={500}
            placeholder="Un mot pour les autres acheteurs (facultatif)"
            placeholderTextColor={colors.text.subtle}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
            selectionColor={accent.DEFAULT}
          />
          <Button title="Publier mon avis" variant="market" size="md" loading={saving} onPress={submit} fullWidth />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  flex: { flex: 1, gap: 2 },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: { flexDirection: 'row', gap: 4, marginTop: spacing[4] },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  moneyBox: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginTop: spacing[3],
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  ratingBox: { marginTop: spacing[4], paddingTop: spacing[3], borderTopWidth: 1 },
  ratingInner: { gap: spacing[2] },
  stars: { flexDirection: 'row', gap: 4 },
  starBtn: { padding: 2 },
  thanksRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    color: colors.text.DEFAULT,
  },
});
