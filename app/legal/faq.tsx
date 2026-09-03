import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ChevronDown, ArrowLeft, HelpCircle } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqCategory = 'all' | 'buyer' | 'seller' | 'escrow' | 'delivery';

interface FaqItemData {
  category: FaqCategory;
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItemData[] = [
  {
    category: 'escrow',
    q: "Qu'est-ce que le paiement séquestre (Escrow) ?",
    a: "Votre argent est bloqué sur un compte de cantonnement sécurisé lors du paiement Mobile Money (Wave, Orange, MTN, Moov). Il n'est transféré au vendeur qu'après que vous ayez reçu et inspecté votre colis en remettant votre code secret OTP.",
  },
  {
    category: 'buyer',
    q: "L'acheteur paie-t-il des frais de service ?",
    a: "Non. Sur DaloaMarket, l'acheteur paie exactement le prix affiché du produit plus les frais de livraison éventuels. Il n'y a aucun frais de service caché pour l'acheteur (0% de commission acheteur).",
  },
  {
    category: 'delivery',
    q: 'Combien coûte la livraison à Daloa ?',
    a: 'Le tarif officiel DaloaDelivery est de 500 FCFA pour les premiers 1,5 km, puis 85 FCFA par kilomètre supplémentaire. Le montant exact est calculé par coordonnées GPS et affiché avant validation.',
  },
  {
    category: 'delivery',
    q: 'Combien gagne le livreur sur une course ?',
    a: 'Les coursiers indépendants DaloaDelivery perçoivent 90% du montant de la livraison. Une retenue technique de 10% est appliquée par la plateforme pour la maintenance et la géolocalisation.',
  },
  {
    category: 'escrow',
    q: 'Que se passe-t-il si le colis est non conforme ou abîmé ?',
    a: "Ne donnez JAMAIS votre code secret OTP au livreur si l'article est non conforme ou endommagé. Les fonds restent bloqués sous séquestre et notre support procède à votre remboursement intégral.",
  },
  {
    category: 'seller',
    q: 'Combien coûte la publication d’annonces pour un vendeur ?',
    a: "La publication est gratuite jusqu'à 20 annonces actives simultanément. Pour un nombre illimité d'annonces, un badge Pro et l'accès aux Livreurs Affiliés, vous pouvez activer le Pass Vendeur Pro.",
  },
  {
    category: 'seller',
    q: 'Quels sont les tarifs et avantages du Pass Vendeur Pro ?',
    a: "Le Pass Vendeur Pro est disponible à 2 500 FCFA / mois ou 25 000 FCFA / an (2 mois offerts). Il débloque le stock illimité, le badge Pro vérifié, la commission réduite à 2,5% (au lieu de 3,5%), la gestion de livreurs affiliés et les options COD.",
  },
  {
    category: 'seller',
    q: 'Comment fonctionnent les Livreurs Affiliés pour un vendeur Pro ?',
    a: "Le Vendeur Pro peut inviter ses propres livreurs personnels de confiance via leur numéro de téléphone pour leur attribuer ses courses privées et autoriser le règlement en espèces à la livraison.",
  },
  {
    category: 'escrow',
    q: 'Que se passe-t-il en cas de vol ou perte par un livreur affilié ?',
    a: "L'acheteur est intégralement remboursé quoi qu'il arrive. Le Vendeur Pro est contractuellement responsable de ses livreurs affiliés personnels et règle directement le différend avec son employé.",
  },
  {
    category: 'seller',
    q: 'Quels sont les boosts de visibilité disponibles ?',
    a: "Vous pouvez booster une annonce en vedette pendant 7 jours pour 500 FCFA (bandeau doré et affichage prioritaire sur l'accueil) ou faire un Bump de remontée en tête de liste pour 200 FCFA.",
  },
  {
    category: 'seller',
    q: 'Comment créer et personnaliser ma boutique ?',
    a: "Rendez-vous dans Profil → Paramètres de ma boutique. Vous pouvez définir le nom commercial de votre enseigne, importer un logo, une bannière de couverture, votre quartier et une couleur de thème.",
  },
  {
    category: 'buyer',
    q: 'Quels moyens de paiement sont acceptés ?',
    a: 'Nous acceptons Wave Côte d’Ivoire, Orange Money, MTN MoMo et Moov Money via passerelle sécurisée. Le paiement en espèces à la livraison (COD) est également possible si le vendeur l’autorise.',
  },
  {
    category: 'buyer',
    q: 'Puis-je annuler une commande avant livraison ?',
    a: "Oui. Tant que le livreur n'a pas validé le ramassage chez le vendeur avec le code OTP Pickup, vous pouvez annuler votre commande. Le montant sous séquestre vous est restitué sous 24h.",
  },
  {
    category: 'buyer',
    q: 'Comment supprimer mon compte DaloaMarket ?',
    a: 'Allez dans Profil → Paramètres → Supprimer mon compte. Toutes vos données personnelles, annonces et historiques de commandes seront définitivement purgés.',
  },
];

const CATEGORIES: { id: FaqCategory; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'escrow', label: 'Séquestre' },
  { id: 'delivery', label: 'Livraison' },
  { id: 'seller', label: 'Vendeurs' },
  { id: 'buyer', label: 'Acheteurs' },
];

export default function FaqScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [selectedCat, setSelectedCat] = useState<FaqCategory>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    if (selectedCat === 'all') return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => item.category === selectedCat);
  }, [selectedCat]);

  const toggleExpand = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <AppPressable
            onPress={() => router.back()}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Centre d'aide
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Questions fréquentes
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <HelpCircle size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      {/* Barre de filtres par catégories */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <AppPressable
                key={cat.id}
                onPress={() => {
                  setSelectedCat(cat.id);
                  setExpandedIndex(null);
                }}
                style={[
                  styles.categoryPill,
                  isSelected && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT },
                ]}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? colors.text.inverse : colors.text.body}
                  style={styles.categoryText}
                >
                  {cat.label}
                </AppText>
              </AppPressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {filteredFaqs.map((item, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <View
                key={item.q}
                style={[styles.faqRow, idx < filteredFaqs.length - 1 && styles.faqRowBorder]}
              >
                <AppPressable
                  onPress={() => toggleExpand(idx)}
                  style={styles.questionBtn}
                  accessibilityRole="button"
                >
                  <AppText variant="bodyStrong" style={styles.questionText}>
                    {item.q}
                  </AppText>
                  <ChevronDown
                    size={18}
                    color={isOpen ? accent.DEFAULT : colors.text.subtle}
                    style={isOpen ? styles.chevronOpen : undefined}
                  />
                </AppPressable>
                {isOpen && (
                  <AppText variant="body" color={colors.text.muted} style={styles.answerText}>
                    {item.a}
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ height: insets.bottom + spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesBar: {
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingVertical: spacing[2],
  },
  categoryScroll: {
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  categoryPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  categoryText: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing[4],
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
  },
  faqRow: {
    paddingVertical: spacing[3],
  },
  faqRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  questionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  questionText: {
    flex: 1,
    lineHeight: 20,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  answerText: {
    marginTop: spacing[2],
    lineHeight: 21,
    fontSize: 13,
  },
});
