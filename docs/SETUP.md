# 🚀 Guide d'Installation & Démarrage Local

Ce guide décrit la configuration de l'environnement de développement pour exécuter les deux applications Android sur votre machine ou sur un smartphone physique.

---

## 1. Prérequis Système

- **Node.js** : v18.x ou supérieur (v20 LTS recommandé)
- **Gestionnaire de paquets** : `pnpm` (ou `npm` / `yarn`)
- **Expo CLI** : Intégré via `npx expo`
- **Application mobile Expo Go** : Disponible sur le Google Play Store pour tester sur téléphone Android.

---

## 2. Installation des Dépendances

À la racine du projet (`C:\Users\elmas\Downloads\DM_DD`) :

```bash
# Installation de tous les packages du monorepo
pnpm install
```

---

## 3. Configuration des Variables d'Environnement

Vérifiez que les fichiers `.env` existent dans chaque application :

- `apps/daloamarket/.env`
- `apps/daloadelivery/.env`

Contenu standard :
```env
EXPO_PUBLIC_SUPABASE_URL=https://wjanjnoxzizxxhtbwyqd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BLrm_nNwAjmvcwrjxL6BYA_VGdKOx2a
EXPO_PUBLIC_PAYMENT_API_URL=https://api.daloamarket.com
```

---

## 4. Lancement en Mode Développement

### Lancer DaloaMarket (Marketplace)
```bash
# Depuis la racine :
pnpm --filter @daloa/market start

# Ou directement dans le dossier :
cd apps/daloamarket
npx expo start
```
Appuyez sur `a` dans le terminal pour lancer sur un émulateur Android, ou scannez le QR code avec l'application **Expo Go** sur votre téléphone.

---

### Lancer DaloaDelivery (Livreurs)
```bash
# Depuis la racine :
pnpm --filter @daloa/delivery start

# Ou directement dans le dossier :
cd apps/daloadelivery
npx expo start
```

---

## 5. Vérification du Typage TypeScript

Pour valider l'intégrité de tous les packages et applications :

```bash
# Vérification globale
pnpm typecheck
```
