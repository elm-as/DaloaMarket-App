import { supabase } from '../supabase';
import { SecureStorageAdapter } from '@daloa/utils';

/**
 * Parrainage ambassadeur — capture du code, puis rattachement.
 *
 * Pendant du service web (`DaloaMarket-v2/src/services/referralService.ts`), avec
 * la même règle : on sépare le moment où le code arrive du moment où il est
 * consommé. Sur mobile, l'écart entre les deux est encore plus large — Google
 * sort de l'application pour revenir par lien profond, et Android peut tuer le
 * processus entre-temps. D'où un stockage persistant, jamais la mémoire.
 *
 * Le code arrive par trois chemins :
 *   1. un lien d'application `https://daloamarket.com/...?ref=CODE` ;
 *   2. un lien de schéma `daloamarket://...?ref=CODE` ;
 *   3. la saisie à la main dans l'écran d'inscription.
 */

const CODE_KEY = '@daloa_ref_code';
const CODE_AT_KEY = '@daloa_ref_code_at';
const TRIED_KEY = '@daloa_ref_tried';

/** Au-delà, on considère que la visite n'a plus de rapport avec l'ambassadeur. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Forme d'un code ambassadeur : lettres, chiffres et tirets. */
const CODE_SHAPE = /^[A-Z0-9][A-Z0-9-]{2,23}$/;

/** Noms acceptés dans l'URL — les supports imprimés n'ont pas tous le même. */
const URL_PARAMS = ['ref', 'ambassador', 'parrain', 'code_parrain'];

const normalize = (raw: string | null | undefined): string | null => {
  const code = (raw || '').trim().toUpperCase();
  return CODE_SHAPE.test(code) ? code : null;
};

/**
 * Extrait un code d'une URL entrante, quelle que soit sa forme.
 *
 * `URL` n'accepte pas les schémas personnalisés partout sur Hermes : on lit donc
 * la chaîne de requête à la main plutôt que de faire confiance à l'analyseur.
 */
const codeFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const query = url.split('#')[0].split('?')[1];
  if (!query) return null;

  for (const pair of query.split('&')) {
    const [rawKey, rawValue] = pair.split('=');
    if (!rawKey || rawValue === undefined) continue;
    if (!URL_PARAMS.includes(decodeURIComponent(rawKey).toLowerCase())) continue;

    try {
      const code = normalize(decodeURIComponent(rawValue));
      if (code) return code;
    } catch {
      // Séquence d'échappement invalide : on ignore ce paramètre.
    }
  }
  return null;
};

/**
 * Met de côté le code contenu dans une URL entrante, s'il y en a un.
 * Appelé pour le lien d'ouverture comme pour ceux reçus application ouverte.
 */
export const captureReferralFromUrl = async (url: string | null | undefined): Promise<string | null> => {
  const code = codeFromUrl(url);
  if (!code) return null;
  await storeReferralCode(code);
  return code;
};

/** Met de côté un code saisi à la main. */
export const storeReferralCode = async (raw: string): Promise<string | null> => {
  const code = normalize(raw);
  if (!code) return null;

  await SecureStorageAdapter.setItem(CODE_KEY, code);
  await SecureStorageAdapter.setItem(CODE_AT_KEY, String(Date.now()));
  // Un nouveau code remplace l'ancien : les comptes déjà essayés ne le concernent pas.
  await SecureStorageAdapter.removeItem(TRIED_KEY);
  return code;
};

/** Le code en attente, ou `null` s'il n'y en a pas ou qu'il a expiré. */
export const getPendingReferralCode = async (): Promise<string | null> => {
  const code = normalize(await SecureStorageAdapter.getItem(CODE_KEY));
  if (!code) return null;

  const at = Number((await SecureStorageAdapter.getItem(CODE_AT_KEY)) || 0);
  if (at > 0 && Date.now() - at > MAX_AGE_MS) {
    await clearPendingReferral();
    return null;
  }
  return code;
};

export const clearPendingReferral = async (): Promise<void> => {
  await SecureStorageAdapter.removeItem(CODE_KEY);
  await SecureStorageAdapter.removeItem(CODE_AT_KEY);
  await SecureStorageAdapter.removeItem(TRIED_KEY);
};

/** Comptes déjà présentés à ce code — on ne réessaie pas à chaque synchronisation. */
const alreadyTried = async (userId: string): Promise<boolean> => {
  try {
    const list = JSON.parse((await SecureStorageAdapter.getItem(TRIED_KEY)) || '[]');
    return Array.isArray(list) && list.includes(userId);
  } catch {
    return false;
  }
};

const rememberTried = async (userId: string): Promise<void> => {
  try {
    const list = JSON.parse((await SecureStorageAdapter.getItem(TRIED_KEY)) || '[]');
    const next: string[] = Array.isArray(list) ? list : [];
    if (!next.includes(userId)) next.push(userId);
    // Un téléphone partagé peut voir passer plusieurs comptes ; on n'en garde
    // que les derniers pour ne pas laisser enfler le stockage.
    await SecureStorageAdapter.setItem(TRIED_KEY, JSON.stringify(next.slice(-5)));
  } catch {
    // Stockage indisponible : on retentera, la base tranchera de nouveau.
  }
};

/**
 * Rattache le compte à l'ambassadeur si un code est en attente.
 *
 * Silencieux par construction : un refus (compte déjà ancien, code inconnu,
 * vendeur déjà parrainé) n'a rien à dire à l'utilisateur, qui n'a souvent même
 * pas conscience d'avoir un code. La base journalise chaque tentative dans
 * `ambassador_referral_attempts`, c'est là que ça se regarde.
 *
 * @returns `true` si le rattachement vient d'être enregistré.
 */
export const redeemPendingReferral = async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;

  const code = await getPendingReferralCode();
  if (!code || (await alreadyTried(userId))) return false;

  try {
    const { data, error } = await (supabase.rpc as any)('link_seller_to_ambassador', {
      p_seller_id: userId,
      p_referral_code: code,
    });

    // Erreur réseau ou serveur : le code reste en attente pour la prochaine session.
    if (error) return false;

    if (data === true) {
      await clearPendingReferral();
      return true;
    }

    // Refus : ce compte-ci n'est pas éligible. On garde le code — sur un
    // téléphone prêté, le vendeur qui suit peut encore l'être — mais on
    // n'insiste plus avec ce compte.
    await rememberTried(userId);
    return false;
  } catch (err) {
    console.warn('Parrainage : rattachement impossible', err);
    return false;
  }
};

export const referralService = {
  captureReferralFromUrl,
  storeReferralCode,
  getPendingReferralCode,
  clearPendingReferral,
  redeemPendingReferral,
};
