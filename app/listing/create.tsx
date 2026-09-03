import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { listingsService } from '@daloa/api';
import { colors, spacing, Button, KeyboardScreen } from '@daloa/ui';
import { ArrowRight, Check, CreditCard, MapPin } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';
import { RequirementGuardView } from '../../src/components/common/RequirementGuardView';
import { WizardHero } from '../../src/components/create-wizard/WizardHero';
import { StepMediaTitle } from '../../src/components/create-wizard/StepMediaTitle';
import { StepCategoryPricing } from '../../src/components/create-wizard/StepCategoryPricing';
import { StepLocationDelivery } from '../../src/components/create-wizard/StepLocationDelivery';
import { StepSummaryPreview } from '../../src/components/create-wizard/StepSummaryPreview';

const STEP_TITLES = ['Photos & Titre', 'Catégorie & Prix', 'Quartier & Livraison', 'Aperçu & Publication'];

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

export default function ListingCreateScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('fashion');
  const [selectedCondition, setSelectedCondition] = useState('like_new');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(profile?.district || 'Centre-ville');
  const [stock, setStock] = useState(1);
  const [acceptsDelivery, setAcceptsDelivery] = useState(true);

  if (!isAuthenticated || !user) {
    return (
      <AuthGuardView
        title="Connexion requise"
        description="Vous devez être connecté à votre compte pour publier une annonce sur DaloaMarket."
        fallbackRoute="/(tabs)"
      />
    );
  }

  const hasPayoutInfo = Boolean((profile as any)?.payout_network && (profile as any)?.payout_number);
  const hasShopLocation = Boolean(profile?.district && (profile as any)?.shop_latitude != null);

  if (!hasPayoutInfo) {
    return (
      <RequirementGuardView
        icon={<CreditCard size={32} color={colors.status.warningDark} />}
        title="Coordonnées de retrait requises"
        description="Pour vendre sur DaloaMarket, vous devez d'abord configurer le compte Mobile Money (Wave, Orange, MTN...) sur lequel vous recevrez vos gains de vente."
        actionLabel="Configurer mes coordonnées"
        onAction={() => router.push('/settings/payout' as any)}
      />
    );
  }

  if (!hasShopLocation) {
    return (
      <RequirementGuardView
        icon={<MapPin size={32} color={colors.status.infoDark} />}
        title="Localisation de boutique requise"
        description="Afin que vos acheteurs et les livreurs de Daloa puissent localiser vos articles et calculer la livraison, veuillez positionner votre boutique sur la carte."
        actionLabel="Définir la position de ma boutique"
        onAction={() => router.push('/settings/shop' as any)}
      />
    );
  }

  const handleNext = () => {
    Haptics.selection();
    if (currentStep === 1 && (!title.trim() || title.trim().length < 3)) {
      Alert.alert('Titre requis', 'Veuillez saisir un titre d’au moins 3 caractères.');
      return;
    }
    if (currentStep === 2) {
      const num = parseFloat(price);
      if (isNaN(num) || num <= 0) {
        Alert.alert('Prix invalide', 'Veuillez renseigner un prix valide en FCFA.');
        return;
      }
    }
    setCurrentStep((p) => Math.min(4, p + 1));
  };

  const handlePrev = () => {
    Haptics.selection();
    if (currentStep === 1) safeBack(router, '/(tabs)');
    else setCurrentStep((p) => Math.max(1, p - 1));
  };

  const handlePublish = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour publier une annonce.', [
        { text: 'Se connecter', onPress: () => router.push('/auth/login' as any) },
      ]);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await listingsService.createListing(user.id, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        category: selectedCategory,
        condition: selectedCondition as any,
        district: selectedDistrict,
        stock,
        accepts_delivery: acceptsDelivery,
        photos: photos.length > 0 ? photos : [FALLBACK_PHOTO],
      });

      Haptics.success();
      Alert.alert('Annonce en ligne !', 'Votre article est maintenant visible par tous les acheteurs à Daloa.', [
        { text: 'Voir l’annonce', onPress: () => router.replace(`/listing/${created.id}` as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Échec de la publication de votre annonce');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <WizardHero
          currentStep={currentStep}
          totalSteps={4}
          stepTitles={STEP_TITLES}
          onBack={handlePrev}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {currentStep === 1 && (
            <StepMediaTitle
              photos={photos}
              setPhotos={setPhotos}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
            />
          )}
          {currentStep === 2 && (
            <StepCategoryPricing
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedCondition={selectedCondition}
              setSelectedCondition={setSelectedCondition}
              price={price}
              setPrice={setPrice}
              originalPrice={originalPrice}
              setOriginalPrice={setOriginalPrice}
            />
          )}
          {currentStep === 3 && (
            <StepLocationDelivery
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              stock={stock}
              setStock={setStock}
              acceptsDelivery={acceptsDelivery}
              setAcceptsDelivery={setAcceptsDelivery}
            />
          )}
          {currentStep === 4 && (
            <StepSummaryPreview
              photos={photos}
              title={title}
              price={price}
              originalPrice={originalPrice}
              district={selectedDistrict}
              stock={stock}
              acceptsDelivery={acceptsDelivery}
            />
          )}
        </ScrollView>

        {/* Barre de navigation */}
        <View style={styles.bottomBar}>
          {currentStep < 4 ? (
            <Button
              title="Continuer"
              variant="market"
              onPress={handleNext}
              style={styles.flex1}
              rightIcon={<ArrowRight size={16} color={colors.text.inverse} strokeWidth={2.5} />}
            />
          ) : (
            <Button
              title="Publier à Daloa"
              variant="success"
              onPress={handlePublish}
              loading={isSubmitting}
              style={styles.flex1}
              leftIcon={<Check size={18} color={colors.text.inverse} strokeWidth={2.8} />}
            />
          )}
        </View>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.surface,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
    gap: spacing[3],
  },
  flex1: {
    flex: 1,
  },
});
