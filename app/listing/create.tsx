import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { usePhase } from '../../src/context/PhaseContext';
import { colors, spacing, Button, KeyboardScreen, showAlert } from '@daloa/ui';
import { ArrowRight, Check } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';
import { renderListingCreateGuard } from '../../src/components/create-wizard/ListingCreateGuards';
import { ListingCreateDialogs } from '../../src/components/create-wizard/ListingCreateDialogs';
import { ListingWizardHeader } from '../../src/components/create-wizard/ListingWizardHeader';
import { StepMediaTitle, type PickedPhoto } from '../../src/components/create-wizard/StepMediaTitle';
import { StepCategoryPricing } from '../../src/components/create-wizard/StepCategoryPricing';
import type { DraftVariant } from '../../src/components/create-wizard/StepVariantsSection';
import { StepLocationDelivery } from '../../src/components/create-wizard/StepLocationDelivery';
import {
  loadEditableListing,
  submitMobileListing,
  validateMobileWizardStep,
} from '../../src/components/create-wizard/listingCreateSubmit';
import { clearListingDraft, loadListingDraft, saveListingDraft } from '../../src/services/listingDraftStorage';

export default function ListingCreateScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuth();
  const { sellerFeeOverride } = usePhase();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(editId);

  const [isLoadingListing, setIsLoadingListing] = useState(isEditing);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('fashion');
  const [selectedCondition, setSelectedCondition] = useState('like_new');
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(profile?.district || 'Centre-ville');
  const [stock, setStock] = useState(1);

  const [isDraftReady, setIsDraftReady] = useState(isEditing);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { draft, photos: cachedPhotos } = await loadListingDraft();
      if (cancelled) return;
      if (draft) {
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setSelectedCategory(draft.selectedCategory || 'fashion');
        setSelectedCondition(draft.selectedCondition || 'like_new');
        setPrice(draft.price || '');
        setOriginalPrice(draft.originalPrice || '');
        setSelectedDistrict(draft.selectedDistrict || profile?.district || 'Centre-ville');
        setStock(Math.max(1, draft.stock || 1));
        setVariants(Array.isArray(draft.variants) ? draft.variants : []);
        setCurrentStep(Math.min(3, Math.max(1, draft.currentStep || 1)));
        if (cachedPhotos.length > 0) setPhotos(cachedPhotos);
        setIsDraftRestored(true);
      }
      setIsDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, user?.id, profile?.district]);

  useEffect(() => {
    if (isEditing || !isDraftReady || !user?.id) return;
    const timer = setTimeout(() => {
      saveListingDraft(
        {
          currentStep,
          title,
          description,
          selectedCategory,
          selectedCondition,
          price,
          originalPrice,
          selectedDistrict,
          stock,
          variants,
        },
        photos,
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [
    isEditing, isDraftReady, user?.id, currentStep, title, description,
    selectedCategory, selectedCondition, price, originalPrice, selectedDistrict,
    stock, variants, photos,
  ]);

  useEffect(() => {
    if (!editId || !user?.id) return;
    let cancelled = false;
    loadEditableListing(editId, user.id, profile?.district || 'Centre-ville').then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setIsLoadingListing(false);
        showAlert('Annonce introuvable', 'Cette annonce n’existe plus ou ne vous appartient pas.');
        safeBack(router, '/seller/my-listings');
        return;
      }
      setTitle(loaded.title);
      setDescription(loaded.description);
      setSelectedCategory(loaded.category);
      setSelectedCondition(loaded.condition);
      setPrice(loaded.price);
      setOriginalPrice(loaded.originalPrice);
      setSelectedDistrict(loaded.district);
      setStock(loaded.stock);
      setPhotos(loaded.photos);
      setVariants(loaded.variants);
      setIsLoadingListing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [editId, user?.id]);

  const guardScreen = renderListingCreateGuard({
    isAuthenticated,
    hasUser: Boolean(user),
    profile: profile as Record<string, any> | null,
    onNavigatePayout: () => router.push('/settings/payout' as any),
    onNavigateShop: () => router.push('/settings/shop' as any),
  });
  if (guardScreen) return guardScreen;

  const handleResetDraft = async () => {
    await clearListingDraft();
    setPhotos([]);
    setTitle('');
    setDescription('');
    setSelectedCategory('fashion');
    setSelectedCondition('like_new');
    setVariants([]);
    setPrice('');
    setOriginalPrice('');
    setSelectedDistrict(profile?.district || 'Centre-ville');
    setStock(1);
    setCurrentStep(1);
    setIsDraftRestored(false);
  };

  const validateStepOrAlert = (step: number): boolean => {
    const err = validateMobileWizardStep(step, { photosCount: photos.length, title, price, variants });
    if (!err) return true;
    showAlert(err.title, err.message);
    return false;
  };

  const handleNext = () => {
    Haptics.selection();
    if (!validateStepOrAlert(currentStep)) return;
    setCurrentStep((p) => Math.min(3, p + 1));
  };

  const handleSelectStep = (targetStep: number) => {
    if (targetStep === currentStep) return;
    Haptics.selection();
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    for (let s = currentStep; s < targetStep; s += 1) {
      if (validateStepOrAlert(s)) continue;
      if (s !== currentStep) setCurrentStep(s);
      return;
    }
    setCurrentStep(targetStep);
  };

  const handlePublish = async () => {
    if (!user) return;
    if (!validateStepOrAlert(2)) {
      setCurrentStep(2);
      return;
    }
    if (!validateStepOrAlert(1)) {
      setCurrentStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      const saved = await submitMobileListing({
        editId,
        userId: user.id,
        photos,
        title,
        description,
        price,
        originalPrice,
        category: selectedCategory,
        condition: selectedCondition,
        district: selectedDistrict,
        stock,
        variants,
      });
      await clearListingDraft();
      setIsDraftRestored(false);
      Haptics.success();
      setCreatedListingId(saved.id);
      setShowSuccessDialog(true);
    } catch (err: any) {
      let msg = err?.message || (isEditing ? 'Échec de mise à jour.' : 'Échec de publication.');
      if (msg.includes('Failed to fetch') || msg.includes('Network') || msg.includes('timeout')) {
        msg = 'Connexion instable. Vérifiez votre réseau puis réessayez.';
      }
      setErrorDialog(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingListing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <ListingWizardHeader
          currentStep={currentStep}
          isEditing={isEditing}
          isDraftRestored={isDraftRestored}
          onBack={() => (currentStep === 1 ? safeBack(router, '/(tabs)') : setCurrentStep((p) => Math.max(1, p - 1)))}
          onSelectStep={handleSelectStep}
          onResetDraft={handleResetDraft}
        />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
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
              variants={variants}
              onVariantsChange={setVariants}
              isProSeller={Boolean(profile?.isPro)}
              sellerFeeOverride={sellerFeeOverride}
            />
          )}
          {currentStep === 3 && (
            <StepLocationDelivery
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              stock={stock}
              setStock={setStock}
            />
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          {currentStep < 3 ? (
            <Button
              title="Continuer"
              variant="market"
              onPress={handleNext}
              style={styles.flex1}
              rightIcon={<ArrowRight size={16} color={colors.text.inverse} strokeWidth={2.5} />}
            />
          ) : (
            <Button
              title={isEditing ? 'Enregistrer' : 'Publier à Daloa'}
              variant="success"
              onPress={handlePublish}
              loading={isSubmitting}
              style={styles.flex1}
              leftIcon={<Check size={18} color={colors.text.inverse} strokeWidth={2.8} />}
            />
          )}
        </View>

        <ListingCreateDialogs
          isEditing={isEditing}
          showSuccessDialog={showSuccessDialog}
          createdListingId={createdListingId}
          title={title}
          price={price}
          errorDialog={errorDialog}
          onViewListing={() => {
            setShowSuccessDialog(false);
            router.replace((createdListingId ? `/listing/${createdListingId}` : '/(tabs)') as any);
          }}
          onDismissSuccess={() => {
            setShowSuccessDialog(false);
            router.replace((createdListingId ? `/listing/${createdListingId}` : '/(tabs)') as any);
          }}
          onDismissError={() => setErrorDialog(null)}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.surface },
  scrollContent: { paddingBottom: 140 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
    gap: spacing[3],
  },
  flex1: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
});
