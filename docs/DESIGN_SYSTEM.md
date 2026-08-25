# 🎨 Système de Design Mobile (@daloa/ui)

Le package `@daloa/ui` fournit l'ensemble des tokens visuels, polices et composants graphiques partagés entre **DaloaMarket** et **DaloaDelivery**.

---

## 1. Palette de Couleurs & Tokens

### Palette Commune (Surfaces & Fonds Dark Mode)
| Token | Valeur Hex | Utilisation |
|---|---|---|
| `colors.dark.background` | `#0B0F17` | Fond d'écran principal DaloaMarket |
| `colors.dark.surface` | `#131B2A` | Fond des cartes et sections |
| `colors.dark.surfaceRaised` | `#1A2438` | Badges, inputs et boutons secondaires |
| `colors.dark.border` | `#232F46` | Bordures standards |
| `colors.dark.text` | `#F8FAFC` | Texte principal blanc lumineux |
| `colors.dark.textMuted` | `#94A3B8` | Texte secondaire / descriptions |
| `colors.dark.textDim` | `#64748B` | Légendes et dates |

### Identité DaloaMarket (Orange & Escrow Vert)
| Token | Valeur Hex | Utilisation |
|---|---|---|
| `colors.market.primary` | `#F97316` | Boutons CTA principaux, prix en vedette |
| `colors.market.primaryDark` | `#EA580C` | Hover / Active states |
| `colors.market.accent` | `#F59E0B` | Badges Pro, mises en vedette |
| `colors.status.success` | `#10B981` | Garantie Séquestre Escrow, validation OTP |

### Identité DaloaDelivery (Cyan Électrique & Dark Slate)
| Token | Valeur Hex | Utilisation |
|---|---|---|
| `colors.delivery.primary` | `#06B6D4` | Boutons CTA courses, gains livreur |
| `colors.delivery.primaryDark` | `#0891B2` | États actifs |
| `colors.delivery.accent` | `#F97316` | Rappels Marketplace |
| `background` | `#090D16` | Fond d'écran ultra sombre logistique |

---

## 2. Typographie & Espacements

- **Tailles de texte** :
  - `xs`: 12px, `sm`: 14px, `base`: 16px, `lg`: 18px, `xl`: 20px, `2xl`: 24px, `3xl`: 28px, `4xl`: 32px.
- **Graisses** :
  - `regular`: `400`, `medium`: `500`, `semibold`: `600`, `bold`: `700`, `extrabold`: `800`.
- **Rayons de courbure (Border Radius)** :
  - `sm`: 6px, `md`: 8px, `lg`: 12px, `xl`: 16px, `2xl`: 20px, `full`: 9999px.

---

## 3. Catalogue des Composants React Native Bespoke

1. **`Button`** (`@daloa/ui/src/components/Button.tsx`) :
   - Variantes : `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `market`, `delivery`.
   - Tailles : `sm`, `md`, `lg`.
   - Support des icônes gauche/droite et indicateur de chargement natif.
2. **`Card`** (`@daloa/ui/src/components/Card.tsx`) :
   - Variantes : `default`, `flat`, `outlined`, `glowMarket`, `glowDelivery`.
3. **`StatusPill`** (`@daloa/ui/src/components/StatusPill.tsx`) :
   - Badges colorés traduits pour les statuts de commande et de livraison (`pending_payment`, `awaiting_pickup`, `in_transit`, `delivered`, `disputed`, `cancelled`).
4. **`Badge`** (`@daloa/ui/src/components/Badge.tsx`) :
   - Badges pour statuts spécifiques : `pro`, `verified`, `popular`, `new`, `discount`.
5. **`Input`** (`@daloa/ui/src/components/Input.tsx`) :
   - Champ de formulaire avec label, sous-texte d'aide, gestion des erreurs, icône gauche et mode mot de passe masqué/affiché.
6. **`SearchInput`** (`@daloa/ui/src/components/SearchInput.tsx`) :
   - Barre de recherche avec bouton d'effacement et bouton de filtre avec pastille active.
7. **`OtpInput`** (`@daloa/ui/src/components/OtpInput.tsx`) :
   - Saisie segmentée de code OTP à 4 ou 6 chiffres avec focus automatique.
8. **`CurrencyText`** (`@daloa/ui/src/components/CurrencyText.tsx`) :
   - Formatage officiel FCFA avec séparateurs de milliers (ex: `25 000 FCFA`).
9. **`RatingStars`** (`@daloa/ui/src/components/RatingStars.tsx`) :
   - Affichage d'étoiles de notation (ex: 4.8 ★) et compteur d'avis.
10. **`Avatar`** (`@daloa/ui/src/components/Avatar.tsx`) :
    - Photo de profil ou initiales avec badge PRO intégré.
11. **`BottomSheet`** (`@daloa/ui/src/components/BottomSheet.tsx`) :
    - Volet modal coulissant par le bas pour filtres et signalements d'incidents.
12. **`StatCard`** (`@daloa/ui/src/components/StatCard.tsx`) :
    - Carte KPI pour les tableaux de bord (Revenus, Vues, Livraisons du jour).
13. **`EmptyState`** (`@daloa/ui/src/components/EmptyState.tsx`) :
    - Écran d'état vide avec icône, titre, description et bouton d'action.
14. **`Skeleton`** (`@daloa/ui/src/components/Skeleton.tsx`) :
    - Placeholder animé pendant le chargement des données.
15. **`Header`** (`@daloa/ui/src/components/Header.tsx`) :
    - En-tête d'écran avec retour arrière et actions droite.
