/**
 * Modération de texte et filtre anti-fuite / anti-coordonnées (Data Loss Prevention)
 * Censurer les numéros de téléphone et coordonnées pour protéger les transactions escrow.
 */

const BANNED_PATTERNS = [
  /\barnaque\b/i,
  /\bviagra\b/i,
  /\bargent gratuit\b/i,
  /\bgain facile\b/i,
  /\bbrouteur\b/i,
];

export const CENSOR_MESSAGE = '[Coordonnées masquées par sécurité]';

// Mots-clés réseaux sociaux et expressions directes avec frontières de mots strictes (\b)
// Empêche les faux positifs comme "installé" (insta), "instant", "snapshot", etc.
const SOCIAL_REGEX =
  /\b(?:whatsapp|wa\.me|insta(?:gram)?|snap(?:chat)?|telegram|t\.me|facebook|fb|messenger|tiktok)\b|\b(?:appel(?:le)?[- ]moi|mon num(?:[ée]ro)?|mon contact|mon phone|mon t[ée]l|contacte?[- ]moi (?:sur|au|par)|viens sur (?:wa|whatsapp))\b/gi;

/**
 * Censure les numéros de téléphone et coordonnées de contact dans un texte
 */
export function censorMessageContent(content: string): string {
  if (!content) return content;

  let censored = content;
  const preservedTokens: { placeholder: string; value: string }[] = [];

  // Protéger les UUID (références de commandes, listings, utilisateurs)
  censored = censored.replace(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
    (uuid) => {
      const placeholder = `__UUID_TOKEN_${preservedTokens.length}__`;
      preservedTokens.push({ placeholder, value: uuid });
      return placeholder;
    }
  );

  // 1. Détection des numéros même s'ils sont écrits en lettres (ex: "zéro sept 8...")
  const digitWords = ['z[eé]ro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const digitPattern = `(?:\\d|${digitWords.join('|')})`;

  // Détecte une séquence d'au moins 8 à 14 chiffres (avec séparateurs optionnels)
  const advancedPhoneRegex = new RegExp(
    `(?:\\+?${digitPattern}[\\s\\W_a-zA-Z]{0,4}){7,14}${digitPattern}`,
    'gi'
  );

  censored = censored.replace(advancedPhoneRegex, (match) => {
    // Exception : Séries de montants / prix (ex: "15000 et 20000" ou "5000, 10000")
    const startsWithPhonePrefix = /^(?:\+|225|0|z[eé]ro)/i.test(match.trim());
    const digitsOnly = match.replace(/\D/g, '');

    // Si ce n'est pas un préfixe téléphonique et que ça ressemble à 1 ou 2 montants
    if (!startsWithPhonePrefix && digitsOnly.length < 8) {
      return match;
    }

    const largeNumberBlocks = match.match(/\d{4,}/g);
    if (!startsWithPhonePrefix && largeNumberBlocks && largeNumberBlocks.length >= 2) {
      return match;
    }

    return CENSOR_MESSAGE;
  });

  // 2. Remplacer les mentions aux réseaux sociaux et expressions directes
  censored = censored.replace(SOCIAL_REGEX, CENSOR_MESSAGE);

  // Nettoyer les répétitions successives de messages de censure
  censored = censored.replace(/(?:\[Coordonnées masquées par sécurité\](?:\s*))+/g, `${CENSOR_MESSAGE} `).trim();

  // Restaurer les tokens préservés (UUIDs)
  for (const { placeholder, value } of preservedTokens) {
    censored = censored.replace(placeholder, value);
  }

  return censored;
}

/**
 * Vérifie si un message contient des coordonnées de contact prohibées
 */
export function containsSensitiveContactInfo(text: string): boolean {
  if (!text) return false;
  return censorMessageContent(text).includes(CENSOR_MESSAGE);
}

export function containsSpamOrProhibitedContent(text: string): boolean {
  if (!text) return false;
  return BANNED_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}
