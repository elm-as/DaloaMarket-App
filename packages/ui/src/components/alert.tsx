import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, StyleSheet, Animated, Easing } from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from 'lucide-react-native';
import { colors, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';
import { sanitizeUserErrorMessage } from '@daloa/utils';

/**
 * Remplaçant de `Alert.alert`, utilisable partout.
 *
 * Historique : sur `react-native-web`, `Alert.alert` est une fonction vide ; une
 * modale maison couvrait donc le web, et le natif gardait la boîte système
 * d'Android. Celle-ci jurait avec l'application (rectangle gris, boutons en
 * majuscules, aucune couleur) sur des moments importants : paiement,
 * encaissement, livraison validée, suppression.
 *
 * Désormais la même fenêtre s'affiche partout, aux couleurs DaloaMarket :
 * icône selon la nature du message (succès, erreur, confirmation, info),
 * bouton principal orange, bouton rouge pour une action destructive. La
 * signature reste celle d'`Alert.alert` : aucun des appels existants ne change.
 *
 * `<AlertHost />` doit être monté une fois à la racine de l'application.
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
  emettre({
    id: prochainId++,
    title,
    message: message ? sanitizeUserErrorMessage(message) : message,
    buttons: buttons && buttons.length > 0 ? buttons : BOUTON_OK,
  });
}

type Ton = 'success' | 'error' | 'danger' | 'question' | 'info';

/** Nature du message, déduite du titre et des boutons (les appels ne la précisent pas). */
function tonDe(d: AlertDemande): Ton {
  if (d.buttons.some((b) => b.style === 'destructive')) return 'danger';
  const t = `${d.title}`.toLowerCase();
  if (/erreur|échec|echec|impossible|refus|invalide|incorrect|introuvable|indisponible|expir|incomplet/.test(t)) {
    return 'error';
  }
  if (d.buttons.length > 1) return 'question';
  if (/réussi|valid|confirm|enregistr|envoy|succès|merci|bravo|clôtur|livré|encaiss|annulée|publi|🎉|🚀|✅/.test(t)) {
    return 'success';
  }
  return 'info';
}

const TONS: Record<Ton, { Icone: typeof Info; couleur: string; fond: string }> = {
  success: { Icone: CheckCircle2, couleur: colors.status.success, fond: colors.status.successLight },
  error: { Icone: XCircle, couleur: colors.status.error, fond: colors.status.errorLight },
  danger: { Icone: AlertTriangle, couleur: colors.status.error, fond: colors.status.errorLight },
  question: { Icone: HelpCircle, couleur: colors.primary.DEFAULT, fond: colors.primary[50] },
  info: { Icone: Info, couleur: colors.primary.DEFAULT, fond: colors.primary[50] },
};

/**
 * Hôte des messages. À monter une fois, à la racine de l'application.
 */
export const AlertHost: React.FC = () => {
  // File : un message émis pendant qu'un autre est affiché attend son tour.
  const [file, setFile] = useState<AlertDemande[]>([]);
  const apparition = useRef(new Animated.Value(0)).current;
  const demande = file[0] ?? null;

  useEffect(() => {
    const recevoir: Abonne = (d) => setFile((f) => [...f, d]);
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

  useEffect(() => {
    if (!demande) return;
    apparition.setValue(0);
    Animated.timing(apparition, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [demande?.id, apparition]);

  if (!demande) return null;

  const repondre = (bouton: AlertButton) => {
    setFile((f) => f.slice(1));
    // Après la fermeture, comme la boîte système : le code appelant s'attend à
    // ce que la fenêtre ne soit plus là quand son callback s'exécute.
    bouton.onPress?.();
  };

  const annuler = demande.buttons.find((b) => b.style === 'cancel');
  const ton = TONS[tonDe(demande)];
  const Icone = ton.Icone;
  // Annulation à gauche (ou en bas en colonne), action principale à droite.
  const boutons = [...demande.buttons].sort(
    (a, b) => Number(b.style === 'cancel') - Number(a.style === 'cancel')
  );
  const enColonne = boutons.length > 2 || boutons.some((b) => (b.text || '').length > 18);

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      // Bouton retour Android et touche Échap : équivaut à « annuler ».
      onRequestClose={() => repondre(annuler ?? demande.buttons[demande.buttons.length - 1])}
    >
      <View style={styles.voile}>
        <Animated.View
          style={[
            styles.boite,
            {
              opacity: apparition,
              transform: [{ scale: apparition.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
            },
          ]}
        >
          <View style={[styles.pastille, { backgroundColor: ton.fond }]}>
            <Icone size={28} color={ton.couleur} strokeWidth={2.2} />
          </View>

          <AppText variant="title" style={styles.titre}>
            {demande.title}
          </AppText>
          {demande.message ? (
            <AppText variant="body" color={colors.text.muted} style={styles.message}>
              {demande.message}
            </AppText>
          ) : null}

          <View style={[styles.actions, enColonne && styles.actionsColonne]}>
            {boutons.map((b, i) => {
              const neutre = b.style === 'cancel';
              const danger = b.style === 'destructive';
              return (
                <AppPressable
                  key={`${demande.id}-${i}`}
                  onPress={() => repondre(b)}
                  accessibilityLabel={b.text || 'OK'}
                  style={[
                    styles.bouton,
                    !enColonne && styles.boutonLigne,
                    danger && styles.boutonDanger,
                    neutre && styles.boutonNeutre,
                  ]}
                >
                  <AppText variant="label" color={neutre ? colors.text.body : colors.text.inverse}>
                    {b.text || 'OK'}
                  </AppText>
                </AppPressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
  },
  boite: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg.surface,
    borderRadius: 24,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  pastille: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  titre: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionsColonne: {
    flexDirection: 'column-reverse',
  },
  bouton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing[3],
    borderRadius: radii.xl,
    backgroundColor: colors.primary.DEFAULT,
    overflow: 'hidden',
  },
  boutonLigne: {
    flex: 1,
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
