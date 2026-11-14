import React from 'react';
import { Linking } from 'react-native';
import { ConfirmDialog } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';

interface ListingCreateDialogsProps {
  isEditing: boolean;
  showSuccessDialog: boolean;
  createdListingId: string | null;
  title: string;
  price: string;
  errorDialog: string | null;
  onViewListing: () => void;
  onDismissSuccess: () => void;
  onDismissError: () => void;
}

/**
 * Regroupe les boîtes de dialogue de confirmation après publication et d'erreur.
 */
export const ListingCreateDialogs: React.FC<ListingCreateDialogsProps> = ({
  isEditing,
  showSuccessDialog,
  createdListingId,
  title,
  price,
  errorDialog,
  onViewListing,
  onDismissSuccess,
  onDismissError,
}) => (
  <>
    <ConfirmDialog
      visible={showSuccessDialog}
      type="info"
      title={isEditing ? 'Annonce modifiée' : 'Annonce en ligne'}
      message={
        isEditing
          ? 'Vos modifications sont visibles.'
          : 'Partagez votre article sur WhatsApp pour booster vos ventes.'
      }
      confirmText="Voir l'annonce"
      cancelText={isEditing ? 'Fermer' : 'Partager WhatsApp'}
      onConfirm={onViewListing}
      onCancel={() => {
        if (!isEditing && createdListingId) {
          const text = `Regarde mon article sur DaloaMarket : ${title.trim()} à ${formatFCFA(parseFloat(price) || 0)} -> https://daloamarket.com/listing/${createdListingId}`;
          Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {});
        }
        onDismissSuccess();
      }}
    />

    <ConfirmDialog
      visible={Boolean(errorDialog)}
      type="danger"
      title={isEditing ? 'Erreur de mise à jour' : 'Erreur de publication'}
      message={errorDialog || ''}
      confirmText="Compris"
      onConfirm={onDismissError}
      onCancel={onDismissError}
    />
  </>
);
