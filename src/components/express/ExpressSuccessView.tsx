import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, KeyRound, MessageSquare, ArrowRight } from 'lucide-react-native';
import { colors, radii, spacing, AppText, Button, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { expressDeliveryService } from '@daloa/api';

export interface ExpressSuccessViewProps {
  orderId: string;
  assignmentId?: string;
  deliveryFee: number;
  pickupOtp: string;
  deliveryOtp: string;
  recipientName: string;
  recipientPhone: string;
  senderName: string;
  packageDescription: string;
  pickupDistrict: string;
  dropoffDistrict: string;
}

export const ExpressSuccessView: React.FC<ExpressSuccessViewProps> = ({
  orderId,
  deliveryFee,
  pickupOtp,
  deliveryOtp,
  recipientName,
  recipientPhone,
  senderName,
  packageDescription,
  pickupDistrict,
  dropoffDistrict,
}) => {
  const accent = useAccent();
  const router = useRouter();

  const handleShareWhatsApp = () => {
    Haptics.lightImpact();
    const url = expressDeliveryService.generateRecipientWhatsAppUrl({
      recipientPhone,
      recipientName,
      deliveryOtp,
      orderId,
      senderName,
      packageDescription,
    });
    Linking.openURL(url).catch(() => {});
  };

  const handleTrackLive = () => {
    Haptics.mediumImpact();
    router.replace(`/order/${orderId}` as any);
  };

  return (
    <View style={styles.container}>
      {/* En-tête succès */}
      <View style={styles.successHeader}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={36} color={colors.status.successDark} />
        </View>
        <AppText variant="h2" style={styles.title}>
          Course Express Confirmée !
        </AppText>
        <AppText variant="body" color={colors.text.muted} style={styles.subtitle}>
          Un coursier DaloaDelivery disponible est alerté pour venir récupérer votre colis.
        </AppText>
      </View>

      {/* Carte OTP Ramassage */}
      <View style={[styles.card, styles.pickupCard]}>
        <View style={styles.cardHeader}>
          <KeyRound size={16} color={colors.status.warningDark} />
          <AppText variant="overline" color={colors.status.warningDark}>
            VOTRE CODE DE RAMASSAGE (À DONNER AU LIVREUR)
          </AppText>
        </View>
        <AppText variant="display" color={colors.status.warningDark} style={styles.otpCode}>
          {pickupOtp}
        </AppText>
        <AppText variant="caption" color={colors.text.muted}>
          Donnez ce code au coursier uniquement lorsqu'il est présent pour prendre le colis à {pickupDistrict}.
        </AppText>
      </View>

      {/* Partage Destinataire */}
      <View style={[styles.card, { borderColor: accent[200], backgroundColor: accent[50] }]}>
        <View style={styles.cardHeader}>
          <MessageSquare size={16} color={accent[700]} />
          <AppText variant="overline" color={accent[700]}>
            CODE DE REMISE DESTINATAIRE : {deliveryOtp}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.text.body} style={styles.descText}>
          {recipientName} doit donner son code au livreur à la réception à {dropoffDistrict}.
        </AppText>
        <Button
          variant="outline"
          size="md"
          title="Envoyer le code au destinataire (WhatsApp)"
          onPress={handleShareWhatsApp}
          leftIcon={<MessageSquare size={16} color={accent.DEFAULT} />}
          style={styles.whatsAppBtn}
        />
      </View>

      {/* Actions de navigation */}
      <View style={styles.actionsBox}>
        <Button
          variant="market"
          size="lg"
          title="Suivre la course en direct"
          onPress={handleTrackLive}
          rightIcon={<ArrowRight size={18} color={colors.text.inverse} />}
        />
        <Button
          variant="ghost"
          size="md"
          title="Retour à l'accueil"
          onPress={() => router.replace('/(tabs)' as any)}
          style={styles.homeBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.status.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  pickupCard: {
    backgroundColor: colors.status.warningLight,
    borderColor: colors.status.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing[1],
  },
  otpCode: {
    letterSpacing: 8,
    marginVertical: spacing[1],
    fontVariant: ['tabular-nums'],
  },
  descText: {
    marginBottom: spacing[3],
  },
  whatsAppBtn: {
    backgroundColor: colors.bg.surface,
  },
  actionsBox: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  homeBtn: {
    marginTop: 4,
  },
});
