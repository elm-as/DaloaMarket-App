import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useListings } from '@daloa/api';
import { MARKET_CATEGORIES, DALOA_DISTRICTS } from '@daloa/config';
import { ListingFull } from '@daloa/types';
import { colors, radii, spacing, typography, SearchInput, Skeleton, EmptyState, Badge } from '@daloa/ui';
import { ListingCard } from '../../src/components/ListingCard';
import { CategoryPill } from '../../src/components/CategoryPill';
import { Plus, MessageSquare, ShieldCheck, MapPin, Sparkles, Zap } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch, isRefetching } = useListings({
    category: selectedCategory,
    searchQuery: searchQuery.length > 0 ? searchQuery : undefined,
  });

  const listings = data?.data || [];
  const boostedListings = listings.filter(
    (l) => l.boosted_until && new Date(l.boosted_until) > new Date()
  );

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? undefined : categoryId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>DM</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>DaloaMarket</Text>
            <View style={styles.locationRow}>
              <MapPin size={11} color={colors.market.primary} />
              <Text style={styles.locationText}>Daloa, Côte d’Ivoire</Text>
            </View>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.lightImpact();
              router.push('/chat');
            }}
            style={styles.iconButton}
          >
            <MessageSquare size={20} color={colors.dark.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.lightImpact();
              router.push('/listing/create');
            }}
            style={styles.publishBtn}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.publishText}>Vendre</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de Recherche rapide */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher à Daloa (ex: iPhone, Moto, Robe...)"
          onFilterPress={() => router.push('/(tabs)/search')}
        />
      </View>

      {/* Contenu Défilant */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.market.primary}
          />
        }
      >
        {/* Bannière Hero / Escrow Sécurisé */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.escrowPill}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.escrowText}>100% Sécurisé par Séquestre</Text>
            </View>
            <Text style={styles.heroTitle}>Achetez & Vendez en toute confiance à Daloa</Text>
            <Text style={styles.heroSubtitle}>
              Paiement Wave / Orange / MTN retenu en sécurité jusqu'à la livraison chez vous.
            </Text>
          </View>
        </View>

        {/* Sélecteur de Catégories Horizontal */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <CategoryPill
            id="all"
            name="Tous"
            isSelected={!selectedCategory}
            onPress={() => setSelectedCategory(undefined)}
          />
          {MARKET_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              name={cat.name}
              isSelected={selectedCategory === cat.id}
              onPress={() => handleCategorySelect(cat.id)}
            />
          ))}
        </ScrollView>

        {/* Annonces Boostées / En Vedette */}
        {boostedListings.length > 0 && !selectedCategory && (
          <View style={styles.boostedSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithIcon}>
                <Zap size={18} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.sectionTitle}>En Vedette à Daloa</Text>
              </View>
              <Badge label="TOP VENTES" variant="pro" />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.boostedScroll}
            >
              {boostedListings.map((listing) => (
                <View key={listing.id} style={{ width: 170, marginRight: spacing[3] }}>
                  <ListingCard
                    listing={listing}
                    onPress={() => router.push(`/listing/${listing.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nouveautés / Flux Principal */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Sparkles size={18} color={colors.market.primary} />
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? MARKET_CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Annonces'
                : 'Dernières Annonces'}
            </Text>
          </View>
          <Text style={styles.countText}>{listings.length} article(s)</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingGrid}>
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
            <Skeleton height={220} width="48%" borderRadius={radii['2xl']} />
          </View>
        ) : listings.length === 0 ? (
          <EmptyState
            title="Aucune annonce trouvée"
            description="Il n’y a pas encore d’article dans cette sélection. Soyez le premier à publier !"
            actionTitle="Publier une annonce"
            onActionPress={() => router.push('/listing/create')}
          />
        ) : (
          <View style={styles.productsGrid}>
            {listings.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.xl,
    backgroundColor: colors.market.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  brandTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    color: colors.dark.textDim,
    fontSize: 11,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.market.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.xl,
    gap: 4,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  heroCard: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    padding: spacing[4],
  },
  heroContent: {
    gap: spacing[2],
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  escrowText: {
    color: '#10B981',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  heroTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
  },
  heroSubtitle: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  seeAllText: {
    color: colors.market.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  countText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  categoriesScroll: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
  },
  boostedSection: {
    marginTop: spacing[2],
  },
  boostedScroll: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
    gap: spacing[3],
    marginTop: spacing[2],
  },
});
