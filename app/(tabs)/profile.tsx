import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Share, Alert, Linking, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '@daloa/api';
import { colors } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { ProfileGuestView } from '../../src/components/profile/ProfileGuestView';
import { ProfileHero } from '../../src/components/profile/ProfileHero';
import { ProfileStatsStrip } from '../../src/components/profile/ProfileStatsStrip';
import { ProfileAlertsBanner } from '../../src/components/profile/ProfileAlertsBanner';
import { ProfileProBanner } from '../../src/components/profile/ProfileProBanner';
import { ProfileQuickActions } from '../../src/components/profile/ProfileQuickActions';
import { ProfileMenuSections } from '../../src/components/profile/ProfileMenuSections';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout, isAuthenticated } = useAuth();

  const [stats, setStats] = useState({
    activeCount: 0,
    soldCount: 0,
    reviewCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());
  const hasShopGps = Boolean(
    (profile as any)?.shop_latitude != null && (profile as any)?.shop_longitude != null
  );
  const hasPayoutAccount = Boolean(
    (profile as any)?.payout_number != null && (profile as any)?.payout_network != null
  );

  const fetchMerchantStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [activeRes, soldRes, reviewRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'deleted')
          .neq('status', 'sold'),
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'sold'),
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('reviewed_id', user.id),
      ]);

      setStats({
        activeCount: activeRes.count || 0,
        soldCount: soldRes.count || 0,
        reviewCount: reviewRes.count || 0,
      });
    } catch (err) {
      console.warn('Erreur chargement statistiques profil marchand:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMerchantStats();
  }, [fetchMerchantStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMerchantStats();
    setIsRefreshing(false);
  };

  const handleShareShopWhatsApp = async () => {
    Haptics.success();
    const slug = (profile as any)?.shop_slug || user?.id?.slice(0, 8) || '';
    const shareUrl = `https://daloamarket.com/shop/${slug}`;
    const message = `Découvrez tous mes articles sur ma boutique DaloaMarket !\n${shareUrl}\nPaiement sécurisé par séquestre et livraison partout à Daloa.`;
    await Share.share({
      message,
      title: profile?.shop_name || 'Ma boutique DaloaMarket',
    }).catch(() => {});
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter de DaloaMarket ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Haptics.lightImpact();
          router.replace('/(tabs)' as any);
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return <ProfileGuestView />;
  }

  const displayName = profile?.shop_name || profile?.full_name || 'Commerçant Daloa';
  const displayPhone = profile?.phone || '';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#EA580C" />
        }
      >
        {/* 1. Hero identity banner */}
        <ProfileHero
          displayName={displayName}
          avatarUrl={profile?.avatar_url}
          phone={displayPhone}
          district={profile?.district}
          rating={profile?.rating}
          isPro={isPro}
          onOpenSettings={() => router.push('/settings' as any)}
        />

        {/* 2. Strip 3 métriques chiffrées en police tabulaire */}
        <ProfileStatsStrip
          activeCount={stats.activeCount}
          soldCount={stats.soldCount}
          reviewCount={stats.reviewCount}
          rating={profile?.rating}
        />

        {/* 3. Alertes proactives (GPS ou Payout manquant) */}
        <ProfileAlertsBanner
          hasListings={stats.activeCount > 0}
          hasShopGps={hasShopGps}
          hasPayoutAccount={hasPayoutAccount}
          onDefineGps={() => router.push('/settings/shop' as any)}
          onSetupPayout={() => router.push('/settings/payout' as any)}
        />

        {/* 4. Bannière Pass Pro Vendeur */}
        <ProfileProBanner
          isPro={isPro}
          onBecomePro={() => router.push('/pro/become-pro' as any)}
        />

        {/* 5. Grille des actions rapides marchandes */}
        <ProfileQuickActions
          onPublishListing={() => router.push('/listing/create' as any)}
          onOpenOrders={() => router.push('/(tabs)/orders' as any)}
          onOpenDeliverers={() => router.push('/affiliations' as any)}
          onOpenShop={() => router.push('/settings/shop' as any)}
          onShareShopWhatsApp={handleShareShopWhatsApp}
        />

        {/* 6. Menus secondaires compacts et Déconnexion */}
        <ProfileMenuSections
          onOpenRevenue={() => router.push('/pro/revenue' as any)}
          onOpenPayoutSettings={() => router.push('/settings/payout' as any)}
          onOpenFavorites={() => router.push('/favorites' as any)}
          onOpenAccountSettings={() => router.push('/settings' as any)}
          onJoinDelivery={() => {
            Linking.openURL('https://delivery.daloamarket.com/devenir-livreur').catch(() => {
              router.push('/legal/how-it-works' as any);
            });
          }}
          onOpenHelp={() => router.push('/legal/help' as any)}
          onOpenFaq={() => router.push('/legal/faq' as any)}
          onOpenAbout={() => router.push('/legal/about' as any)}
          onOpenTerms={() => router.push('/legal/terms' as any)}
          onOpenDisputes={() => router.push('/legal/how-it-works' as any)}
          onLogout={handleLogout}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
