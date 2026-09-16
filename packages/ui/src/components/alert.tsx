import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, Alert, Platform } from 'react-native';
import { colors, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';

/**
 * Remplaçant de `Alert.alert`, utilisable partout.
 *
 * Le problème : sur `react-native-web`, `Alert.alert` est une fonction vide.
 * Les 92 messages de l'application — erreur de paiement, confirmation de
 * suppression, échec d'envoi — étaient donc **muets** dès qu'une app tournait
 * dans un navigateur. L'utilisateur clique, rien ne se passe, il recommence.
 *
 * Le parti pris ici : sur natif on délègue à `Alert.alert` tel quel, donc aucun
 * changement de comportement ni de rendu sur iOS et Android ; sur le web on
 * affiche une vraie modale. Le web passe de « rien » à « quelque chose », le
 * natif ne bouge pas d'un pixel.
 *
 * Pour que la version web fonctionne, `<AlertHost />` doit être monté une fois
 * à la racine de l'application — sans lui, un appel web reste silencieux.
 */

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

interface AlertDemande {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Abonne = (demande: AlertDemande) => void;

let prochainId = 1;
const abonnes = new Set<Abonne>();

/** File d'attente : les appels émis avant le montage de l'hôte ne sont pas perdus. */
const enAttente: AlertDemande[] = [];

function emettre(demande: AlertDemande): void {
  if (abonnes.size === 0) {
    enAttente.push(demande);
    return;
  }
  abonnes.forEach((f) => f(demande));
}

const BOUTON_OK: AlertButton[] = [{ text: 'OK', style: 'default' }];

/**
 * Affiche un message bloquant. Signature identique à `Alert.alert`.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    // `Alert.alert` n'accepte pas `undefined` comme tableau de boutons sur
    // toutes les versions : on ne le passe que s'il existe vraiment.
    if (buttons && buttons.length > 0) {
      Alert.alert(title, message, buttons as any);
    } else {
      Alert.alert(title, message);
    }
    return;
  }

  emettre({
    id: prochainId++,
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : BOUTON_OK,
  });
}

/**
 * Hôte des messages web. À monter une fois, à la racine de l'application.
 * Ne rend rien en natif.
 */
export const AlertHost: React.FC = () => {
  const [demande, setDemande] = useState<AlertDemande | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const recevoir: Abonne = (d) => setDemande(d);
    abonnes.add(recevoir);

    // Rattrapage de ce qui a été demandé avant le montage.
    while (enAttente.length > 0) {
      const d = enAttente.shift();
      if (d) recevoir(d);
    }

    return () => {
      abonnes.delete(recevoir);
    };
  }, []);

  if (Platform.OS !== 'web' || !demande) return null;

  const repondre = (bouton: AlertButton) => {
    setDemande(null);
    // Après la fermeture, comme le fait la boîte système : le code appelant
    // s'attend à ce que la modale ne soit plus là quand son callback s'exécute.
    bouton.onPress?.();
  };

  const annuler = demande.buttons.find((b) => b.style === 'cancel');

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // Sur le web, la touche Échap et le bouton retour passent par là.
      onRequestClose={() => repondre(annuler ?? demande.buttons[demande.buttons.length - 1])}
    >
      <View style={styles.voile}>
        <View style={styles.boite}>
          <AppText variant="bodyStrong" style={styles.titre}>
            {demande.title}
          </AppText>
          {demande.message ? (
            <AppText variant="body" color={colors.text.muted} style={styles.message}>
              {demande.message}
            </AppText>
          ) : null}

          <View style={[styles.actions, demande.buttons.length > 2 && styles.actionsColonne]}>
            {demande.buttons.map((b, i) => (
              <AppPressable
                key={`${demande.id}-${i}`}
                onPress={() => repondre(b)}
                accessibilityLabel={b.text || 'OK'}
                style={[
                  styles.bouton,
                  b.style === 'destructive' && styles.boutonDanger,
                  b.style === 'cancel' && styles.boutonNeutre,
                ]}
              >
                <AppText
                  variant="label"
                  color={
                    b.style === 'destructive'
                      ? colors.text.inverse
                      : b.style === 'cancel'
                        ? colors.text.body
                        : colors.text.inverse
                  }
                >
                  {b.text || 'OK'}
                </AppText>
              </AppPressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  boite: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    padding: spacing[5],
    gap: spacing[2],
  },
  titre: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionsColonne: {
    flexDirection: 'column',
  },
  bouton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radii.xl,
    backgroundColor: colors.primary.DEFAULT,
    overflow: 'hidden',
  },
  boutonDanger: {
    backgroundColor: colors.status.error,
  },
  boutonNeutre: {
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
});

export default showAlert;
