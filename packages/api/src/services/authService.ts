import { supabase } from '../supabase';
import { UserProfile, RegisterInput, LoginInput, DeliveryPersonRow } from '@daloa/types';

export const authService = {
  /**
   * Récupère la session active et le profil utilisateur
   */
  async getCurrentSession(): Promise<{
    user: any | null;
    profile: UserProfile | null;
    deliveryProfile?: DeliveryPersonRow | null;
  }> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      return { user: null, profile: null, deliveryProfile: null };
    }

    const userId = session.user.id;

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Si rôle livreur, récupérer aussi le profil delivery_person
    let deliveryProfile: DeliveryPersonRow | null = null;
    if (profile?.role === 'delivery') {
      const { data: dProfile } = await supabase
        .from('delivery_persons')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      deliveryProfile = dProfile;
    }

    return {
      user: session.user,
      profile: profile ? { ...profile, isPro: Boolean(profile.pro_until && new Date(profile.pro_until) > new Date()) } : null,
      deliveryProfile,
    };
  },

  /**
   * Connexion par Email/Téléphone et mot de passe
   */
  async login({ emailOrPhone, password }: LoginInput): Promise<{ user: any; profile: UserProfile | null }> {
    let email = emailOrPhone.trim();
    if (!email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `${digits}@daloamarket.ci`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'default-secret-password',
    });

    if (error) throw error;
    if (!data.user) throw new Error('Utilisateur introuvable');

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: data.user,
      profile: profile ? { ...profile, isPro: Boolean(profile.pro_until && new Date(profile.pro_until) > new Date()) } : null,
    };
  },

  /**
   * Inscription d'un acheteur, vendeur ou livreur
   */
  async register(input: RegisterInput): Promise<{ user: any; profile: UserProfile | null }> {
    const email = input.email.trim();
    const password = input.password || 'DaloaPass2026!';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
          district: input.district || 'Centre-ville',
          role: input.role || 'buyer',
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error("Échec de l'inscription");

    const userId = data.user.id;

    // Création ou mise à jour de l'enregistrement dans public.users
    const userPayload = {
      id: userId,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      district: input.district || 'Centre-ville',
      role: input.role || 'buyer',
      cash_on_delivery_enabled: false,
    };

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .upsert(userPayload)
      .select()
      .single();

    if (profileErr) console.warn('Erreur création profil:', profileErr);

    // Si inscription livreur, créer l'entrée delivery_persons
    if (input.role === 'delivery') {
      await supabase.from('delivery_persons').upsert({
        user_id: userId,
        name: input.fullName,
        phone: input.phone,
        vehicle_type: input.vehicleType || 'moto',
        vehicle_details: input.vehicleDetails || 'Moto',
        coverage_zones: input.coverageZones || [input.district || 'Daloa Centre'],
        is_available: false,
        is_verified: false,
        verification_status: 'pending',
      });
    }

    return {
      user: data.user,
      profile: profile || null,
    };
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Mise à jour du profil
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mot de passe oublié
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
