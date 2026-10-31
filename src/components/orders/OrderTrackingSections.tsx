import React from 'react';
import { View, Linking } from 'react-native';
import { Image } from 'expo-image';
import {
  colors,
  Avatar,
  RatingStars,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import {
  CheckCircle2,
  Clock,
  PhoneCall,
  Bike,
  Package,
  Truck,
  MapPin,
  ShieldCheck,
  Route,
  ChevronDown,
} from 'lucide-react-native';
import { formatDate, formatFCFA, Haptics } from '@daloa/utils';
import { orderTrackingStyles as styles } from './orderTrackingStyles';

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

interface OrderTrackingSectionsProps {
  order: any;
  steps: {
    key: string;
    label: string;
    sub: string;
    icon: React.ComponentType<any>;
    done: boolean;
  }[];
  isDelivered: boolean;
  isClosed: boolean;
  showJourney: boolean;
  onToggleJourney: () => void;
  amountLabel: string;
}

export function OrderTrackingSections({
  order,
  steps,
  isDelivered,
  isClosed,
  showJourney,
  onToggleJourney,
  amountLabel,
}: OrderTrackingSectionsProps) {
  const accent = useAccent();
  const driver = order.delivery_person;
  const seller = order.seller;
  const listing = order.listing;
  const firstPendingIdx = steps.findIndex((s) => !s.done);

  return (
    <>
      {/* ── Timeline : masquée si annulée/litige, repliée une fois livrée ── */}
      {isDelivered && !isClosed && (
        <AppPressable
          onPress={onToggleJourney}
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
                        !step.done &&
                          !isCurrent && {
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
        <SummaryRow label="Livraison à" value={order.delivery_address || '—'} />
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <AppText variant="bodyStrong" style={styles.totalLabel}>{amountLabel}</AppText>
          <AppText variant="h2" color={accent[600]} style={[styles.tnum, styles.totalAmount]} numberOfLines={1}>
            {formatFCFA(order.total_amount)}
          </AppText>
        </View>
      </View>
    </>
  );
}

export function OrderItemsListCard({ orderItems }: { orderItems: any[] }) {
  const accent = useAccent();
  if (!Array.isArray(orderItems) || orderItems.length <= 1) return null;

  return (
    <View style={styles.itemsCard}>
      <AppText variant="bodyStrong" style={styles.itemsTitle}>
        Articles ({orderItems.length})
      </AppText>
      {orderItems.map((it: any) => (
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
          <AppText variant="bodyStrong" color={accent[600]} style={styles.itemAmount} numberOfLines={1}>
            {formatFCFA(it.product_amount)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

