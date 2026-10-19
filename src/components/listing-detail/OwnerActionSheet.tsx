import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Edit3, CheckCircle2, RotateCcw, Trash2, ExternalLink, Zap } from 'lucide-react-native';
import { BottomSheet, ConfirmDialog, AppText, AppPressable, colors, radii, spacing, useAccent, showAlert } from '@daloa/ui';
import { formatFCFA, Haptics } from '@daloa/utils';
import { supabase, listingsService } from '@daloa/api';
import { useAuth } from '../../context/AuthContext';
import { RestockSheet, type RestockVariant } from '../seller/RestockSheet';
import { BoostSheet } from '../seller/BoostSheet';

export interface OwnerActionListing {
  id: string;
  title: string;
  price: number;
  status?: string;
  photos?: string[];
  /** Nécessaire pour demander le restock par option lors d'une remise en vente. */
  variants?: RestockVariant[] | null;
}

interface OwnerActionSheetProps {
  visible: boolean;
  onClose: () => void;
  listing: OwnerActionListing | null;
  onListingUpdated?: () => void;
}

/**
 * Feuille d'actions rapides pour le propriétaire d'une annonce.
 * Permet de modifier, marquer vendu / réactiver, supprimer ou voir dans ses annonces.
 */
export const OwnerActionSheet: React.FC<OwnerActionSheetProps> = ({
  visible,
  onClose,
  listing,
  onListingUpdated,
}) => {
  const router = useRouter();
  const accent = useAccent();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  if (!listing) return null;

  const isSold = listing.status === 'sold';
  const photoUri = listing.photos?.[0];

  const handleEdit = () => {
    onClose();
    router.push(`/listing/create?id=${listing.id}` as any);
  };

  const handleToggleStatus = async () => {
    // Remettre en vente exige une quantité : réactiver sans restock laissait
    // `stock` à 0 et l'annonce se faisait éjecter du panier des acheteurs.
    if (isSold) {
      setShowRestock(true);
      return;
    }
    try {
      setIsUpdatingStatus(true);
      await listingsService.markListingAsSold(listing.id);
      Haptics.success();
      onListingUpdated?.();
      onClose();
    } catch (err) {
      console.warn('Erreur mise à jour statut:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRestock = async (stock: number, variantStocks?: Record<string, number>) => {
    try {
      setIsUpdatingStatus(true);
      await listingsService.markListingAsActive(listing.id, stock, variantStocks);
      Haptics.success();
      setShowRestock(false);
      onListingUpdated?.();
      onClose();
    } catch (err) {
      console.warn('Erreur remise en vente:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await listingsService.deleteListing(listing.id);
      Haptics.success();
      setShowDeleteConfirm(false);
      onListingUpdated?.();
      onClose();
    } catch (err) {
      console.warn('Erreur suppression annonce:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push('/seller/my-listings' as any);
  };

  const handleOpenBoost = async () => {
    if (!user?.id) return;
    try {
      const { data: me } = await supabase
        .from('users_private')
        .select('listing_credits')
        .eq('id', user.id)
        .maybeSingle();
      setCredits(me?.listing_credits ?? 0);
    } catch {
      setCredits(0);
    }
    setShowBoost(true);
  };

  const handleExecuteBoost = async (days: 1 | 2 | 7) => {
    try {
      setIsBoosting(true);
      await listingsService.boostWithCredits(listing.id, days);
      Haptics.success();
      setShowBoost(false);
      onListingUpdated?.();
      onClose();
    } catch (err: any) {
      showAlert('Boost impossible', err?.message || 'Réessayez dans un instant.');
    } finally {
      setIsBoosting(false);
    }
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} title="Gérer votre annonce">
        <View style={styles.container}>
          {/* En-tête annonce */}
          <View style={styles.listingHeader}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
            )}
            <View style={styles.listingInfo}>
              <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
                {listing.title}
              </AppText>
              <AppText variant="label" color={accent[600]} style={styles.price} numberOfLines={1}>
                {formatFCFA(listing.price)}
              </AppText>
            </View>
          </View>

          {/* Liste des actions */}
          <View style={styles.actionsList}>
            <AppPressable
              onPress={handleEdit}
              style={styles.actionRow}
              rippleColor="rgba(0,0,0,0.06)"
              accessibilityRole="button"
              accessibilityLabel="Modifier l'annonce"
            >
              <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
                <Edit3 size={18} color={accent.DEFAULT} />
              </View>
              <View style={styles.actionTextWrap}>
                <AppText variant="bodyStrong">Modifier l'annonce</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Changer le prix, les photos ou les variantes
                </AppText>
              </View>
            </AppPressable>

            <AppPressable
              onPress={handleToggleStatus}
              disabled={isUpdatingStatus}
              style={styles.actionRow}
              rippleColor="rgba(0,0,0,0.06)"
              accessibilityRole="button"
              accessibilityLabel={isSold ? 'Remettre en vente' : 'Marquer comme vendue'}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isSold ? colors.status.infoLight : colors.status.successLight },
                ]}
              >
                {isSold ? (
                  <RotateCcw size={18} color={colors.status.infoDark} />
                ) : (
                  <CheckCircle2 size={18} color={colors.status.successDark} />
                )}
              </View>
              <View style={styles.actionTextWrap}>
                <AppText variant="bodyStrong">
                  {isSold ? 'Remettre en vente' : 'Marquer comme vendue'}
                </AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  {isSold
                    ? "Rend l'annonce de nouveau visible aux acheteurs"
                    : 'Retire cet article des résultats du catalogue'}
                </AppText>
              </View>
            </AppPressable>

            <AppPressable
              onPress={handleOpenBoost}
              style={styles.actionRow}
              rippleColor="rgba(0,0,0,0.06)"
              accessibilityRole="button"
              accessibilityLabel="Booster l'annonce"
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary[50] }]}>
                <Zap size={18} color={colors.primary.DEFAULT} />
              </View>
              <View style={styles.actionTextWrap}>
                <AppText variant="bodyStrong">Booster l'annonce</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Dès 100 FCFA (24h, 2j ou 7j en priorité)
                </AppText>
              </View>
            </AppPressable>

            <AppPressable
              onPress={handleViewAll}
              style={styles.actionRow}
              rippleColor="rgba(0,0,0,0.06)"
              accessibilityRole="button"
              accessibilityLabel="Voir toutes mes annonces"
            >
              <View style={[styles.iconBox, { backgroundColor: colors.bg.subtle }]}>
                <ExternalLink size={18} color={colors.text.body} />
              </View>
              <View style={styles.actionTextWrap}>
                <AppText variant="bodyStrong">Voir dans « Mes annonces »</AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Accéder à la liste complète de vos articles
                </AppText>
              </View>
            </AppPressable>

            <AppPressable
              onPress={() => setShowDeleteConfirm(true)}
              style={[styles.actionRow, styles.deleteRow]}
              rippleColor="rgba(239, 68, 68, 0.08)"
              accessibilityRole="button"
              accessibilityLabel="Supprimer définitivement l'annonce"
            >
              <View style={[styles.iconBox, { backgroundColor: colors.status.errorLight }]}>
                <Trash2 size={18} color={colors.status.errorDark} />
              </View>
              <View style={styles.actionTextWrap}>
                <AppText variant="bodyStrong" color={colors.status.errorDark}>
                  Supprimer l'annonce
                </AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Action irréversible : l'article sera effacé
                </AppText>
              </View>
            </AppPressable>
          </View>
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Supprimer cette annonce ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement « ${listing.title} » ? Cette opération ne peut pas être annulée.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <RestockSheet
        visible={showRestock}
        listingTitle={listing.title}
        variants={listing.variants}
        isLoading={isUpdatingStatus}
        onConfirm={handleRestock}
        onCancel={() => setShowRestock(false)}
      />

      <BoostSheet
        visible={showBoost}
        listingTitle={listing.title}
        credits={credits}
        isLoading={isBoosting}
        onConfirm={handleExecuteBoost}
        onBuyCredits={() => {
          setShowBoost(false);
          onClose();
          router.push('/pro/packs' as any);
        }}
        onCancel={() => setShowBoost(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: spacing[4] },
  listingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingBottom: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle, marginBottom: spacing[2] },
  thumbnail: { width: 60, height: 60, borderRadius: radii.lg, backgroundColor: colors.bg.subtle, flexShrink: 0 },
  thumbnailPlaceholder: { borderWidth: 1, borderColor: colors.border.subtle },
  listingInfo: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 14, lineHeight: 19 },
  price: { fontVariant: ['tabular-nums'] },
  actionsList: { gap: spacing[1] },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[2], borderRadius: radii.xl },
  deleteRow: { marginTop: spacing[1] },
  iconBox: { width: 42, height: 42, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  actionTextWrap: { flex: 1, gap: 2 },
});
