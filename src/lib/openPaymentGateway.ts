import { Platform, Linking as RNLinking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

/**
 * Ouvre la page de paiement MoneyFusion.
 *
 * Sur le web, redirection directe (une fenêtre surgissante serait bloquée).
 * Sur mobile, session d'authentification avec retour automatique vers
 * `payment/success`, puis replis successifs si le navigateur intégré échoue.
 */
export async function openPaymentGateway(paymentUrl: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.location.href = paymentUrl;
    return;
  }
  const redirectUrl = Linking.createURL('payment/success');
  try {
    await WebBrowser.openAuthSessionAsync(paymentUrl, redirectUrl);
  } catch (err) {
    console.warn('[Paiement] openAuthSessionAsync a échoué, repli sur openBrowserAsync:', err);
    try {
      await WebBrowser.openBrowserAsync(paymentUrl);
    } catch {
      await RNLinking.openURL(paymentUrl);
    }
  }
}
