import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserOrders } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import {
  colors,
  radii,
  spacing,
  Skeleton,
  Button,
  EmptyState,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import {
  Package,
  ShoppingBag,
  Store,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react-native';
import { UserOrderCard } from '../../src/components/orders/UserOrderCard';

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'awaiting_pickup', label: 'En attente' },
  { id: 'in_transit', label: 'En livraison' },
  { id: 'delivered', label: 'Livrées' },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders, isLoading, refetch, isRefetching } = useUserOrders(
    user?.id,
    activeTab,
    statusFilter
  );
  const orderList = orders || [];

  /* ── Guest ── */
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.guestHero, { paddingTop: insets.top + spacing[4] }]}
        >
          <View style={styles.heroIconCircle}>
            <Package size={22} color={accent[700]} strokeWidth={2} />
          </View>
          <AppText variant="overline" color={accent[100]}>MES COMMANDES</AppText>
          <AppText variant="h2" color={colors.text.inverse}>Achats & ventes</AppText>
          <AppText variant="caption" color={accent[100]}>
            Livraisons sécurisées par séquestre
          </AppText>
        </LinearGradient>

        <View style={styles.guestCard}>
          <View style={styles.guestIconRow}>
            <View style={[styles.guestFeatureIcon, { backgroundColor: accent[50] }]}>
              <ClipboardList size={20} color={accent[600]} />
            </View>
            <View style={[styles.guestFeatureIcon, { backgroundColor: colors.status.successLight }]}>
              <ShieldCheck size={20} color={colors.status.successDark} />
            </View>
            <View style={[styles.guestFeatureIcon, { backgroundColor: accent[50] }]}>
              <ShoppingBag size={20} color={accent[600]} />
            </View>
          </View>
          <AppText variant="h2" center>Suivez vos commandes en direct</AppText>
          <AppText variant="body" color={colors.text.muted} center style={styles.guestSub}>
            Consultez l'historique de vos achats, vos codes OTP de réception et gérez vos ventes à Daloa.
          </AppText>
          <Button
            title="Se connecter à mon compte"
            variant="market"
            size="lg"
            onPress={() => router.push('/auth/login' as any)}
            style={styles.guestBtn}
          />
        </View>
      </View>
    );
  }

  /* ── Authenticated ── */
  return (
    <View style={styles.container}>
      {/* Hero gradient */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
      >
        {/* Titre */}
        <View style={styles.heroTitle}>
          <View style={styles.heroIconCircle}>
            <Package size={22} color={accent[700]} strokeWidth={2} />
          </View>
          <View>
            <AppText variant="overline" color={accent[100]}>MES COMMANDES</AppText>
            <AppText variant="h2" color={colors.text.inverse}>
              {activeTab === 'buyer' ? 'Mes achats' : 'Mes ventes'}
            </AppText>
          </View>
        </View>

        {/* Toggle acheteur / vendeur */}
        <View style={styles.roleToggle}>
          <AppPressable
            haptic="selection"
            onPress={() => setActiveTab('buyer')}
            style={[styles.roleBtn, activeTab === 'buyer' && styles.roleBtnActive]}
          >
            <ShoppingBag
              size={13}
              color={activeTab === 'buyer' ? accent[600] : 'rgba(255,255,255,0.75)'}
              strokeWidth={2}
            />
            <AppText
              variant="label"
              color={activeTab === 'buyer' ? accent[600] : 'rgba(255,255,255,0.85)'}
            >
              Mes achats
            </AppText>
          </AppPressable>

          <AppPressable
            haptic="selection"
            onPress={() => setActiveTab('seller')}
            style={[styles.roleBtn, activeTab === 'seller' && styles.roleBtnActive]}
          >
            <Store
              size={13}
              color={activeTab === 'seller' ? accent[600] : 'rgba(255,255,255,0.75)'}
              strokeWidth={2}
            />
            <AppText
              variant="label"
              color={activeTab === 'seller' ? accent[600] : 'rgba(255,255,255,0.85)'}
            >
              Mes ventes
            </AppText>
          </AppPressable>
        </View>
      </LinearGradient>

      {/* Filtres statut */}
      <View style={styles.statusBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusPills}
        >
          {STATUS_FILTERS.map((s) => {
            const isSelected = statusFilter === s.id;
            return (
              <AppPressable
                key={s.id}
                haptic="selection"
                onPress={() => setStatusFilter(s.id)}
                style={[
                  styles.statusPill,
                  isSelected && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                ]}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? colors.text.inverse : colors.grey[600]}
                >
                  {s.label}
                </AppText>
              </AppPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={accent.DEFAULT}
            colors={[accent.DEFAULT]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={130} borderRadius={radii.xl} />
            ))}
          </View>
        ) : orderList.length === 0 ? (
          <EmptyState
            icon={<Package size={30} color={accent.DEFAULT} />}
            title="Aucune commande trouvée"
            description={
              activeTab === 'buyer'
                ? "Vous n'avez pas encore passé de commande."
                : "Vous n'avez pas encore reçu de commande pour vos articles."
            }
            actionTitle={activeTab === 'buyer' ? 'Explorer les annonces' : undefined}
            onActionPress={
              activeTab === 'buyer' ? () => router.push('/(tabs)' as any) : undefined
            }
            actionVariant="market"
          />
        ) : (
          <View style={styles.orderList}>
            {orderList.map((order: any) => (
              <UserOrderCard key={order.id} order={order} role={activeTab} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  // ── Hero ──
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: spacing[3],
  },
  heroTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  heroIconCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Toggle ──
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: radii.xl,
    padding: 3,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: radii.lg,
    gap: 6,
    overflow: 'hidden',
  },
  roleBtnActive: {
    backgroundColor: colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // ── Status bar ──
  statusBar: {
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  statusPills: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  statusPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  // ── Liste ──
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  skeletonList: {
    gap: spacing[3],
  },
  orderList: {
    gap: spacing[3],
  },
  // ── Guest ──
  guestHero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[12],
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    gap: 6,
  },
  guestCard: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginTop: -spacing[8],
    borderRadius: radii['2xl'],
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  guestIconRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  guestFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSub: {
    marginTop: 4,
  },
  guestBtn: {
    alignSelf: 'stretch',
    marginTop: spacing[2],
  },
});
