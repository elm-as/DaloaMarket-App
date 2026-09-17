import { supabase } from '../supabase';
import { decodeBase64ToArrayBuffer } from '../lib/base64';
import { UserProfile, RegisterInput, LoginInput, DeliveryPersonRow } from '@daloa/types';
import { User } from '@supabase/supabase-js';

/**
 * Supprime les fichiers de l'utilisateur via l'API Storage.
 *
 * Indispensable ici : Supabase refuse le DELETE direct sur storage.objects
 * (« Direct deletion from storage tables is not allowed »), donc
 * `delete_my_account()` ne peut qu'inscrire les chemins dans une file de
 * rattrapage. C'est cet appel-ci qui efface reellement les pieces d'identite.
 *
 * Silencieux par conception : un echec ne doit pas empecher l'anonymisation du
 * compte, la file `account_file_purges` garde la trace de ce qui reste.
 */
async function purgeOwnStorageFiles(userId: string): Promise<void> {
  const removeIn = async (bucket: string, folder: string) => {
    const { data: files } = await supabase.storage.from(bucket).list(folder);
    if (files && files.length > 0) {
      await supabase.storage.from(bucket).remove(files.map((f: any) => `${folder}/${f.name}`));
    }
  };

  try {
    await removeIn('avatars', userId);
  } catch { /* la file de rattrapage prendra le relais */ }

  try {
    // Les CNI sont rangees sous l'identifiant de la fiche livreur, pas celui du compte.
    const { data: drivers } = await supabase
      .from('delivery_persons')
      .select('id')
      .eq('user_id', userId);
    for (const d of drivers || []) {
      await removeIn('livreur-cni', (d as any).id);
    }
  } catch { /* idem */ }

  try {
    // livreur-photos nomme ses fichiers « <userId>-<horodatage>.jpg », a la racine.
    const { data: photos } = await supabase.storage.from('livreur-photos').list('');
    const mine = (photos || []).filter((f: any) => f.name.startsWith(`${userId}-`));
    if (mine.length > 0) {
      await supabase.storage.from('livreur-photos').remove(mine.map((f: any) => f.name));
    }
  } catch { /* idem */ }
}

export const authService = {
  /**
   * Récupère la session active et le profil utilisateur
   */
  async getCurrentSession(): Promise<{
    user: User | null;
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

    // Récupérer le profil livreur s'il existe (un utilisateur DaloaMarket peut aussi être livreur DaloaDelivery)
    const { data: deliveryProfile } = await supabase
      .from('delivery_persons')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      user: session.user,
      profile: profile ? { ...profile, isPro: Boolean(profile.pro_until && new Date(profile.pro_until) > new Date()) } : null,
      deliveryProfile,
    };
  },

  /**
   * Connexion par Email ou Téléphone et mot de passe
   */
  async login({ emailOrPhone, password }: LoginInput): Promise<{ user: User; profile: UserProfile | null }> {
    let email = emailOrPhone.trim();
    if (!email.includes('@')) {
      const cleanPhone = email.replace(/[^\d+]/g, '');
      const lastDigits = cleanPhone.slice(-8);
      const { data: matchedUser } = await supabase
        .from('users')
        .select('email')
        .or(`phone.eq.${cleanPhone},phone.ilike.%${lastDigits}%`)
        .limit(1)
        .maybeSingle();

      if (matchedUser?.email) {
        email = matchedUser.email;
      } else {
        email = `${cleanPhone.replace(/\D/g, '')}@daloamarket.ci`;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Utilisateur introuvable');

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      user: data.user,
      profile: profile ? { ...profile, isPro: Boolean(profile.pro_until && new Date(profile.pro_until) > new Date()) } : null,
    };
  },

  /**
   * Inscription d'un acheteur, vendeur ou livreur
   */
  async register(input: RegisterInput): Promise<{ user: User; profile: UserProfile | null }> {
    const email = input.email.trim();
    const password = input.password;

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

    // Création ou mise à jour de l'enregistrement dans public.users (colonnes réelles)
    const userPayload: any = {
      id: userId,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      district: input.district || 'Centre-ville',
      role: input.role || 'buyer',
    };

    if (input.role === 'seller' && input.shopName) {
      userPayload.shop_name = input.shopName;
    }

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .upsert(userPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (profileErr) console.warn('Avertissement profil:', profileErr.message);

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
      }, { onConflict: 'user_id' });
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erreur lors de supabase.auth.signOut:', err);
    }
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

  /**
   * Suppression définitive du compte (exigence Google Play).
   *
   * Côté serveur, requiert une fonction Postgres `delete_my_account()` en
   * SECURITY DEFINER qui :
   *   1. supprime/anonymise les données de l'utilisateur courant (auth.uid()),
   *   2. supprime la ligne auth (via auth.users) ou la marque supprimée.
   * Elle s'exécute avec le JWT de l'utilisateur (aucune clé service_role côté client).
   * Le fallback marque le profil `deletion_requested` si la RPC n'existe pas encore.
   */
  async deleteAccount(): Promise<void> {
    // Les fichiers partent d'abord : apres la RPC, la session est revoquee et
    // l'API Storage refusera l'acces.
    const { data: sessionUser } = await supabase.auth.getUser();
    if (sessionUser.user?.id) {
      await purgeOwnStorageFiles(sessionUser.user.id);
    }

    const { error } = await supabase.rpc('delete_my_account');

    if (error) {
      // Fallback : demande de suppression enregistrée pour traitement manuel/cron.
      const { data: sessionData } = await supabase.auth.getUser();
      const uid = sessionData.user?.id;
      if (uid) {
        await supabase
          .from('users')
          .update({ deletion_requested_at: new Date().toISOString() })
          .eq('id', uid);
      }
    }

    await supabase.auth.signOut();
  },

  /**
   * Téléverse un avatar utilisateur vers Supabase Storage (bucket 'avatars')
   * et met à jour l'enregistrement dans la table 'users'.
   *
   * Utilise ArrayBuffer pour garantir une compatibilité totale React Native Android/iOS.
   */
  async uploadAvatar(userId: string, input: UploadAvatarInput): Promise<string> {
    const mimeType = input.mimeType || 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const path = `${userId}/avatar_${Date.now()}.${ext}`;

    let bodyData: ArrayBuffer | Blob;

    if (input.base64) {
      bodyData = decodeBase64ToArrayBuffer(input.base64);
    } else if (input.uri) {
      const response = await fetch(input.uri);
      bodyData = await response.blob();
    } else {
      throw new Error('Aucune donnée d’image fournie pour l’avatar.');
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bodyData, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Échec upload avatar storage:', uploadError);
      throw new Error(`Erreur lors du téléversement de la photo: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (dbError) {
      console.error('Échec mise à jour users.avatar_url:', dbError);
      throw new Error(`Erreur lors de la sauvegarde du profil: ${dbError.message}`);
    }

    return publicUrl;
  },
};

export interface UploadAvatarInput {
  base64?: string | null;
  uri?: string;
  mimeType?: string;
}
