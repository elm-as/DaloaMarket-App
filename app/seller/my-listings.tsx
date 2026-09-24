import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Search, Tag } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, ConfirmDialog, EmptyState, Skeleton, typography, showAlert } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { supabase, listingsService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { safeBack } from '../../src/utils/navigation';
import { SellerListingCard } from '../../src/components/seller/SellerListingCard';
import { RestockSheet } from '../../src/components/seller/RestockSheet';
import { BoostSheet } from '../../src/components/seller/BoostSheet';

export default function MyListingsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [searchFilter, setSearchFilter] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales de confirmation
  const [targetListing, setTargetListing] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<'sell' | 'reactivate' | 'delete' | 'boost' | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchMyListings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setListings(data);
      }

      // Solde de crédits pour le boost (non exposé par le profil de session).
      const { data: me } = await supabase
        .from('users_private')
        .select('listing_credits')
        .eq('id', user.id)
        .maybeSingle();
      setCredits(me?.listing_credits ?? 0);
    } catch (err) {
      console.warn('Erreur chargement de mes annonces:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyListings();
  };

  const activeCount = useMemo(
    () => listings.filter((l) => l.status === 'active').length,
    [listings]
  );
  // Compteur de ventes lu dans `orders` : adossé à `listings.status`, il baissait
  // dès qu'une annonce vendue était remise en vente après restock.
  const [soldCount, setSoldCount] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .in('status', ['delivered', 'completed'])
      .then(({ count }) => setSoldCount(count || 0));
  }, [user?.id]);

  const displayedListings = useMemo(() => {
    let list = listings.filter((l) =>
      activeTab === 'active' ? l.status === 'active' : l.status === 'sold'
    );
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.district && l.district.toLowerCase().includes(q))
      );
    }
    return list;
  }, [listings, activeTab, searchFilter]);

  const handleExecuteAction = async () => {
    if (!targetListing || !confirmAction) return;
    try {
      setIsActionLoading(true);
      if (confirmAction === 'sell') {
        await listingsService.markListingAsSold(targetListing.id);
      } else if (confirmAction === 'delete') {
        await listingsService.deleteListing(targetListing.id);
      }
      Haptics.success();
      setConfirmAction(null);
      setTargetListing(null);
      await fetchMyListings();
    } catch (err) {
      console.warn('Erreur exécution action annonce:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestock = async (stock: number, variantStocks?: Record<string, number>) => {
    if (!targetListing) return;
    try {
      setIsActionLoading(true);
      await listingsService.markListingAsActive(targetListing.id, stock, variantStocks);
      Haptics.success();
      setConfirmAction(null);
      setTargetListing(null);
      await fetchMyListings();
    } catch (err) {
      console.warn('Erreur remise en vente:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBoost = async (days: 1 | 2 | 7) => {
    if (!targetListing) return;
    try {
      setIsActionLoading(true);
      const { newBalance } = await listingsService.boostWithCredits(targetListing.id, days);
      Haptics.success();
      setCredits(newBalance);
      setConfirmAction(null);
      setTargetListing(null);
      await fetchMyListings();
    } catch (err: any) {
      showAlert('Boost impossible', err.message || 'Réessayez dans un instant.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <SellerListingCard
      item={item}
      onPress={() => router.push(`/listing/${item.id}` as any)}
      onEdit={() => router.push(`/listing/create?id=${item.id}` as any)}
      onToggleStatus={() => {
        setTargetListing(item);
        setConfirmAction(item.status === 'sold' ? 'reactivate' : 'sell');
      }}
      onBoost={() => {
        setTargetListing(item);
        setConfirmAction('boost');
      }}
      onDelete={() => {
        setTargetListing(item);
        setConfirmAction('delete');
      }}
    />
  );

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <AppPressable
          haptic="selection"
          onPress={() => safeBack(router, '/(tabs)/profile')}
          style={styles.backBtn}
          accessibilityLabel="Retour au profil"
        >
          <ArrowLeft size={20} color={colors.text.DEFAULT} />
        </AppPressable>
        <AppText variant="subtitle" style={styles.headerTitle}>
          Mes annonces
        </AppText>
        <AppPressable
          haptic="selection"
          onPress={() => router.push('/listing/create' as any)}
          style={[styles.createBtn, { backgroundColor: accent.DEFAULT }]}
          accessibilityLabel="Créer une nouvelle annonce"
        >
          <Plus size={15} color={colors.text.inverse} strokeWidth={2.8} />
          <AppText variant="caption" color={colors.text.inverse} style={styles.createBtnText}>
            Publier
          </AppText>
        </AppPressable>
      </View>

      {/* Barre de recherche locale */}
      <View style={styles.searchWrap}>
        <Search size={15} color={colors.text.subtle} />
        <TextInput
          value={searchFilter}
          onChangeText={setSearchFilter}
          placeholder="Rechercher parmi mes annonces..."
          placeholderTextColor={colors.text.subtle}
          style={styles.searchInput}
        />
      </View>

      {/* Onglets En vente / Vendues */}
      <View style={styles.tabsRow}>
        <AppPressable
          haptic="selection"
          onPress={() => setActiveTab('active')}
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: accent.DEFAULT, borderBottomWidth: 2 }]}
        >
          <AppText variant="bodyStrong" color={activeTab === 'active' ? accent.DEFAULT : colors.text.muted}>
            En vente ({activeCount})
          </AppText>
        </AppPressable>
        <AppPressable
          haptic="selection"
          onPress={() => setActiveTab('sold')}
          style={[styles.tab, activeTab === 'sold' && { borderBottomColor: accent.DEFAULT, borderBottomWidth: 2 }]}
        >
          <AppText variant="bodyStrong" color={activeTab === 'sold' ? accent.DEFAULT : colors.text.muted}>
            Vendues ({soldCount})
          </AppText>
        </AppPressable>
      </View>

      {/* Liste */}
      {isLoading ? (
        <View style={styles.loadingList}>
          <Skeleton width="100%" height={110} borderRadius={radii.xl} />
          <Skeleton width="100%" height={110} borderRadius={radii.xl} />
          <Skeleton width="100%" height={110} borderRadius={radii.xl} />
        </View>
      ) : displayedListings.length === 0 ? (
        <EmptyState
          icon={<Tag size={36} color={colors.text.subtle} />}
          title={activeTab === 'active' ? 'Aucune annonce en vente' : 'Aucune annonce vendue'}
          description={
            activeTab === 'active'
              ? 'Publiez votre premier article pour commencer à vendre à Daloa.'
              : 'Vos articles marqués comme vendus apparaîtront ici.'
          }
          actionTitle={activeTab === 'active' ? 'Créer une annonce' : undefined}
          onActionPress={activeTab === 'active' ? () => router.push('/listing/create' as any) : undefined}
        />
      ) : (
        <FlatList
          data={displayedListings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={accent.DEFAULT} />
          }
        />
      )}

      {/* Modale confirmation Marquer vendu */}
      <ConfirmDialog
        visible={confirmAction === 'sell'}
        type="warning"
        title="Marquer comme vendu"
        message={`Voulez-vous retirer "${targetListing?.title}" du catalogue actif ? L'annonce sera conservée dans vos articles vendus.`}
        confirmText="Marquer vendu"
        cancelText="Annuler"
        isLoading={isActionLoading}
        onConfirm={handleExecuteAction}
        onCancel={() => {
          setConfirmAction(null);
          setTargetListing(null);
        }}
      />

      <BoostSheet
        visible={confirmAction === 'boost'}
        listingTitle={targetListing?.title}
        credits={credits}
        isLoading={isActionLoading}
        onConfirm={handleBoost}
        onBuyCredits={() => {
          setConfirmAction(null);
          setTargetListing(null);
          router.push('/pro/packs' as any);
        }}
        onCancel={() => {
          setConfirmAction(null);
          setTargetListing(null);
        }}
      />

      {/* Remettre en vente : on demande le stock, sinon l'annonce revient a 0 */}
      <RestockSheet
        visible={confirmAction === 'reactivate'}
        listingTitle={targetListing?.title}
        variants={targetListing?.variants}
        isLoading={isActionLoading}
        onConfirm={handleRestock}
        onCancel={() => {
          setConfirmAction(null);
          setTargetListing(null);
        }}
      />

      {/* Modale confirmation Supprimer */}
      <ConfirmDialog
        visible={confirmAction === 'delete'}
        type="danger"
        title="Supprimer l'annonce"
        message={`Voulez-vous vraiment supprimer définitivement "${targetListing?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isActionLoading}
        onConfirm={handleExecuteAction}
        onCancel={() => {
          setConfirmAction(null);
          setTargetListing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[3],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backBtn: { padding: spacing[1] },
  headerTitle: { flex: 1, textAlign: 'center' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  createBtnText: { fontFamily: typography.families.bold },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    height: 42,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text.DEFAULT },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginTop: spacing[3],
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing[3] },
  loadingList: { padding: spacing[4], gap: spacing[3] },
  listContent: { padding: spacing[4], gap: spacing[3] },
});
