import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Search, Tag } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, ConfirmDialog, EmptyState, Skeleton } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { supabase, listingsService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { safeBack } from '../../src/utils/navigation';
import { SellerListingCard } from '../../src/components/seller/SellerListingCard';

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
  const [confirmAction, setConfirmAction] = useState<'sell' | 'reactivate' | 'delete' | null>(null);
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
  const soldCount = useMemo(
    () => listings.filter((l) => l.status === 'sold').length,
    [listings]
  );

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
      } else if (confirmAction === 'reactivate') {
        await listingsService.markListingAsActive(targetListing.id);
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

  const renderItem = ({ item }: { item: any }) => (
    <SellerListingCard
      item={item}
      onPress={() => router.push(`/listing/${item.id}` as any)}
      onEdit={() => router.push(`/listing/${item.id}` as any)}
      onToggleStatus={() => {
        setTargetListing(item);
        setConfirmAction(item.status === 'sold' ? 'reactivate' : 'sell');
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

      {/* Modale confirmation Remettre en vente */}
      <ConfirmDialog
        visible={confirmAction === 'reactivate'}
        type="info"
        title="Remettre en vente"
        message={`Voulez-vous réactiver "${targetListing?.title}" dans le catalogue DaloaMarket ?`}
        confirmText="Remettre en vente"
        cancelText="Annuler"
        isLoading={isActionLoading}
        onConfirm={handleExecuteAction}
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
  backBtn: {
    padding: spacing[1],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  createBtnText: {
    fontWeight: '700',
  },
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
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text.DEFAULT,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginTop: spacing[3],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  loadingList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
});
