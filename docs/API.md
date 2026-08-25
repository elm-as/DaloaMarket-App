# 🔌 Intégration Backend & API (@daloa/api)

Ce document décrit l'intégration avec **Supabase** (Base de données, Auth, Storage, Realtime) et la passerelle de paiement **Money Fusion / DaloaPay**.

---

## 1. Configuration Supabase

- **Supabase Project URL** : `https://wjanjnoxzizxxhtbwyqd.supabase.co`
- **Supabase Anon Public Key** : `sb_publishable_BLrm_nNwAjmvcwrjxL6BYA_VGdKOx2a`
- **Client Initialisation** : [`packages/api/src/supabase.ts`](file:///c:/Users/elmas/Downloads/DM_DD/packages/api/src/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@daloa/types';
import { SecureStorageAdapter } from '@daloa/utils';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

---

## 2. Schéma des Tables Principales

| Table | Rôle |
|---|---|
| `users` | Profils utilisateurs (Acheteurs, Vendeurs, Livreurs, Statut PRO, Quartier) |
| `delivery_persons` | Profils détaillés livreurs (Véhicule, Statut En Ligne, Note, Vérification CNI) |
| `listings` | Annonces de la Marketplace (Titre, Prix, Variantes, Photos, Quartier Daloa) |
| `orders` | Commandes et séquestre Escrow (Montant total, Frais, Quartier, Statut) |
| `delivery_assignments` | Courses de livraison (Double OTP, Photos preuves, Positions GPS) |
| `messages` | Messagerie instantanée acheteurs/vendeurs |
| `reviews` | Avis et notations acheteurs/vendeurs/livreurs |
| `payouts` | Demandes de retraits Mobile Money (Wave, Orange, MTN, Moov) |
| `ban_appeals` | Recours en cas de suspension de compte |

---

## 3. Services Métier Disponibles

Toutes les méthodes sont regroupées dans [`packages/api/src/services/`](file:///c:/Users/elmas/Downloads/DM_DD/packages/api/src/services/) :

1. **`authService`** : Inscription, Connexion, Réinitialisation de mot de passe, Mise à jour profil.
2. **`listingsService`** : Recherche filtrée, Récupération par ID, Création d'annonce avec variantes et téléversement photos.
3. **`ordersService`** : Création de commande avec calcul de frais séquestre, Suivi de statut, Déclaration de litige, Souscription temps réel.
4. **`deliveryService`** : Flux des courses disponibles, Acceptation d'une course, Validation OTP Pickup avec photo et GPS, Validation OTP Delivery avec photo et GPS, Signalement d'incident, Localisation livreur.
5. **`paymentService`** : Initialisation de paiement Mobile Money Money Fusion / DaloaPay, Demande de retrait (Payout).
6. **`chatService`** : Envoi de message avec pièce jointe ou lien article, Récupération des conversations, Écoute temps réel.
7. **`payoutService`** : Enregistrement et lecture des coordonnées Mobile Money.
8. **`affiliationsService`** : Gestion des livreurs dédiés d'une boutique.
9. **`reviewsService`** : Dépôt et lecture des avis.
10. **`notificationsService`** : Enregistrement des tokens Expo Push Notifications.

---

## 4. Hooks React Query (`@daloa/api/src/queries`)

- `useListings(filters)`
- `useListingDetail(id)`
- `useSimilarListings(category, id)`
- `useUserOrders(userId, role, status)`
- `useOrderDetail(id)`
- `useAvailableRuns(driverLocation, isOnline)`
- `useActiveDriverRun(driverId)`
- `useDriverDailyStats(driverId)`
- `useConversations(userId)`
- `useChatMessages(userId, partnerId)`
- `usePayoutSettings(userId)`
- `usePayoutHistory(userId)`
- `useAffiliatedDeliverers(sellerId)`
- `useReviews(targetType, targetId)`
