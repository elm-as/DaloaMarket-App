import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Edit3, CheckCircle2, RotateCcw, Trash2, ExternalLink } from 'lucide-react-native';
import { BottomSheet, ConfirmDialog, AppText, AppPressable, colors, radii, spacing, useAccent } from '@daloa/ui';
import { formatFCFA, Haptics } from '@daloa/utils';
import { listingsService } from '@daloa/api';

export interface OwnerActionListing {
  id: string;
  title: string;
  price: number;
  status?: string;
  photos?: string[];
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!listing) return null;

  const isSold = listing.status === 'sold';
  const photoUri = listing.photos?.[0];

  const handleEdit = () => {
    onClose();
    router.push(`/listing/create?id=${listing.id}` as any);
  };

  const handleToggleStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      if (isSold) {
        await listingsService.markListingAsActive(listing.id);
      } else {
        await listingsService.markListingAsSold(listing.id);
      }
      Haptics.success();
      onListingUpdated?.();
      onClose();
    } catch (err) {
      console.warn('Erreur mise à jour statut:', err);
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
              <AppText variant="label" color={accent[600]} style={styles.price}>
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

      {/* Confirmation de suppression stylisée */}
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing[4],
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginBottom: spacing[2],
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
  },
  thumbnailPlaceholder: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  listingInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
  },
  price: {
    fontVariant: ['tabular-nums'],
  },
  actionsList: {
    gap: spacing[1],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radii.xl,
  },
  deleteRow: {
    marginTop: spacing[1],
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
});
