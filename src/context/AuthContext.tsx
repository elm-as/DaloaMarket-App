import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, RegisterInput, LoginInput } from '@daloa/types';
import { authService, supabase } from '@daloa/api';
import { SecureStorageAdapter } from '@daloa/utils';

const CACHED_PROFILE_KEY = '@daloa_cached_user_profile';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  /**
   * Confort d'affichage uniquement : masque la console admin aux non-admins.
   * L'autorisation réelle est appliquée en base par `is_admin_or_service_role()`,
   * jamais par ce booléen.
   */
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Rôles donnant accès à la console d'administration mobile. */
const ADMIN_ROLES = ['admin', 'superadmin'];

/** Profil transactionnel complet : nom + téléphone WhatsApp + quartier. */
function computeProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return [profile.full_name, profile.phone, (profile as any).district]
    .map((v) => (v == null ? '' : String(v)))
    .every((v) => v.trim().length > 0);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      // 1. Hydratation immédiate depuis le stockage persistant
      const cached = await SecureStorageAdapter.getItem(CACHED_PROFILE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setProfile(parsed);
          }
        } catch {}
      }

      const sessionData = await authService.getCurrentSession();
      setUser(sessionData.user);
      if (sessionData.profile) {
        setProfile(sessionData.profile);
        void SecureStorageAdapter.setItem(CACHED_PROFILE_KEY, JSON.stringify(sessionData.profile));
      }
    } catch (err) {
      console.warn('Erreur chargement session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Écouter les changements d'état d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: p } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (p) {
          const prof = { ...p, isPro: Boolean(p.pro_until && new Date(p.pro_until) > new Date()) };
          setProfile(prof);
          void SecureStorageAdapter.setItem(CACHED_PROFILE_KEY, JSON.stringify(prof));
        }
      } else {
        setUser(null);
        setProfile(null);
        void SecureStorageAdapter.removeItem(CACHED_PROFILE_KEY);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (input: LoginInput) => {
    const result = await authService.login(input);
    setUser(result.user);
    if (result.profile) {
      setProfile(result.profile);
      void SecureStorageAdapter.setItem(CACHED_PROFILE_KEY, JSON.stringify(result.profile));
    }
  };

  const register = async (input: RegisterInput) => {
    const result = await authService.register(input);
    setUser(result.user);
    if (result.profile) {
      setProfile(result.profile);
      void SecureStorageAdapter.setItem(CACHED_PROFILE_KEY, JSON.stringify(result.profile));
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Erreur déconnexion authService:', err);
    } finally {
      setUser(null);
      setProfile(null);
      await SecureStorageAdapter.removeItem(CACHED_PROFILE_KEY);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const { data: p } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (p) setProfile({ ...p, isPro: Boolean(p.pro_until && new Date(p.pro_until) > new Date()) });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: Boolean(user),
        isProfileComplete: computeProfileComplete(profile),
        isAdmin: ADMIN_ROLES.includes(String((profile as any)?.role || '').toLowerCase()),
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
};
