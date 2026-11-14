import React from 'react';
import { CreditCard, MapPin } from 'lucide-react-native';
import { colors } from '@daloa/ui';
import { isLocationInDaloa } from '@daloa/utils';
import { AuthGuardView } from '../common/AuthGuardView';
import { RequirementGuardView } from '../common/RequirementGuardView';

interface ListingCreateGuardsProps {
  isAuthenticated: boolean;
  hasUser: boolean;
  profile: Record<string, any> | null | undefined;
  onNavigatePayout: () => void;
  onNavigateShop: () => void;
}

/**
 * Retourne un écran de blocage si l'utilisateur n'est pas connecté ou n'a pas
 * encore configuré ses coordonnées de retrait / sa boutique à Daloa, sinon null.
 */
export function renderListingCreateGuard({
  isAuthenticated,
  hasUser,
  profile,
  onNavigatePayout,
  onNavigateShop,
}: ListingCreateGuardsProps): React.ReactElement | null {
  if (!isAuthenticated || !hasUser) {
    return (
      <AuthGuardView
        title="Connexion requise"
        description="Vous devez être connecté pour publier une annonce sur DaloaMarket."
        fallbackRoute="/(tabs)"
      />
    );
  }

  const hasPayoutInfo = Boolean(profile?.payout_network && profile?.payout_number);
  if (!hasPayoutInfo) {
    return (
      <RequirementGuardView
        icon={<CreditCard size={32} color={colors.status.warningDark} />}
        title="Coordonnées de retrait requises"
        description="Configurez votre compte Mobile Money (Wave, Orange, MTN...) pour recevoir vos gains."
        actionLabel="Configurer mes coordonnées"
        onAction={onNavigatePayout}
      />
    );
  }

  const hasShopLocation = Boolean(
    profile?.district && profile?.shop_latitude != null && profile?.shop_longitude != null,
  );
  const isSuperOrAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isShopInDaloa =
    hasShopLocation &&
    (isSuperOrAdmin ||
      isLocationInDaloa(Number(profile?.shop_latitude), Number(profile?.shop_longitude)));

  if (!hasShopLocation || !isShopInDaloa) {
    return (
      <RequirementGuardView
        icon={
          <MapPin
            size={32}
            color={hasShopLocation ? colors.status.errorDark : colors.status.infoDark}
          />
        }
        title={hasShopLocation ? 'Vente réservée à Daloa' : 'Localisation de boutique requise'}
        description={
          hasShopLocation
            ? 'Seuls les vendeurs situés à Daloa peuvent vendre sur DaloaMarket.'
            : 'Positionnez votre boutique sur la carte afin que les acheteurs et livreurs vous localisent.'
        }
        actionLabel={hasShopLocation ? 'Mettre à jour ma position à Daloa' : 'Définir la position'}
        onAction={onNavigateShop}
      />
    );
  }

  return null;
}
