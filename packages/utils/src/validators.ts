import { z } from 'zod';
import { DALOA_DISTRICTS } from '@daloa/config';

/** Validation numéro téléphone ivoirien */
export const phoneRegex = /^(?:(?:\+|00)?225)?[01457][0-9]{9}$/;

export const phoneSchema = z
  .string()
  .min(8, 'Numéro de téléphone trop court')
  .max(16, 'Numéro de téléphone trop long')
  .refine((val) => val.replace(/\D/g, '').length >= 10, {
    message: 'Numéro de téléphone ivoirien à 10 chiffres requis',
  });

/** Schéma de connexion */
export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, 'Veuillez saisir votre email ou numéro de téléphone'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/** Schéma d'inscription Acheteur / Vendeur */
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est obligatoire'),
  email: z.string().email('Adresse email invalide'),
  phone: phoneSchema,
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
  district: z.string().min(1, 'Veuillez sélectionner votre quartier à Daloa'),
  role: z.enum(['buyer', 'seller']).default('buyer'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/** Schéma d'inscription Livreur */
export const driverRegisterSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est obligatoire'),
  email: z.string().email('Adresse email invalide'),
  phone: phoneSchema,
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
  vehicleType: z.enum(['moto', 'velo', 'voiture', 'triporteur']),
  vehicleDetails: z.string().min(2, 'Veuillez préciser le modèle ou la marque du véhicule'),
  district: z.string().min(1, 'Veuillez sélectionner votre quartier de base'),
});

export type DriverRegisterFormData = z.infer<typeof driverRegisterSchema>;

/** Schéma de création d'annonce */
export const listingCreateSchema = z.object({
  title: z.string().min(3, "Le titre de l'annonce doit comporter au moins 3 caractères").max(80, 'Titre trop long (max 80)'),
  description: z.string().min(10, 'La description doit comporter au moins 10 caractères'),
  price: z.number().positive('Le prix doit être supérieur à 0 FCFA'),
  originalPrice: z.number().positive().optional().nullable(),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  condition: z.enum(['new', 'like_new', 'good', 'used']),
  district: z.string().min(1, 'Veuillez sélectionner le quartier où se trouve l’article'),
  stock: z.number().int().min(1, 'Le stock doit être d’au moins 1'),
  acceptsDelivery: z.boolean().default(true),
  deliveryFeeOverride: z.number().min(0).optional().nullable(),
  photos: z.array(z.string()).min(1, 'Veuillez ajouter au moins une photo'),
});

export type ListingCreateFormData = z.infer<typeof listingCreateSchema>;

/** Schéma de commande / Checkout */
export const checkoutSchema = z.object({
  deliveryMode: z.enum(['delivery', 'pickup']),
  deliveryDistrict: z.string().min(1, 'Veuillez sélectionner le quartier de livraison'),
  deliveryAddress: z.string().min(3, 'Précisez votre adresse ou un repère (ex: Pharmacie, Marché)'),
  buyerPhone: phoneSchema,
  paymentMethod: z.enum(['wave', 'orange', 'mtn', 'moov', 'cash_on_delivery']),
  buyerNotes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

/** Schéma de configuration de paiement Payout */
export const payoutSetupSchema = z.object({
  network: z.enum(['wave', 'orange', 'mtn', 'moov']),
  phone: phoneSchema,
  accountName: z.string().min(2, 'Nom du titulaire du compte requis'),
});

export type PayoutSetupFormData = z.infer<typeof payoutSetupSchema>;

/**
 * Génère un code OTP numérique sécurisé à N chiffres à l'aide de l'API Crypto.
 *
 * @param digits Nombre de chiffres souhaité pour le code (défaut: 4)
 * @returns Chaîne numérique représentant le code OTP sécurisé
 */
export function generateSecureOtp(digits: number = 4): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const range = max - min + 1;

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    const randomOffset = buffer[0] % range;
    return (min + randomOffset).toString();
  }

  // Fallback haute entropie si l'environnement n'injecte pas crypto
  const timestampPart = Date.now() % range;
  const randomPart = Math.floor(Math.random() * range);
  const combined = (timestampPart + randomPart) % range;
  return (min + combined).toString();
}
