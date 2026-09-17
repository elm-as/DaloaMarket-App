import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Clock, AlertTriangle, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react-native';
import { paymentService } from '@daloa/api';
import { Haptics } from '@daloa/utils';
import { colors, spacing, radii, AppText, Button, useAccent } from '@daloa/ui';
import { useCart } from '../../src/context/CartContext';

type PaymentScreenStatus = 'verifying' | 'success' | 'pending_operator' | 'error';

/**
 * Écran officiel de retour de paiement Mobile Money.
 * Remplace l'ancien enchaînement chaotique (Panier vide -> 404 -> Redirection)
 * par une expérience de transition fluide et professionnelle.
 */
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { clearCart } = useCart();
  const params = useLocalSearchParams<{
    transactionId?: string;
    txid?: string;
    token?: string;
    orderId?: string;
    order_id?: string;
    fromCart?: string;
    type?: string;
  }>();

  const effectiveTxId = params.transactionId || params.txid || params.token || '';
  const initialOrderId = params.orderId || params.order_id || null;
  const isFromCart = params.fromCart === '1' || !params.type || params.type === 'order';

  const [status, setStatus] = useState<PaymentScreenStatus>('verifying');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(initialOrderId);
  const [statusMessage, setStatusMessage] = useState('Confirmation de la transaction avec l’opérateur Mobile Money...');
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePaymentSuccess = (orderId: string | null) => {
    Haptics.success();
    if (isFromCart) {
      clearCart();
    }
    setStatus('success');
    setStatusMessage('Paiement validé avec succès ! Préparation de votre commande...');

    setTimeout(() => {
      if (!isMountedRef.current) return;
      if (orderId) {
        router.replace(`/order/${orderId}` as any);
      } else {
        router.replace('/(tabs)/orders' as any);
      }
    }, 1200);
  };

  const verifyTransaction = async () => {
    if (initialOrderId) {
      handlePaymentSuccess(initialOrderId);
      return;
    }

    if (!effectiveTxId) {
      setStatus('pending_operator');
      setStatusMessage('Paiement enregistré. Vous pouvez consulter l’état de vos commandes.');
      return;
    }

    setStatus('verifying');
    setStatusMessage('Confirmation de la transaction avec l’opérateur Mobile Money...');

    // Polling jusqu'à 8 tentatives (≈ 14 secondes max)
    const MAX_POLLS = 8;
    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
      if (!isMountedRef.current) return;

      try {
        const check = await paymentService.checkPaymentByTransaction(effectiveTxId);
        if (check.orderId || check.isPaid) {
          setConfirmedOrderId(check.orderId);
          handlePaymentSuccess(check.orderId);
          return;
        }
      } catch {
        // En cas d'erreur ponctuelle réseau, on poursuit les tentatives de polling
      }

      await new Promise((resolve) => setTimeout(resolve, 1800));
    }

    if (!isMountedRef.current) return;
    // Si l'opérateur n'a pas encore répondu (webhook asynchrone)
    setStatus('pending_operator');
    setStatusMessage(
      'Votre paiement est en cours de traitement par l’opérateur. Dès réception de la confirmation, votre commande sera disponible dans votre suivi.'
    );
  };

  useEffect(() => {
    verifyTransaction();
  }, [effectiveTxId, retryCount]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[4] }]}>
      <View style={styles.card}>
        {status === 'verifying' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: accent[50] }]}>
              <ActivityIndicator size="large" color={accent.DEFAULT} />
            </View>
            <AppText variant="title" style={styles.title}>
              Validation de votre paiement
            </AppText>
            <AppText variant="body" color={colors.text.subtle} style={styles.description}>
              {statusMessage}
            </AppText>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 size={48} color={colors.status.successDark} />
            </View>
            <AppText variant="title" style={styles.title}>
              Paiement confirmé !
            </AppText>
            <AppText variant="body" color={colors.text.subtle} style={styles.description}>
              {statusMessage}
            </AppText>
          </>
        )}

        {status === 'pending_operator' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Clock size={48} color="#D97706" />
            </View>
            <AppText variant="title" style={styles.title}>
              Traitement en cours
            </AppText>
            <AppText variant="body" color={colors.text.subtle} style={styles.description}>
              {statusMessage}
            </AppText>
            <View style={styles.buttonStack}>
              <Button
                title="Voir mes commandes"
                variant="primary"
                onPress={() => router.replace('/(tabs)/orders' as any)}
                leftIcon={<ShoppingBag size={18} color="#FFFFFF" />}
              />
              <Button
                title="Réessayer la vérification"
                variant="outline"
                onPress={() => setRetryCount((c) => c + 1)}
                leftIcon={<RefreshCw size={16} color={colors.text.DEFAULT} />}
              />
            </View>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <AlertTriangle size={48} color={colors.status.error} />
            </View>
            <AppText variant="title" style={styles.title}>
              Vérification incomplète
            </AppText>
            <AppText variant="body" color={colors.text.subtle} style={styles.description}>
              {statusMessage}
            </AppText>
            <View style={styles.buttonStack}>
              <Button
                title="Consulter mes commandes"
                variant="primary"
                onPress={() => router.replace('/(tabs)/orders' as any)}
              />
              <Button
                title="Réessayer"
                variant="outline"
                onPress={() => setRetryCount((c) => c + 1)}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  buttonStack: {
    width: '100%',
    gap: spacing[3],
    marginTop: spacing[3],
  },
});
