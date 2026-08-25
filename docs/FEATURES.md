# 🌟 Matrice des Fonctionnalités Implémentées

Ce document détaille toutes les fonctionnalités implémentées dans les applications mobiles **DaloaMarket** et **DaloaDelivery**.

---

## 🛍️ 1. DaloaMarket (Marketplace Mobile)

### 🛒 Découverte & Catalogue
- **Exploration d'annonces** : Grille à 2 colonnes avec photos HD, étiquettes de quartier à Daloa, badges PRO et états.
- **Recherche avancée** : Filtrage en temps réel par catégorie, quartier de Daloa, état (Neuf, Très bon état...), fourchette de prix et mode livraison.
- **Fiche produit interactive** : Carrousel photo gestuel, sélection de variantes (tailles/couleurs avec ajustement dynamique de prix), profil du vendeur avec note et avis.
- **Partage Statut WhatsApp** : Génération de messages WhatsApp préformatés pour diffuser sa boutique ou une annonce sur son statut.

### 🔒 Tunnel de Commande Séquestre (Escrow)
- **Panier multi-articles** avec calcul dynamique des frais de livraison et de la commission de protection séquestre (3%).
- **Choix du quartier à Daloa** avec estimation de la distance en kilomètres (formule Haversine).
- **Paiements Mobile Money intégrés** : Wave, Orange Money, MTN MoMo, Moov Money.
- **Option de paiement à la livraison (COD)** selon la configuration du vendeur.

### 📦 Suivi de Commande & Sécurité
- **Timeline en direct** : Commande payée ➔ Vendeur notifié ➔ Livreur assigné ➔ Colis ramassé ➔ Livré.
- **Code secret OTP de livraison** : Affichage sécurisé du code à 4 chiffres à remettre au livreur.
- **Appels directs en un clic** vers le livreur ou le vendeur.
- **Signalement de litige** : Gel automatique des fonds sous séquestre et notification des modérateurs.

### 💬 Messagerie & Studio Vendeur
- **Discussion instantanée acheteur/vendeur** avec rattachement d'annonce et écoute temps réel Supabase.
- **Publication d'annonces** avec téléversement multi-photos, création de variantes et quartier.
- **Statut Vendeur PRO** : Adhésion mensuelle/annuelle, badge doré, commission réduite à 2.5%, vitrine personnalisée.
- **Achat de Packs & Boosts** : Mises en avant 7 jours et remontées en tête de liste.
- **Portefeuille Vendeur** : Solde disponible, gains en séquestre (24h) et demandes de retraits Mobile Money.

---

## 🛵 2. DaloaDelivery (Application Coursiers & Flotte Logistique)

### ⚡ Gestion de Disponibilité
- **Bascule En Ligne / Hors Ligne** en un clic avec indicateur visuel glowing.
- **Suivi GPS automatique en arrière-plan** dès l'activation du mode En Ligne pour assignation de proximité.

### 🎯 Flux des Courses & Exécution
- **Flux des courses disponibles** : Affichage des gains nets livreur, distance estimée, quartier de ramassage (vendeur) et de livraison (acheteur).
- **Acceptation instantanée** d'une course avec retours haptiques.
- **Guidage GPS** : Ouverture automatique des coordonnées dans Google Maps / Apple Maps.
- **Double protocole OTP de sécurité** :
  1. *Étape Ramassage* : Saisie de l'OTP Vendeur + Photo de contrôle obligatoire du paquet + Vérification GPS (≤ 100m).
  2. *Étape Livraison* : Saisie de l'OTP Acheteur + Photo de remise du colis + Vérification GPS (≤ 100m).
- **Signalement d'incident terrain** (destinataire absent, marchandise non conforme...).

### 💰 Gains & Portefeuille Coursier
- **Gain net de 90%** crédité immédiatement à la saisie de l'OTP livraison.
- **Tableau de bord de performances** : Nombre de courses livrées aujourd'hui, gains du jour.
- **Retraits Mobile Money** : Demandes de reversement Wave / Orange / MTN / Moov sous 24h ouvrées.

### 🛡️ Vérification CNI / KYC & Annuaire
- **Tunnel de vérification CNI** : Prise de photo Recto / Verso et Selfie en direct pour certification livreur.
- **Annuaire des confrères de Daloa** : Liste des livreurs actifs, véhicules et contacts d'entraide.
- **Boutiques affiliées** : Gestion des commerçants ayant désigné le livreur comme coursier dédié.
