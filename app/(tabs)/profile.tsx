import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Share, Linking, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { supabase, authService, useActiveOrdersCount } from '@daloa/api';
import { colors, useAccent, ConfirmDialog, showAlert } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { ProfileGuestView } from '../../src/components/profile/ProfileGuestView';
import { ProfileHero } from '../../src/components/profile/ProfileHero';
import { ProfileAlertsBanner } from '../../src/components/profile/ProfileAlertsBanner';
import { ProfileProBanner } from '../../src/components/profile/ProfileProBanner';
import { ProfileQuickActions } from '../../src/components/profile/ProfileQuickActions';
import { ProfileMenuSections } from '../../src/components/profile/ProfileMenuSections';

export default function ProfileScreen() {
  const router = useRouter();
  const accent = useAccent();
  const { user, profile, logout, isAuthenticated, isLoading, refreshProfile, isAdmin } = useAuth();
  const { data: activeOrders } = useActiveOrdersCount(user?.id);

  const [stats, setStats] = useState({
    activeCount: 0,
    soldCount: 0,
    reviewCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        // Les ventes se comptent depuis `orders`, pas depuis `listings.status`.
        // Adossé au statut de l'annonce, le compteur baissait dès que le vendeur
        // remettait un article en vente après restock. Même source que
        // `app/pro/stats.tsx` et que le web (`MyStatsPage`).
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .in('status', ['delivered', 'completed']),
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

  const handlePickAvatar = async () => {
    if (!user?.id) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Autorisation requise',
          'Veuillez autoriser l’accès à votre galerie de photos pour changer votre photo de profil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingAvatar(true);

      await authService.uploadAvatar(user.id, {
        base64: asset.base64,
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
      });

      await refreshProfile();
      Haptics.success();
    } catch (err: any) {
      console.error('Erreur changement photo de profil:', err);
      showAlert('Erreur', err?.message || 'Impossible de mettre à jour votre photo de profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
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
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      Haptics.lightImpact();
      setShowLogoutDialog(false);
      router.replace('/(tabs)' as any);
    } catch (err) {
      console.warn('Erreur lors de la déconnexion:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color={accent.DEFAULT} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <ProfileGuestView />;
  }

  const displayName =
    profile?.shop_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email && !user.email.includes('@daloamarket.ci') ? user.email.split('@')[0] : '') ||
    'Commerçant Daloa';
  const displayPhone = profile?.phone || user?.user_metadata?.phone || '';
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={accent.DEFAULT} />
        }
      >
        {/* 1. Hero identity banner */}
        <ProfileHero
          displayName={displayName}
          avatarUrl={displayAvatar}
          phone={displayPhone}
          district={profile?.district}
          rating={profile?.rating}
          isPro={isPro}
          onOpenSettings={() => router.push('/settings' as any)}
          onOpenAdmin={isAdmin ? () => router.push('/admin' as any) : undefined}
          onEditAvatar={handlePickAvatar}
          isUploadingAvatar={isUploadingAvatar}
          stats={[
            { label: 'En vente', value: stats.activeCount, onPress: () => router.push('/seller/my-listings' as any) },
            { label: 'Vendues', value: stats.soldCount, onPress: () => router.push('/seller/my-listings' as any) },
            { label: 'Avis', value: stats.reviewCount },
          ]}
        />

        {/* 2. Raccourcis : une carte qui déborde sur le bandeau, tout visible */}
        <ProfileQuickActions
          onOpenMyListings={() => router.push('/seller/my-listings' as any)}
          onOpenOrders={() => router.push('/(tabs)/orders' as any)}
          onOpenDeliverers={() => router.push('/affiliations' as any)}
          onOpenShop={() => router.push('/settings/shop' as any)}
          onShareShopWhatsApp={handleShareShopWhatsApp}
          activeOrdersCount={activeOrders?.total ?? 0}
        />

        {/* 3. Alertes proactives (GPS ou Payout manquant) */}
        <ProfileAlertsBanner
          hasListings={stats.activeCount > 0}
          hasShopGps={hasShopGps}
          hasPayoutAccount={hasPayoutAccount}
          isSeller={isPro || Boolean(profile?.shop_name) || Boolean((profile as any)?.payout_network)}
          onDefineGps={() => router.push('/settings/shop' as any)}
          onSetupPayout={() => router.push('/settings/payout' as any)}
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

        {/* Pass Pro en fin de page : une offre, pas une information sur le compte */}
        <ProfileProBanner
          isPro={isPro}
          onBecomePro={() => router.push('/pro/become-pro' as any)}
        />
      </ScrollView>

      {/* Dialogue de confirmation de déconnexion stylisé */}
      <ConfirmDialog
        visible={showLogoutDialog}
        type="danger"
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter de votre compte DaloaMarket ?"
        confirmText="Déconnexion"
        cancelText="Annuler"
        isLoading={isLoggingOut}
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  loadingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
