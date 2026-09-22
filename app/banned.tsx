import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { BannedScreen } from '../src/components/system/BannedScreen';

export default function BannedRoute() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const isBanned = Boolean(profile?.banned || (profile as any)?.is_banned);

  useEffect(() => {
    // Si l'utilisateur n'est plus banni ou n'a jamais été banni, retour à l'accueil
    if (!isLoading && !isBanned) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isBanned, router]);

  return <BannedScreen />;
}
