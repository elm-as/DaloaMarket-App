import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
import { colors, radii, spacing, StatCard, Card, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Eye, TrendingUp, ShoppingBag, LayoutGrid, ArrowLeft, Camera, Share2 } from 'lucide-react-native';
import { formatFCFA } from '@daloa/utils';

interface SellerStats {
  totalViews: number;
  salesCount: number;
  activeListings: number;
  netEarnings: number;
}

async function fetchSellerStats(userId: string): Promise<SellerStats> {
  const [listingsRes, deliveredRes, activeRes] = await Promise.all([
    supabase
      .from('listings')
      .select('views_count')
      .eq('seller_id', userId)
      .neq('status', 'deleted'),
    supabase
      .from('orders')
      .select('product_amount, seller_fee')
      .eq('seller_id', userId)
      .eq('status', 'delivered'),
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', userId)
      .eq('status', 'active'),
  ]);

  const totalViews = (listingsRes.data || []).reduce(
    (s, l) => s + (l.views_count || 0),
    0
  );

  const salesCount = (deliveredRes.data || []).length;
  const netEarnings = (deliveredRes.data || []).reduce(
    (s, o) => s + Math.max(0, (o.product_amount || 0) - (o.seller_fee || 0)),
    0
  );

  const activeListings = activeRes.count ?? 0;

  return { totalViews, salesCount, activeListings, netEarnings };
}

export default function StatsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [stats, setStats] = useState<SellerStats | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchSellerStats(user.id)
      .then(setStats)
      .catch(() => setStats({ totalViews: 0, salesCount: 0, activeListings: 0, netEarnings: 0 }));
  }, [user?.id]);

  const conversionRate =
    stats && stats.totalViews > 0
      ? ((stats.salesCount / stats.totalViews) * 100).toFixed(1) + '%'
      : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Performance boutique
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Statistiques
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <TrendingUp size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.kpiGrid}>
          <StatCard
            label="Vues des annonces"
            value={stats ? stats.totalViews.toLocaleString('fr-FR') : '…'}
            icon={<Eye size={16} color={accent.DEFAULT} />}
          />
          <StatCard
            label="Articles vendus"
            value={stats ? String(stats.salesCount) : '…'}
            icon={<ShoppingBag size={16} color={colors.status.successDark} />}
          />
        </View>

        <View style={styles.kpiGrid}>
          <StatCard
            label="Annonces actives"
            value={stats ? String(stats.activeListings) : '…'}
            icon={<LayoutGrid size={16} color={colors.secondary.DEFAULT} />}
          />
          <StatCard
            label="Taux de conversion"
            value={stats ? conversionRate : '…'}
            icon={<TrendingUp size={16} color={accent.DEFAULT} />}
          />
        </View>

        {/* Revenus nets */}
        <View style={[styles.earningsCard, { backgroundColor: colors.status.successLight, borderColor: colors.status.successBorder }]}>
          <View style={styles.earningsRow}>
            <AppText variant="body" color={colors.status.successDark}>
              Revenus nets totaux
            </AppText>
            <AppText variant="h2" color={colors.status.successDark}>
              {stats ? formatFCFA(stats.netEarnings) : '…'}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.status.successDark} style={{ opacity: 0.7 }}>
            Cumul des ventes livrées, après commission DaloaMarket.
          </AppText>
        </View>

        <AppText variant="subtitle">Conseils pour vendre plus vite</AppText>
        <Card style={styles.tipsCard}>
          <View style={styles.tipHeaderRow}>
            <Camera size={15} color={accent[600]} />
            <AppText variant="bodyStrong">
              Photos nettes et lumineuses
            </AppText>
          </View>
          <AppText variant="caption" color={colors.text.muted}>
            Les annonces avec 3 photos ou plus et un fond dégagé reçoivent 3 fois plus de contacts.
          </AppText>

          <View style={styles.tipGap} />

          <View style={styles.tipHeaderRow}>
            <Share2 size={15} color={accent[600]} />
            <AppText variant="bodyStrong">
              Partagez sur WhatsApp
            </AppText>
          </View>
          <AppText variant="caption" color={colors.text.muted}>
            Partagez le lien de votre vitrine dans votre statut le matin entre 8h30 et 10h pour capter les acheteurs.
          </AppText>
        </Card>

        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  earningsCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[1],
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipsCard: {
    padding: spacing[4],
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  tipTitle: {
    marginBottom: 2,
  },
  tipGap: {
    height: spacing[3],
  },
});
