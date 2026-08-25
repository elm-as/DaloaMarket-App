# 🛍️ DaloaMarket - Application Mobile Android

Application mobile native Android pour **DaloaMarket** (https://daloamarket.com), la première marketplace e-commerce avec livraison et paiement sécurisé par séquestre (Escrow) de Daloa, Côte d'Ivoire.

---

## 🚀 Fonctionnalités Clés

- **Catalogue & Recherche Avancée** : Filtres par catégories, quartiers de Daloa (50+), état du produit et tri par prix/nouveauté.
- **Tunnel de Commande Escrow** : Paiement sécurisé Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money) avec fonds sous séquestre jusqu'à la livraison.
- **Double Code OTP** : Remise de colis avec code secret `pickup_otp` (vendeur) et `delivery_otp` (acheteur).
- **Studio Vendeur PRO** : Badge certifié, vitrine personnalisée, partage direct sur statuts WhatsApp, packs de boosts et retraits de solde Mobile Money.
- **Messagerie Instantanée** : Discussion directe acheteurs/vendeurs avec notifications temps réel.

---

## 🛠️ Stack Technique

- **Framework** : React Native avec Expo SDK & Expo Router v4
- **Langage** : TypeScript
- **State Management** : Zustand & TanStack React Query v5
- **Backend & Temps Réel** : Supabase
- **Paiements** : Passerelle Mobile Money Money Fusion / DaloaPay
- **Sécurité** : Expo SecureStore (`SecureStorageAdapter`)
- **Design System** : `@daloa/ui` avec thème bespoke Deep Orange & Dark Slate

---

## 📦 Installation & Démarrage

```bash
# Installer les dépendances
npm install # ou pnpm install

# Lancer le serveur de développement Expo
npx expo start
```

---

## 🤖 Compilation Android (APK & AAB)

```bash
# Générer l'APK direct
eas build --profile preview --platform android

# Générer le bundle Google Play Store
eas build --profile production --platform android
```
