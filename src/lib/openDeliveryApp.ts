import { Linking } from 'react-native';

/**
 * Ouvre une page de l'app DaloaDelivery si elle est installée, sinon le site.
 *
 * On tente directement l'ouverture au lieu de demander `canOpenURL` : depuis
 * Android 11, sans déclaration <queries> dans le manifeste, `canOpenURL`
 * répond toujours « non » et l'utilisateur partait sur le site alors qu'il a
 * l'app. `openURL` échoue proprement quand aucune app ne gère le lien.
 *
 * `path` suit les adresses de l'app, sans les groupes de dossiers : `annuaire`
 * et non `(tabs)/annuaire`.
 */
export async function openDeliveryApp(path: string): Promise<void> {
  const clean = path.replace(/^\/+/, '');
  try {
    await Linking.openURL(`daloadelivery://${clean}`);
  } catch {
    await Linking.openURL(`https://delivery.daloamarket.com/${clean}`).catch(() => {});
  }
}
