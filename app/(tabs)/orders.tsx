import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserOrders } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, typography, StatusPill, CurrencyText, Card, EmptyState, Skeleton, Button } from '@daloa/ui';
import { Package, ChevronRight, KeyRound, Truck, AlertTriangle } from 'lucide-react-native';
import { formatDate, Haptics } from '@daloa/utils';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading, refetch, isRefetching } = useUserOrders(
    user?.id,
    activeTab,
    statusFilter
  );

  const orderList = orders || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Mes Commandes</Text>
        {/* Toggle Acheteur / Vendeur */}
        <View style={styles.roleToggle}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selection();
              setActiveTab('buyer');
            }}
            style={[styles.roleBtn, activeTab === 'buyer' && styles.roleBtnActive]}
          >
            <Text style={[styles.roleText, activeTab === 'buyer' && styles.roleTextActive]}>
              Mes Achats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selection();
              setActiveTab('seller');
            }}
            style={[styles.roleBtn, activeTab === 'seller' && styles.roleBtnActive]}
          >
            <Text style={[styles.roleText, activeTab === 'seller' && styles.roleTextActive]}>
              Mes Ventes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres de statuts rapides */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[2] }}>
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'awaiting_pickup', label: 'En cours' },
            { id: 'delivered', label: 'Livrées' },
            { id: 'disputed', label: 'Litiges' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                Haptics.selection();
                setStatusFilter(f.id);
              }}
              style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, statusFilter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des commandes */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.market.primary}
          />
        }
      >
        {isLoading ? (
          <View style={{ gap: spacing[3] }}>
            <Skeleton height={140} borderRadius={radii['2xl']} />
            <Skeleton height={140} borderRadius={radii['2xl']} />
            <Skeleton height={140} borderRadius={radii['2xl']} />
          </View>
        ) : orderList.length === 0 ? (
          <EmptyState
            icon={<Package size={32} color={colors.market.primary} />}
            title="Aucune commande trouvée"
            description={
              activeTab === 'buyer'
                ? "Vous n'avez pas encore passé de commande. Explorez les articles disponibles à Daloa !"
                : "Vous n'avez pas encore reçu de commande pour vos articles."
            }
            actionTitle={activeTab === 'buyer' ? "Explorer les articles" : "Publier une annonce"}
            onActionPress={() => router.push(activeTab === 'buyer' ? '/(tabs)/index' : '/listing/create')}
          />
        ) : (
          orderList.map((order) => {
            const photoUrl = order.listing?.photos?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';
            const deliveryOtp = order.delivery_assignment?.delivery_otp;

            return (
              <Card
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                style={styles.orderCard}
              >
                {/* Header Carte : Date & Status */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Commande #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at, true)}</Text>
                  </View>
                  <StatusPill status={order.status} size="sm" />
                </View>

                {/* Body Carte : Image, Titre & Montant */}
                <View style={styles.cardBody}>
                  <Image source={{ uri: photoUrl }} style={styles.listingImage} resizeMode="cover" />
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={2}>
                      {order.listing?.title || 'Article DaloaMarket'}
                    </Text>
                    <Text style={styles.partnerName}>
                      {activeTab === 'buyer'
                        ? `Vendeur : ${order.seller?.shop_name || order.seller?.full_name || 'Boutique'}`
                        : `Acheteur : ${order.buyer?.full_name || 'Client'}`}
                    </Text>

                    <View style={styles.amountRow}>
                      <CurrencyText
                        amount={order.total_amount}
                        size="base"
                        weight="bold"
                        color={colors.market.primary}
                      />
                      <Text style={styles.qtyText}>x{order.quantity || 1}</Text>
                    </View>
                  </View>
                </View>

                {/* Footer Carte : OTP & Suivi CTA */}
                <View style={styles.cardFooter}>
                  {deliveryOtp && order.status !== 'delivered' && order.status !== 'cancelled' ? (
                    <View style={styles.otpPill}>
                      <KeyRound size={13} color="#10B981" />
                      <Text style={styles.otpLabel}>Code OTP :</Text>
                      <Text style={styles.otpCode}>{deliveryOtp}</Text>
                    </View>
                  ) : (
                    <View style={styles.districtBadge}>
                      <Truck size={13} color={colors.dark.textDim} />
                      <Text style={styles.districtText}>
                        {order.delivery_district || 'Daloa'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.trackingLink}>
                    <Text style={styles.trackingText}>Suivre en direct</Text>
                    <ChevronRight size={16} color={colors.market.primary} />
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  roleBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
  },
  roleBtnActive: {
    backgroundColor: colors.market.primary,
  },
  roleText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  filtersBar: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: colors.market.primary,
    borderColor: colors.market.primary,
  },
  filterText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  orderCard: {
    padding: spacing[3] + 2,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: spacing[2],
  },
  orderNumber: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  orderDate: {
    color: colors.dark.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  cardBody: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  listingImage: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.dark.surfaceRaised,
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  partnerName: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  qtyText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: spacing[2],
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.md,
    gap: 4,
  },
  otpLabel: {
    color: colors.dark.textMuted,
    fontSize: 11,
  },
  otpCode: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 1,
  },
  districtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  districtText: {
    color: colors.dark.textDim,
    fontSize: 11,
  },
  trackingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trackingText: {
    color: colors.market.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
