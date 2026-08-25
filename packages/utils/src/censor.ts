/**
 * Modération de texte et filtre anti-spam
 */
const BANNED_PATTERNS = [
  /arnaque/i,
  /viagra/i,
  /argent gratuit/i,
  /gain facile/i,
  /brouteur/i,
];

export function containsSpamOrProhibitedContent(text: string): boolean {
  if (!text) return false;
  return BANNED_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}
