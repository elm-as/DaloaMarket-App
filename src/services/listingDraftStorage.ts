import { SecureStorageAdapter } from '@daloa/utils';
import type { DraftVariant } from '../components/create-wizard/StepVariantsSection';
import type { PickedPhoto } from '../components/create-wizard/StepMediaTitle';

const DRAFT_STORAGE_KEY = 'daloamarket_mobile_listing_draft_v2';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface MobileListingDraft {
  currentStep: number;
  title: string;
  description: string;
  selectedCategory: string;
  selectedCondition: string;
  price: string;
  originalPrice: string;
  selectedDistrict: string;
  stock: number;
  variants: DraftVariant[];
  savedAt: number;
}

// Cache mémoire complémentaire : conserve les photos (`base64`) si l'utilisateur
// quitte momentanément l'écran sans fermer l'application.
let memorySessionPhotos: PickedPhoto[] = [];
let memoryDraftFallback: MobileListingDraft | null = null;

/**
 * Enregistre localement l'état du wizard d'annonce pour reprendre en cas d'abandon.
 */
export async function saveListingDraft(
  draft: Omit<MobileListingDraft, 'savedAt'>,
  photos: PickedPhoto[],
): Promise<void> {
  const hasContent =
    Boolean(draft.title.trim()) ||
    Boolean(draft.description.trim()) ||
    Boolean(draft.price.trim()) ||
    draft.variants.length > 0 ||
    photos.length > 0;

  if (!hasContent) return;

  memorySessionPhotos = photos;
  const payload: MobileListingDraft = { ...draft, savedAt: Date.now() };
  memoryDraftFallback = payload;

  try {
    const serialized = JSON.stringify(payload);
    // SecureStore limite les entrées à ~2 Ko sur iOS/Android ; si plus long,
    // on tronque uniquement la description pour ne pas perdre le reste du brouillon.
    if (serialized.length > 1900) {
      const compact = { ...payload, description: payload.description.slice(0, 280) };
      await SecureStorageAdapter.setItem(DRAFT_STORAGE_KEY, JSON.stringify(compact));
      return;
    }
    await SecureStorageAdapter.setItem(DRAFT_STORAGE_KEY, serialized);
  } catch {
    // Repli déjà conservé en mémoire pour la session active
  }
}

/**
 * Charge un brouillon local valide (< 7 jours) s'il en existe un.
 */
export async function loadListingDraft(): Promise<{
  draft: MobileListingDraft | null;
  photos: PickedPhoto[];
}> {
  if (memoryDraftFallback && Date.now() - memoryDraftFallback.savedAt <= DRAFT_TTL_MS) {
    return { draft: memoryDraftFallback, photos: memorySessionPhotos };
  }

  try {
    const raw = await SecureStorageAdapter.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return { draft: null, photos: [] };
    const parsed = JSON.parse(raw) as MobileListingDraft;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      await clearListingDraft();
      return { draft: null, photos: [] };
    }
    return { draft: parsed, photos: memorySessionPhotos };
  } catch {
    return { draft: null, photos: [] };
  }
}

/**
 * Supprime le brouillon sauvegardé (après publication ou remise à zéro manuelle).
 */
export async function clearListingDraft(): Promise<void> {
  memorySessionPhotos = [];
  memoryDraftFallback = null;
  try {
    await SecureStorageAdapter.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignorer erreur de suppression
  }
}
