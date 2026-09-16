import React, { useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Eye, Phone, MessageCircle } from 'lucide-react-native';
import { colors, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';

export interface RevealablePhoneProps {
  phone?: string | null;
  /** Rendu compact pour une carte de liste ; par défaut, bloc complet avec actions. */
  compact?: boolean;
  /** Message pré-rempli sur WhatsApp, une fois le numéro dévoilé. */
  whatsappMessage?: string;
}

/**
 * Masque le numéro d'un livreur jusqu'à un geste explicite.
 *
 * L'annuaire est public — c'est un choix assumé, un livreur y est pour être
 * joignable. Mais un numéro affiché en clair se moissonne en masse, et les
 * livreurs se retrouvent démarchés par des gens qui n'ont jamais eu l'intention
 * de commander.
 *
 * À savoir, et c'est important : le dévoilement freine la collecte automatique,
 * ce n'est pas un contrôle d'accès. Le numéro est déjà dans la réponse de l'API ;
 * pour qu'il ne parte plus du tout, il faudrait cesser de le renvoyer avec la
 * liste et le servir à la demande.
 */
export const RevealablePhone: React.FC<RevealablePhoneProps> = ({
  phone,
  compact = false,
  whatsappMessage,
}) => {
  const [revealed, setRevealed] = useState(false);

  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;

  // On laisse voir les deux derniers chiffres : de quoi reconnaître un numéro
  // qu'on connaît déjà, pas assez pour le reconstituer.
  const masked = `${digits.slice(0, 2)} •• •• •• ${digits.slice(-2)}`;
  const whatsappNumber = digits.startsWith('225') ? digits : `225${digits}`;

  const openCall = () => {
    Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

  const openWhatsApp = () => {
    const suffix = whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : '';
    Linking.openURL(`https://wa.me/${whatsappNumber}${suffix}`).catch(() => undefined);
  };

  // En liste, la place est comptée : la pastille dit « Voir », et c'est la fiche
  // du livreur qui montre le numéro masqué en entier. Y coller « 07 •• •• •• 59 »
  // écrasait la colonne du nom pour un aperçu que personne ne lit.
  if (compact) {
    return revealed ? (
      <AppPressable
        onPress={openCall}
        accessibilityLabel={`Appeler le ${phone}`}
        style={[styles.pill, styles.pillRevealed]}
      >
        <Phone size={13} color={colors.status.successDark} />
        <AppText
          variant="caption"
          color={colors.status.successDark}
          numberOfLines={1}
          style={styles.pillNumber}
        >
          {phone}
        </AppText>
      </AppPressable>
    ) : (
      <AppPressable
        onPress={() => setRevealed(true)}
        accessibilityLabel="Afficher le numéro du livreur"
        style={[styles.pill, styles.pillHidden]}
      >
        <Eye size={13} color={colors.text.muted} />
        <AppText variant="caption" color={colors.text.muted}>
          Voir
        </AppText>
      </AppPressable>
    );
  }

  if (!revealed) {
    return (
      <AppPressable
        onPress={() => setRevealed(true)}
        accessibilityLabel="Afficher le numéro du livreur"
        style={styles.blockHidden}
      >
        <Eye size={16} color={colors.text.muted} />
        <AppText variant="label" color={colors.text.muted} style={styles.blockMasked}>
          Voir le numéro · {masked}
        </AppText>
      </AppPressable>
    );
  }

  return (
    <View style={styles.actions}>
      <AppPressable
        onPress={openWhatsApp}
        accessibilityLabel="Discuter sur WhatsApp"
        style={[styles.actionBtn, styles.whatsappBtn]}
      >
        <MessageCircle size={16} color={colors.text.inverse} />
        <AppText variant="label" color={colors.text.inverse}>
          Discuter sur WhatsApp
        </AppText>
      </AppPressable>
      <AppPressable
        onPress={openCall}
        accessibilityLabel={`Appeler le ${phone}`}
        style={[styles.actionBtn, styles.callBtn]}
      >
        <Phone size={16} color={colors.text.inverse} />
        <AppText variant="label" color={colors.text.inverse}>
          Appeler {phone}
        </AppText>
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    // Sans cela, le contenu se colle à gauche dès que la pastille s'élargit :
    // c'est ce qui donnait ce bouton de travers dans la liste.
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    height: 34,
    minWidth: 68,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillHidden: {
    backgroundColor: colors.bg.subtle,
    borderColor: colors.border.DEFAULT,
  },
  pillRevealed: {
    backgroundColor: colors.status.successLight,
    borderColor: colors.status.successBorder,
  },
  pillNumber: {
    // Les chiffres gardent la même chasse : la pastille ne tressaute pas.
    fontVariant: ['tabular-nums'],
    maxWidth: 108,
  },
  blockHidden: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    height: 48,
    overflow: 'hidden',
  },
  blockMasked: {
    fontVariant: ['tabular-nums'],
  },
  actions: {
    gap: spacing[2],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radii.xl,
    height: 48,
    overflow: 'hidden',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  callBtn: {
    backgroundColor: colors.text.DEFAULT,
  },
});

export default RevealablePhone;
