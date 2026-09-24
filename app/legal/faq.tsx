import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { ChevronDown, ArrowLeft, HelpCircle } from 'lucide-react-native';
import {
  FEES,
  DELIVERY,
  PRO_PASS,
  VISIBILITY,
  PAYMENT_NETWORKS,
  MAX_CONSECUTIVE_CANCELLATIONS,
} from '../../src/legal/legal-facts';

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
    a: `Quand vous payez en ligne (${PAYMENT_NETWORKS}), l'argent n'est pas versé immédiatement au vendeur : il est conservé par notre prestataire de paiement jusqu'à ce que vous confirmiez la réception de votre colis en communiquant votre code OTP au livreur.`,
  },
  {
    category: 'buyer',
    q: "Quels frais l'acheteur paie-t-il exactement ?",
    a: `Vous réglez le prix de l'article, les frais de livraison s'il y a lieu, et des frais de service de ${FEES.buyerPct} du prix de l'article, qui couvrent la sécurisation du paiement et l'infrastructure. Le détail est affiché ligne par ligne avant validation : aucun frais n'est ajouté ensuite.`,
  },
  {
    category: 'delivery',
    q: 'Combien coûte la livraison à Daloa ?',
    a: `Le tarif DaloaDelivery est de ${DELIVERY.basePrice} jusqu'à ${DELIVERY.baseKm} km, puis ${DELIVERY.perKm} par kilomètre supplémentaire. La distance est calculée par GPS et le montant exact s'affiche avant validation. Le retrait sur place chez le vendeur est sans frais de livraison.`,
  },
  {
    category: 'delivery',
    q: 'Combien gagne le livreur sur une course ?',
    a: `Les coursiers indépendants DaloaDelivery perçoivent ${FEES.driverNetPct} du montant de la course. Une retenue de ${FEES.driverPlatformPct} est appliquée par la plateforme pour la mise en relation, le suivi GPS et le traitement du paiement. Cette retenue ne porte jamais sur le prix de l'article.`,
  },
  {
    category: 'escrow',
    q: 'Que se passe-t-il si le colis est non conforme ou abîmé ?',
    a: "Ne donnez JAMAIS votre code OTP au livreur si l'article est non conforme ou endommagé : c'est ce code, et lui seul, qui débloque le versement au vendeur. Signalez le litige depuis le suivi de commande ou au support. Après vérification, vous êtes remboursé.",
  },
  {
    category: 'seller',
    q: "Combien coûte la publication d'annonces pour un vendeur ?",
    a: `Pendant la phase de lancement, la publication est gratuite et sans plafond, et DaloaMarket ne prélève aucune commission sur vos ventes. À la fin de cette phase, une commission vendeur de ${FEES.sellerStandardPct} s'appliquera (${FEES.sellerProPct} pour les Vendeurs Pro). Vous serez prévenu avant toute mise en application.`,
  },
  {
    category: 'seller',
    q: 'Quels sont les tarifs et avantages du Pass Vendeur Pro ?',
    a: `Le Pass Vendeur Pro est à ${PRO_PASS.monthly} / mois ou ${PRO_PASS.yearly} / an (2 mois offerts). Il donne le badge Pro vérifié, une priorité de classement et la commission réduite à ${FEES.sellerProPct} au lieu de ${FEES.sellerStandardPct} lorsque la grille entrera en vigueur. Pendant la phase de lancement, les annonces illimitées, le paiement à la livraison, le retrait sur place et les livreurs affiliés sont ouverts à tous les vendeurs.`,
  },
  {
    category: 'seller',
    q: 'Comment fonctionnent les Livreurs Affiliés ?',
    a: "Un vendeur peut inviter ses propres livreurs de confiance via leur numéro de téléphone, pour leur attribuer ses courses et les autoriser à encaisser en espèces à la livraison. Cette possibilité est ouverte à tous les vendeurs pendant la phase de lancement.",
  },
  {
    category: 'escrow',
    q: 'Que se passe-t-il en cas de vol ou perte par un livreur affilié ?',
    a: "L'acheteur est intégralement remboursé ou conserve son argent. Le vendeur est responsable des livreurs qu'il a lui-même affiliés et règle le différend directement avec eux.",
  },
  {
    category: 'seller',
    q: 'Quels sont les boosts de visibilité disponibles ?',
    a: `Le Boost place votre annonce en tête de liste avec un badge « Sponsorisé ». Il se paie en crédits : ${VISIBILITY.boostOptions}. Les crédits s'achètent en packs (${VISIBILITY.creditPacks}), indépendamment du Pass Vendeur Pro.`,
  },
  {
    category: 'seller',
    q: 'Comment créer et personnaliser ma boutique ?',
    a: "Rendez-vous dans Profil → Paramètres de ma boutique. Vous pouvez définir le nom commercial de votre enseigne, importer un logo, une bannière de couverture, votre quartier, un numéro WhatsApp et une couleur de thème.",
  },
  {
    category: 'buyer',
    q: 'Quels moyens de paiement sont acceptés ?',
    a: `Nous acceptons ${PAYMENT_NETWORKS} via passerelle sécurisée. Le paiement en espèces à la livraison est également disponible : pendant la phase de lancement, il est ouvert à tous les vendeurs et proposé par défaut.`,
  },
  {
    category: 'buyer',
    q: 'Puis-je annuler une commande avant livraison ?',
    a: `Oui, tant que le livreur n'a pas validé le ramassage chez le vendeur. Si vous aviez payé en ligne, le montant vous est restitué. Au-delà de ${MAX_CONSECUTIVE_CANCELLATIONS} annulations consécutives, votre compte ne peut plus annuler seul et vous devez passer par le support.`,
  },
  {
    category: 'buyer',
    q: 'Comment supprimer mon compte DaloaMarket ?',
    a: "Allez dans Profil → Paramètres → Supprimer mon compte. Vos annonces, votre boutique et vos favoris sont retirés. Certaines données liées à vos commandes sont conservées au-delà lorsque la loi ivoirienne nous impose de le faire, pour des raisons comptables et fiscales.",
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
    fontFamily: typography.families.bold,
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
