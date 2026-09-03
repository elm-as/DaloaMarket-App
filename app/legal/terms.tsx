import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  ShieldCheck,
  Globe,
  Users,
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  Scale,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TermSection {
  id: string;
  icon: any;
  title: string;
  content: string[];
}

const TERMS: TermSection[] = [
  {
    id: 'intro',
    icon: Globe,
    title: '1. Rôle d’intermédiaire & Acceptation',
    content: [
      'DaloaMarket est une plateforme de commerce de proximité opérée à Daloa (Côte d’Ivoire) mettant en relation des acheteurs, des vendeurs et des coursiers indépendants.',
      'Le contrat de vente est conclu directement entre l’acheteur et le vendeur. DaloaMarket intervient comme tiers de confiance technique et opérateur de la passerelle de séquestre (escrow).',
    ],
  },
  {
    id: 'account',
    icon: Users,
    title: '2. Compte utilisateur & Sécurité',
    content: [
      'L’utilisateur s’engage à fournir des informations exactes lors de son inscription (numéro de téléphone, nom et quartier à Daloa).',
      'Chaque utilisateur est personnellement responsable de la garde de ses accès et de ses codes de validation de commande.',
    ],
  },
  {
    id: 'listings',
    icon: ShoppingBag,
    title: '3. Règles de publication des annonces',
    content: [
      'Sont formellement interdits : les contrefaçons, les produits volés, les armes, les stupéfiants, les médicaments non autorisés et tout contenu illicite en droit ivoirien.',
      'Chaque annonce doit comporter un prix réel en FCFA, des photos réelles et récentes de l’article et la mention honnête de son état.',
      'La publication est gratuite jusqu’à 20 annonces actives simultanément. Au-delà, l’abonnement au Pass Vendeur Pro est requis.',
    ],
  },
  {
    id: 'escrow',
    icon: CreditCard,
    title: '4. Paiement Séquestre & Frais',
    content: [
      'Frais acheteur : 0 FCFA (0% de commission acheteur). L’acheteur ne paie que le prix du bien et les frais de livraison.',
      'Commissions vendeur : 3,5% pour les vendeurs standards, et réduite à 2,5% pour les Vendeurs Pro.',
      'Les fonds Mobile Money (Wave, Orange, MTN, Moov) sont bloqués en compte séquestre dès la commande et versés au vendeur uniquement après remise du code OTP secret.',
    ],
  },
  {
    id: 'delivery',
    icon: Truck,
    title: '5. Livraisons & Réseau DaloaDelivery',
    content: [
      'Tarifs officiels : 500 FCFA pour les premiers 1,5 km, puis 85 FCFA par km supplémentaire, calculés par géolocalisation.',
      'Le coursier indépendant perçoit 90% des frais de livraison (10% de frais techniques retenus par la plateforme).',
      'Validation de sécurité : le coursier doit se trouver à moins de 100 mètres des coordonnées GPS de destination pour valider la remise.',
    ],
  },
  {
    id: 'affiliated',
    icon: ShieldCheck,
    title: '6. Livreurs Affiliés & Responsabilité',
    content: [
      'Les Vendeurs Pro peuvent mandater leurs propres livreurs affiliés personnels de confiance pour assurer leurs courses ou le paiement en espèces à la livraison (COD).',
      'Le Vendeur Pro assume la responsabilité intégrale des actes et pertes de ses livreurs affiliés.',
      'Protection acheteur : en cas de litige, perte ou non-remise par un livreur affilié, l’acheteur est intégralement remboursé.',
    ],
  },
  {
    id: 'pro',
    icon: Star,
    title: '7. Pass Vendeur Pro & Visibilité',
    content: [
      'Pass Vendeur Pro : 2 500 FCFA / mois ou 25 000 FCFA / an (2 mois offerts). Débloque le stock illimité, le badge Pro, les livreurs affiliés et la commission réduite à 2,5%.',
      'Options de mise en avant : Boost en vedette 7 jours à 500 FCFA, et Bump de tête de liste à 200 FCFA.',
    ],
  },
  {
    id: 'disputes',
    icon: Scale,
    title: '8. Litiges & Droit applicable',
    content: [
      'Toute contestation doit être signalée avant la transmission du code secret OTP. Une fois l’OTP validé, la transaction est réputée conforme et définitive.',
      'Les présentes conditions sont soumises à la législation de la République de Côte d’Ivoire. Tout litige non résolu à l’amiable relève des juridictions compétentes de Daloa et d’Abidjan.',
    ],
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [openSectionId, setOpenSectionId] = useState<string | null>('intro');

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSectionId(openSectionId === id ? null : id);
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
              Cadre Juridique
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Conditions générales (CGU)
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <ShieldCheck size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <AppText variant="caption" color={colors.text.muted} style={styles.introText}>
            Dernière mise à jour : 2026. Les présentes CGU encadrent l’usage de la plateforme DaloaMarket
            et du service de livraison DaloaDelivery en République de Côte d’Ivoire.
          </AppText>
        </View>

        <View style={styles.card}>
          {TERMS.map((sec, idx) => {
            const IconComp = sec.icon;
            const isOpen = openSectionId === sec.id;
            return (
              <View key={sec.id} style={[styles.termRow, idx < TERMS.length - 1 && styles.termBorder]}>
                <AppPressable
                  onPress={() => toggleSection(sec.id)}
                  style={styles.headerBtn}
                  accessibilityRole="button"
                >
                  <View style={[styles.iconBox, { backgroundColor: accent[50] }]}>
                    <IconComp size={16} color={accent.DEFAULT} />
                  </View>
                  <AppText variant="bodyStrong" style={styles.termTitle}>
                    {sec.title}
                  </AppText>
                  <ChevronDown
                    size={18}
                    color={isOpen ? accent.DEFAULT : colors.text.subtle}
                    style={isOpen ? styles.chevronOpen : undefined}
                  />
                </AppPressable>
                {isOpen && (
                  <View style={styles.contentWrap}>
                    {sec.content.map((p, pIdx) => (
                      <AppText key={pIdx} variant="caption" color={colors.text.body} style={styles.paragraph}>
                        {p}
                      </AppText>
                    ))}
                  </View>
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
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  introCard: {
    paddingHorizontal: spacing[2],
  },
  introText: {
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
  },
  termRow: {
    paddingVertical: spacing[3],
  },
  termBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termTitle: {
    flex: 1,
    lineHeight: 18,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  contentWrap: {
    marginTop: spacing[2],
    paddingLeft: 38,
    gap: spacing[2],
  },
  paragraph: {
    lineHeight: 19,
  },
});
