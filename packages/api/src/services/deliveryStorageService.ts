import { supabase } from '../supabase';

/**
 * Service de gestion du stockage sécurisé des documents KYC et preuves de livraison
 */
export const deliveryStorageService = {
  /**
   * Téléverse un document KYC d'un livreur dans le bucket privé 'livreur-cni'
   *
   * @param fileUri URI locale du document capturé
   * @param driverId Identifiant du livreur
   * @param documentType Type de document ('cni_front', 'cni_back', 'selfie')
   * @returns Le chemin d'accès ou l'URL du fichier téléversé
   */
  async uploadKycDocument(
    fileUri: string,
    driverId: string,
    documentType: 'cni_front' | 'cni_back' | 'selfie' | string
  ): Promise<string> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const path = `${driverId}/${documentType}_${timestamp}_${randomSuffix}.jpg`;

    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Impossible de lire le fichier local : ${fileUri}`);
    }
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('livreur-cni')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Échec upload KYC livreur:', error);
      throw new Error(`Erreur lors du téléversement du document KYC: ${error.message}`);
    }

    return data.path;
  },

  /**
   * Téléverse une photo de preuve (ramassage ou remise) vers le bucket privé 'delivery-photos'
   *
   * @param fileUri URI locale de la photo
   * @param assignmentId Identifiant de l'assignation de livraison (optionnel pour partitionner)
   * @returns Le chemin d'accès ou l'identifiant du fichier stocké
   */
  async uploadDeliveryProof(fileUri: string, assignmentId?: string): Promise<string> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const filename = assignmentId
      ? `${assignmentId}/proof_${timestamp}_${randomSuffix}.jpg`
      : `proof_${timestamp}_${randomSuffix}.jpg`;

    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Impossible de lire la photo de preuve locale : ${fileUri}`);
    }
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('delivery-photos')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Échec upload preuve livraison:', error);
      throw new Error(`Échec du téléversement de la preuve de livraison : ${error.message}`);
    }

    return data.path;
  },

  /**
   * Enregistre la soumission d'un dossier KYC dans la base de données
   */
  async submitKycVerification(
    driverId: string,
    payload: {
      cniUrl: string;
      selfieCniUrl: string;
      portraitLiveUrl?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('delivery_persons')
      .update({
        cni_url: payload.cniUrl,
        selfie_cni_url: payload.selfieCniUrl,
        portrait_live_url: payload.portraitLiveUrl || null,
        verification_status: 'pending',
      })
      .eq('id', driverId);

    if (error) {
      console.error('Erreur enregistrement KYC en base:', error);
      throw new Error(`Impossible d'enregistrer votre dossier de vérification : ${error.message}`);
    }
  },
};
