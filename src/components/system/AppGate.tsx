import React from 'react';
import { useSystemSettings } from '@daloa/api';
import { useAuth } from '../../context/AuthContext';
import { MaintenanceScreen } from './MaintenanceScreen';
import { CompleteProfileScreen } from './CompleteProfileScreen';

/**
 * Garde globale de l'application, montée au-dessus du routeur :
 *  1. Mode maintenance serveur → écran maintenance (kill-switch).
 *  2. Utilisateur connecté au profil incomplet → écran de complétion.
 * Sinon, rend l'app normalement.
 */
export const AppGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: settings, refetch } = useSystemSettings();
  const { user, profile, isLoading, isProfileComplete } = useAuth();

  // 1. Maintenance (admins non gérés en natif : la modération passe par le web)
  if (settings?.maintenance.enabled) {
    return (
      <MaintenanceScreen
        message={settings.maintenance.message}
        expectedReopening={settings.maintenance.expected_reopening}
        onRetry={() => refetch()}
      />
    );
  }

  // 2. Profil incomplet (ex : inscription Google). On attend que le profil soit chargé.
  if (!isLoading && user && profile && !isProfileComplete) {
    return <CompleteProfileScreen />;
  }

  return <>{children}</>;
};
