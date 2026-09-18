/**
 * Module de traduction et d'assainissement des erreurs techniques / natives.
 * Transforme les erreurs Supabase, PostgreSQL, réseau et HTTP en messages
 * clairs, professionnels et compréhensibles par les utilisateurs en français.
 */

interface ErrorPatternMapping {
  patterns: Array<string | RegExp>;
  translation: string;
}

const ERROR_PATTERNS: ErrorPatternMapping[] = [
  // 1. Authentification & Comptes (Supabase Auth)
  {
    patterns: [
      /invalid login credentials/i,
      /invalid_credentials/i,
      /invalid email or password/i,
    ],
    translation: 'Identifiants incorrects (numéro/email ou mot de passe invalide).',
  },
  {
    patterns: [
      /user already registered/i,
      /user already exists/i,
      /email already in use/i,
      /phone already in use/i,
    ],
    translation: 'Un compte existe déjà avec cette adresse email ou ce numéro de téléphone.',
  },
  {
    patterns: [
      /password should be at least \d+ characters/i,
      /password is too short/i,
    ],
    translation: 'Le mot de passe doit comporter au moins 6 caractères.',
  },
  {
    patterns: [
      /email not confirmed/i,
      /confirm your email/i,
    ],
    translation: 'Veuillez confirmer votre adresse email pour continuer.',
  },
  {
    patterns: [
      /user not found/i,
      /user with this email not found/i,
    ],
    translation: 'Aucun compte associé à ces identifiants.',
  },
  {
    patterns: [
      /over_email_send_rate_limit/i,
      /rate limit/i,
      /too many requests/i,
    ],
    translation: 'Trop de tentatives en peu de temps. Veuillez patienter quelques instants avant de réessayer.',
  },
  {
    patterns: [
      /jwt expired/i,
      /token is expired/i,
      /session expired/i,
      /invalid jwt/i,
      /token expired/i,
    ],
    translation: 'Votre session a expiré. Veuillez vous reconnecter.',
  },
  {
    patterns: [
      /auth session missing/i,
      /not authenticated/i,
    ],
    translation: 'Vous devez être connecté pour effectuer cette action.',
  },

  // 2. Erreurs Réseau et Connectivité
  {
    patterns: [
      /network request failed/i,
      /failed to fetch/i,
      /load failed/i,
      /networkerror/i,
      /err_internet_disconnected/i,
      /err_network_changed/i,
      /connection refused/i,
    ],
    translation: 'Connexion Internet instable ou interrompue. Vérifiez votre connexion et réessayez.',
  },
  {
    patterns: [
      /aborterror/i,
      /request timeout/i,
      /timeout of \d+ms exceeded/i,
      /the user aborted a request/i,
      /timed? out/i,
    ],
    translation: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
  },

  // 3. Base de données Supabase / PostgreSQL / PostgREST
  {
    patterns: [
      /could not find the (table|view)/i,
      /schema cache/i,
      /relation .* does not exist/i,
      /table .* does not exist/i,
    ],
    translation: 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.',
  },
  {
    patterns: [
      /row-level security/i,
      /violates row-level security policy/i,
      /permission denied/i,
    ],
    translation: 'Action non autorisée ou droits insuffisants pour cette opération.',
  },
  {
    patterns: [
      /violates check constraint/i,
      /check constraint .* failed/i,
    ],
    translation: 'Certaines informations saisies ne respectent pas le format attendu.',
  },
  {
    patterns: [
      /duplicate key value violates unique constraint/i,
    ],
    translation: 'Cette information est déjà associée à un autre enregistrement.',
  },
  {
    patterns: [
      /violates foreign key constraint/i,
    ],
    translation: 'L’élément auquel vous faites référence n’existe plus ou est indisponible.',
  },
  {
    patterns: [
      /null value in column .* violates not-null constraint/i,
    ],
    translation: 'Veuillez renseigner tous les champs obligatoires.',
  },
  {
    patterns: [
      /json object requested, multiple \(or no\) rows returned/i,
      /pgrst116/i,
    ],
    translation: 'Élément introuvable ou indisponible.',
  },

  // 4. Stockage / Fichiers
  {
    patterns: [
      /payload too large/i,
      /file size limit exceeded/i,
      /entity too large/i,
    ],
    translation: 'Le fichier sélectionné est trop volumineux. Veuillez choisir un document plus léger.',
  },
  {
    patterns: [
      /bucket not found/i,
      /storage error/i,
    ],
    translation: 'Espace de stockage temporairement inaccessible.',
  },
];

const TECHNICAL_SIGNATURES: RegExp[] = [
  /pgrst\d+/i,
  /syntax error/i,
  /relation ".*"/i,
  /column ".*"/i,
  /function .* does not exist/i,
  /undefined is not an object/i,
  /cannot read propert(y|ies)/i,
  /null is not an object/i,
  /internal server error/i,
  /status code 50\d/i,
  /bad gateway/i,
  /gateway timeout/i,
  /\bfailed\b/i,
  /\bcannot\b/i,
  /\bcould not\b/i,
  /\bunauthorized\b/i,
  /\bforbidden\b/i,
  /\bnot allowed\b/i,
  /\bunexpected error\b/i,
  /\bsomething went wrong\b/i,
];

/**
 * Assainit un message textuel :
 * - Si le message correspond à une erreur technique ou anglaise connue, renvoie la traduction française.
 * - S'il contient des traces de syntaxe technique (SQL, code PostgREST, mots d'erreur anglais), renvoie le fallback fourni.
 * - S'il s'agit déjà d'un message utilisateur en français, le conserve tel quel.
 */
export function sanitizeUserErrorMessage(
  rawMessage?: string | null,
  fallbackMessage?: string
): string {
  const fallback = fallbackMessage?.trim() || 'Une erreur est survenue. Veuillez réessayer.';
  if (!rawMessage || typeof rawMessage !== 'string') {
    return fallback;
  }

  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return fallback;
  }

  // 1. Vérification des motifs précis
  for (const item of ERROR_PATTERNS) {
    for (const pattern of item.patterns) {
      if (typeof pattern === 'string' && trimmed.toLowerCase().includes(pattern.toLowerCase())) {
        return item.translation;
      }
      if (pattern instanceof RegExp && pattern.test(trimmed)) {
        return item.translation;
      }
    }
  }

  // 2. Détection d'erreurs techniques génériques non répertoriées
  for (const sig of TECHNICAL_SIGNATURES) {
    if (sig.test(trimmed)) {
      return fallback;
    }
  }

  return trimmed;
}

/**
 * Extrait et traduit le message d'une erreur (Error, PostgREST error, chaîne...)
 * en message utilisateur français compréhensible.
 */
export function formatUserErrorMessage(
  error: unknown,
  fallbackMessage?: string
): string {
  const fallback = fallbackMessage?.trim() || 'Une erreur est survenue. Veuillez réessayer.';

  if (!error) {
    return fallback;
  }

  let extractedMessage = '';

  if (typeof error === 'string') {
    extractedMessage = error;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;
    extractedMessage =
      errObj.message ||
      errObj.error_description ||
      errObj.details ||
      errObj.hint ||
      '';
  }

  return sanitizeUserErrorMessage(extractedMessage, fallback);
}
