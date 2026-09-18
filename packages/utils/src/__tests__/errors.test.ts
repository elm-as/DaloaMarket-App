import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUserErrorMessage, formatUserErrorMessage } from '../errors';

describe('Error translation and sanitization', () => {
  it('translates invalid credentials', () => {
    const res = sanitizeUserErrorMessage('Invalid login credentials');
    assert.equal(res, 'Identifiants incorrects (numéro/email ou mot de passe invalide).');
  });

  it('translates network errors', () => {
    const res = sanitizeUserErrorMessage('Network request failed');
    assert.equal(res, 'Connexion Internet instable ou interrompue. Vérifiez votre connexion et réessayez.');
  });

  it('translates missing table / schema cache errors', () => {
    const res = sanitizeUserErrorMessage("Could not find the table 'public.payout_settings' in the schema cache");
    assert.equal(res, 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.');
  });

  it('translates SQL check constraint errors', () => {
    const res = sanitizeUserErrorMessage('new row for relation violates check constraint');
    assert.equal(res, 'Certaines informations saisies ne respectent pas le format attendu.');
  });

  it('translates duplicate key errors', () => {
    const res = sanitizeUserErrorMessage('duplicate key value violates unique constraint "users_phone_key"');
    assert.equal(res, 'Cette information est déjà associée à un autre enregistrement.');
  });

  it('translates JWT expiration', () => {
    const res = sanitizeUserErrorMessage('JWT expired');
    assert.equal(res, 'Votre session a expiré. Veuillez vous reconnecter.');
  });

  it('preserves clean user-facing French messages', () => {
    const frenchMsg = 'Le nom du titulaire est obligatoire.';
    const res = sanitizeUserErrorMessage(frenchMsg, 'Erreur de repli');
    assert.equal(res, frenchMsg);
  });

  it('formats Error instances correctly', () => {
    const err = new Error('invalid_credentials');
    const res = formatUserErrorMessage(err);
    assert.equal(res, 'Identifiants incorrects (numéro/email ou mot de passe invalide).');
  });

  it('handles null/undefined with fallback', () => {
    const res = formatUserErrorMessage(null, 'Erreur par défaut');
    assert.equal(res, 'Erreur par défaut');
  });
});
