import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  colors,
  radii,
  spacing,
  typography,
  Avatar,
  Card,
  Button,
  Badge,
} from '@daloa/ui';
import {
  Store,
  Wallet,
  Sparkles,
  Layers,
  Bike,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Share2,
  PhoneCall,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout, isAuthenticated } = useAuth();

  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());

  const handleShareShopWhatsApp = async () => {
    Haptics.success();
    const shopName = profile?.shop_name || profile?.full_name || 'Ma boutique DaloaMarket';
    const slug = profile?.shop_slug || user?.id?.slice(0, 8) || '';
    const shareUrl = `https://daloamarket.com/shop/${slug}`;
    const message = `🛍️ Découvrez tous mes articles sur ma boutique DaloaMarket !\n👉 ${shareUrl}\n📦 Livraison rapide et paiement sécurisé par séquestre partout à Daloa.`;

    try {
      await Share.share({
        message,
        title: shopName,
      });
    } catch (err) {
      console.warn('Erreur partage:', err);
    }
  };

  const handleLogout = async () => {
    Haptics.warning();
    await logout();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.unauthContainer}>
          <View style={styles.unauthIconBox}>
            <Store size={40} color={colors.market.primary} />
          </View>
          <Text style={styles.unauthTitle}>Bienvenue sur DaloaMarket</Text>
          <Text style={styles.unauthSubtitle}>
            Connectez-vous pour gérer vos commandes, publier des annonces et ouvrir votre boutique en ligne à Daloa.
          </Text>

          <View style={styles.unauthBtnRow}>
            <Button
              title="Se connecter"
              variant="market"
              size="lg"
              onPress={() => router.push('/auth/login')}
              style={{ width: '100%' }}
            />
            <Button
              title="Créer un compte"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/auth/register')}
              style={{ width: '100%', marginTop: spacing[2] }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar
              uri={profile?.avatar_url || profile?.shop_logo_url}
              name={profile?.full_name || 'Utilisateur'}
              size={64}
              isPro={isPro}
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {profile?.shop_name || profile?.full_name || 'Mon Compte'}
                </Text>
                {isPro && <Badge label="VENDEUR PRO" variant="pro" />}
              </View>
              <Text style={styles.userPhone}>{profile?.phone || user?.email}</Text>
              <Text style={styles.userDistrict}>📍 {profile?.district || 'Daloa Centre'}</Text>
            </View>
          </View>

          <View style={styles.profileActions}>
            <Button
              title="Modifier ma boutique"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/settings/shop')}
              style={{ flex: 1 }}
            />
            <Button
              title="Voir ma vitrine"
              variant="outline"
              size="sm"
              onPress={() => router.push(`/seller/${user?.id}`)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Bannière Partage WhatsApp Statut */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleShareShopWhatsApp}
          style={styles.whatsappCard}
        >
          <View style={styles.whatsappIconBox}>
            <Share2 size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappTitle}>📲 Partager ma boutique sur WhatsApp</Text>
            <Text style={styles.whatsappSub}>
              Mettez votre lien dans votre statut pour que vos clients voient vos articles avec prix nets.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Studio Vendeur & Outils Pro */}
        <Text style={styles.sectionTitle}>Studio Vendeur</Text>
        <Card style={styles.menuCard}>
          <MenuItem
            icon={<Wallet size={20} color={colors.market.primary} />}
            title="Mes Revenus & Portefeuille"
            subtitle="Solde disponible et retraits Mobile Money"
            onPress={() => router.push('/pro/revenue')}
          />
          <MenuItem
            icon={<Layers size={20} color="#F59E0B" />}
            title="Packs d'annonces & Boosts"
            subtitle="Mettre en avant vos annonces sur Daloa"
            onPress={() => router.push('/pro/packs')}
          />
          <MenuItem
            icon={<Sparkles size={20} color="#8B5CF6" />}
            title="Passer Vendeur Pro"
            subtitle="Badge certifié, commission réduite à 2.5%"
            onPress={() => router.push('/pro/become-pro')}
          />
          <MenuItem
            icon={<Bike size={20} color={colors.delivery.primary} />}
            title="Mes Livreurs Affiliés"
            subtitle="Gestion de vos coursiers dédiés"
            onPress={() => router.push('/affiliations')}
            isLast
          />
        </Card>

        {/* Paramètres & Sécurité */}
        <Text style={styles.sectionTitle}>Paramètres du compte</Text>
        <Card style={styles.menuCard}>
          <MenuItem
            icon={<Settings size={20} color={colors.dark.textMuted} />}
            title="Paramètres de retrait (Mobile Money)"
            subtitle="Configurer Wave, Orange, MTN ou Moov"
            onPress={() => router.push('/settings/payout')}
          />
          <MenuItem
            icon={<Shield size={20} color="#10B981" />}
            title="Comment ça marche & Sécurité Escrow"
            subtitle="Protocole anti-fraude et codes OTP"
            onPress={() => router.push('/legal/how-it-works')}
          />
          <MenuItem
            icon={<HelpCircle size={20} color={colors.dark.textMuted} />}
            title="Centre d'aide & Assistance"
            subtitle="FAQ et contact équipe support Daloa"
            onPress={() => router.push('/legal/help')}
          />
          <MenuItem
            icon={<FileText size={20} color={colors.dark.textMuted} />}
            title="Conditions Générales & Confidentialité"
            subtitle="Mentions légales de DaloaMarket"
            onPress={() => router.push('/legal/terms')}
            isLast
          />
        </Card>

        {/* Bouton Déconnexion */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <LogOut size={18} color={colors.status.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>DaloaMarket v1.0.0 • ElmasCore © 2026</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        Haptics.lightImpact();
        onPress();
      }}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    >
      <View style={styles.menuIconContainer}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={colors.dark.textDim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  profileCard: {
    padding: spacing[4],
    gap: spacing[4],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  userName: {
    color: colors.dark.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  userPhone: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  userDistrict: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: spacing[3],
  },
  whatsappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: radii['2xl'],
    padding: spacing[4],
    gap: spacing[3],
  },
  whatsappIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappTitle: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  whatsappSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 15,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing[2],
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.dark.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  menuSub: {
    color: colors.dark.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: spacing[3],
    borderRadius: radii.xl,
    gap: spacing[2],
    marginTop: spacing[3],
  },
  logoutText: {
    color: colors.status.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  versionText: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  unauthIconBox: {
    width: 80,
    height: 80,
    borderRadius: radii['2xl'],
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  unauthTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  unauthSubtitle: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing[6],
  },
  unauthBtnRow: {
    width: '100%',
  },
});
