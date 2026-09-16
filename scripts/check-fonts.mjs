#!/usr/bin/env node
/**
 * Garde-fou typographique.
 *
 * Sur Android, `fontWeight` ne selectionne pas une variante Inter : la famille
 * par defaut n'a pas les graisses chargees, le moteur retombe sur la police
 * systeme. Et cumuler `fontFamily` + `fontWeight` est pire encore — Android
 * choisit alors une graisse au hasard dans la famille.
 *
 * La regle du projet (voir packages/ui/src/components/AppText.tsx) est donc :
 * la famille Inter ponderee, seule. Ce script echoue si un `fontWeight`
 * reapparait, ou si une famille de police est ecrite en dur.
 *
 * Lance par `npm run typecheck`. Pour verifier seul : `node scripts/check-fonts.mjs`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
// packages/ est partage a la racine du monorepo depuis la deduplication :
// un chemin relatif a l'app ne pointerait plus sur rien, et le garde-fou
// ne verifierait plus la bibliotheque d'interface — en silence.
const MONOREPO_ROOT = join(APP_ROOT, '..', '..');
const SCANNED = [
  join(APP_ROOT, 'app'),
  join(APP_ROOT, 'src'),
  join(MONOREPO_ROOT, 'packages', 'ui', 'src'),
];
const EXTENSIONS = ['.ts', '.tsx'];

/** `fontWeight:` suivi de n'importe quelle valeur — chaine, jeton ou crochets. */
const FONT_WEIGHT = /fontWeight\s*:/g;
/** Famille ecrite en dur : seuls les jetons typography.families sont admis. */
const HARDCODED_FAMILY = /fontFamily\s*:\s*['"`]/g;

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const problems = [];

for (const base of SCANNED) {
  for (const file of walk(base)) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(APP_ROOT, file);

    for (const [pattern, message] of [
      [FONT_WEIGHT, 'fontWeight interdit — utiliser typography.families.<graisse>'],
      [HARDCODED_FAMILY, 'famille en dur — utiliser typography.families.<graisse>'],
    ]) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        problems.push(`${rel}:${lineOf(text, match.index)}  ${message}`);
      }
    }
  }
}


/**
 * Second garde-fou : `Alert.alert`.
 *
 * Sur react-native-web, `Alert.alert` est une fonction vide — le message ne
 * s'affiche jamais, sans la moindre erreur. On passe donc par `showAlert` de
 * @daloa/ui, qui delegue a Alert.alert en natif et rend une vraie modale sur le
 * web. Ce controle echoue si un appel direct reapparait.
 */
const ALERT_DIRECT = /\bAlert\.alert\s*\(/g;

/** Seul fichier autorise a appeler Alert.alert : showAlert lui-meme, qui delegue. */
const DELEGUE_NATIF = 'packages/ui/src/components/alert.tsx';

for (const base of SCANNED) {
  for (const file of walk(base)) {
    if (file.split(sep).join('/').endsWith(DELEGUE_NATIF)) continue;
    const text = readFileSync(file, 'utf8');
    const rel = relative(APP_ROOT, file);
    ALERT_DIRECT.lastIndex = 0;
    let match;
    while ((match = ALERT_DIRECT.exec(text)) !== null) {
      problems.push(`${rel}:${lineOf(text, match.index)}  Alert.alert interdit — utiliser showAlert de @daloa/ui`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\nGarde-fous : ${problems.length} probleme(s).\n`);
  for (const p of problems) console.error('  ' + p);
  console.error(
    '\nDeux regles :' +
      '\n\n1. La police est Inter, chargee en six variantes dans app/_layout.tsx.' +
      '\n   On choisit la graisse par la famille, jamais par fontWeight :' +
      '\n   400 normal · 500 medium · 600 semibold · 700 bold · 800 extrabold · 900 black' +
      '\n   Exemple :  fontFamily: typography.families.extrabold' +
      '\n\n2. Alert.alert est une fonction vide sur react-native-web : le message' +
      '\n   ne s\'affiche jamais, sans la moindre erreur. Utiliser showAlert de' +
      '\n   @daloa/ui — meme signature, delegue au natif, modale sur le web.\n'
  );
  process.exit(1);
}

console.log('Garde-fous : OK — police Inter respectee, aucun Alert.alert direct.');
