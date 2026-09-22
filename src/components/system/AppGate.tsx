import React from 'react';
import { useSystemSettings } from '@daloa/api';
import { useAuth } from '../../context/AuthContext';
import { MaintenanceScreen } from './MaintenanceScreen';
import { CompleteProfileScreen } from './CompleteProfileScreen';
import { BannedScreen } from './BannedScreen';

/**
 * Garde globale de l'application, montée au-dessus du routeur :
 *  1. Mode maintenance serveur → écran maintenance (kill-switch).
 *  2. Utilisateur banni → écran de blocage et recours (sauf admin).
 *  3. Utilisateur connecté au profil incomplet → écran de complétion.
 * Sinon, rend l'app normalement.
 */
export const AppGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: settings, refetch } = useSystemSettings();
  const { user, profile, isLoading, isProfileComplete, isAdmin } = useAuth();

  // 1. Maintenance (admins autorisés à naviguer)
  if (settings?.maintenance?.enabled && !isAdmin) {
    return (
      <MaintenanceScreen
        message={settings.maintenance.message}
        expectedReopening={settings.maintenance.expected_reopening}
        onRetry={() => refetch()}
      />
    );
  }

  // 2. Utilisateur banni (interdiction totale sauf admin)
  const isBanned = Boolean(profile?.banned || (profile as any)?.is_banned);
  if (!isLoading && user && profile && isBanned && !isAdmin) {
    return <BannedScreen />;
  }

  // 3. Profil incomplet (ex : inscription Google). On attend que le profil soit chargé.
  if (!isLoading && user && profile && !isProfileComplete) {
    return <CompleteProfileScreen />;
  }

  return <>{children}</>;
};
