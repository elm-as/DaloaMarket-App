import { listingsService, supabase } from '@daloa/api';
import { PRICING_CONFIG } from '@daloa/config';
import type { DraftVariant } from './StepVariantsSection';
import type { PickedPhoto } from './StepMediaTitle';

export interface EditableMobileListing {
  title: string;
  description: string;
  category: string;
  condition: string;
  price: string;
  originalPrice: string;
  district: string;
  stock: number;
  photos: PickedPhoto[];
  variants: DraftVariant[];
}

/**
 * Charge une annonce existante vérifiée pour le mode édition mobile.
 */
export async function loadEditableListing(
  editId: string,
  userId: string,
  fallbackDistrict: string,
): Promise<EditableMobileListing | null> {
  const { data, error } = await supabase.from('listings').select('*').eq('id', editId).maybeSingle();
  if (error || !data || data.user_id !== userId || data.status === 'deleted') {
    return null;
  }

  const existing = Array.isArray(data.variants) ? (data.variants as any[]) : [];
  return {
    title: data.title || '',
    description: data.description || '',
    category: data.category || 'fashion',
    condition: data.condition || 'like_new',
    price: data.price != null ? String(data.price) : '',
    originalPrice: data.original_price != null ? String(data.original_price) : '',
    district: data.district || fallbackDistrict,
    stock: Math.max(1, data.stock || 1),
    photos: (data.photos || [])
      .filter((u: unknown): u is string => typeof u === 'string' && u.startsWith('http'))
      .map((uri: string) => ({ uri })),
    variants: existing.map((v) => ({
      id: v.id ? String(v.id) : undefined,
      title: String(v.label || ''),
      color: v.color ? String(v.color) : null,
      color_code: v.color_code ? String(v.color_code) : null,
      size: v.size ? String(v.size) : null,
      price: v.price == null || v.price === '' ? null : Number(v.price),
      stock: Math.max(0, Number(v.stock) || 0),
    })),
  };
}

/**
 * Valide le prix de base ainsi que chaque déclinaison avant passage ou publication.
 */
export function validateListingPricing(price: string, variants: DraftVariant[]): string | null {
  const min = PRICING_CONFIG.marketplace.minListingPrice;
  const num = parseFloat(price);
  if (Number.isNaN(num) || num < min) {
    return `Le prix minimum d’une annonce est de ${min} FCFA.`;
  }
  if (variants.some((v) => v.price != null && v.price < min)) {
    return `Chaque option doit être vendue au moins ${min} FCFA.`;
  }
  if (variants.some((v) => (v.stock ?? 0) < 1)) {
    return 'Chaque option doit avoir un stock d’au moins 1.';
  }
  return null;
}

export interface StepValidationInput {
  photosCount: number;
  title: string;
  price: string;
  variants: DraftVariant[];
}

export interface StepValidationError {
  title: string;
  message: string;
}

/**
 * Valide les champs obligatoires d'une étape du wizard mobile avant d'avancer.
 */
export function validateMobileWizardStep(
  step: number,
  input: StepValidationInput,
): StepValidationError | null {
  if (step === 1) {
    if (input.photosCount === 0) {
      return { title: 'Photo requise', message: 'Ajoutez au moins une photo de votre article.' };
    }
    if (!input.title.trim() || input.title.trim().length < 3) {
      return { title: 'Titre requis', message: 'Saisissez un titre d’au moins 3 caractères.' };
    }
  }
  if (step === 2) {
    const invalid = validateListingPricing(input.price, input.variants);
    if (invalid) return { title: 'Prix invalide', message: invalid };
  }
  return null;
}

export interface PublishMobileListingParams {
  editId?: string;
  userId: string;
  photos: PickedPhoto[];
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  condition: string;
  district: string;
  stock: number;
  variants: DraftVariant[];
}

/**
 * Téléverse les photos locales et crée ou met à jour l'annonce côté API.
 */
export async function submitMobileListing(params: PublishMobileListingParams): Promise<{ id: string }> {
  const uploadedPhotos: string[] = [];
  for (const photo of params.photos) {
    const url = photo.uri.startsWith('http')
      ? photo.uri
      : await listingsService.uploadImage(photo, params.userId);
    if (!url.startsWith('http')) {
      throw new Error("Une photo n'a pas pu être téléversée. Vérifiez votre connexion.");
    }
    uploadedPhotos.push(url);
  }

  const totalStock =
    params.variants.length > 0
      ? params.variants.reduce((sum, v) => sum + Math.max(1, v.stock || 1), 0)
      : Math.max(1, params.stock || 1);

  const input = {
    title: params.title.trim(),
    description: params.description.trim(),
    price: parseFloat(params.price),
    original_price: params.originalPrice ? parseFloat(params.originalPrice) : null,
    category: params.category,
    condition: params.condition as any,
    district: params.district,
    stock: totalStock,
    photos: uploadedPhotos,
    variants: params.variants.map((v) => ({
      id: v.id,
      label: v.title,
      color: v.color || null,
      color_code: v.color_code || null,
      size: v.size || null,
      price: v.price || null,
      stock: v.stock || 1,
      active: true,
    })),
  };

  return params.editId
    ? listingsService.updateListing(params.editId, input)
    : listingsService.createListing(params.userId, input);
}
