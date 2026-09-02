import React from 'react';
import { View, ScrollView, StyleSheet, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, Avatar, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  Store,
  Wallet,
  Settings,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Share2,
  Bike,
  Sparkles,
  Heart,
  HelpCircle,
  MapPin,
  Phone,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { ProfileGuestView } from '../../src/components/profile/ProfileGuestView';

interface MenuItemProps {
  icon: React.ReactNode;
  tint: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
}

function MenuItem({ icon, tint, label, sublabel, onPress }: MenuItemProps) {
  return (
    <AppPressable
      onPress={onPress}
      style={styles.menuItem}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: tint }]}>{icon}</View>
      <View style={styles.menuTexts}>
        <AppText variant="bodyStrong" color={colors.text.body}>
          {label}
        </AppText>
        {sublabel && (
          <AppText variant="caption" color={colors.text.subtle}>
            {sublabel}
          </AppText>
        )}
      </View>
      <ChevronRight size={16} color={colors.text.subtle} />
    </AppPressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useAccent();
  const { user, profile, logout, isAuthenticated } = useAuth();

  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());

  const handleShareShopWhatsApp = async () => {
    Haptics.success();
    const slug = profile?.shop_slug || user?.id?.slice(0, 8) || '';
    const shareUrl = `https://daloamarket.com/shop/${slug}`;
    const message = `Découvrez tous mes articles sur ma boutique DaloaMarket !\n${shareUrl}\nPaiement sécurisé par séquestre et livraison partout à Daloa.`;
    await Share.share({
      message,
      title: profile?.shop_name || 'Ma boutique DaloaMarket',
    }).catch(() => {});
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Haptics.lightImpact();
          router.replace('/(tabs)' as any);
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return <ProfileGuestView />;
  }

  const displayName = profile?.full_name || 'Commerçant Daloa';
  const displayContact = profile?.phone || user.email || '';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero gradient ── */}
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing[4] }]}
        >
          <View style={styles.avatarBorder}>
            <Avatar
              name={displayName}
              uri={profile?.avatar_url || undefined}
              size={64}
            />
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <AppText variant="h2" color={colors.text.inverse} numberOfLines={1} style={styles.heroName}>
                {displayName}
              </AppText>
              {isPro && (
                <View style={[styles.proBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Sparkles size={10} color={colors.text.inverse} />
                  <AppText variant="overline" color={colors.text.inverse}>
                    PRO
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.heroMeta}>
              {displayContact ? (
                <View style={styles.heroMetaRow}>
                  <Phone size={11} color={accent[100]} />
                  <AppText variant="caption" color={accent[100]} numberOfLines={1}>
                    {displayContact}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.heroMetaRow}>
                <MapPin size={11} color={accent[100]} />
                <AppText variant="caption" color={accent[100]}>
                  {profile?.district || 'Daloa'}
                </AppText>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Partage boutique ── */}
        <AppPressable
          onPress={handleShareShopWhatsApp}
          style={styles.shareCard}
          accessibilityLabel="Partager ma boutique"
        >
          <View style={[styles.shareIconCircle, { backgroundColor: colors.bg.surface }]}>
            <Share2 size={18} color={colors.status.successDark} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color={colors.status.successDark}>
              Partager ma boutique
            </AppText>
            <AppText variant="caption" color={colors.status.success}>
              Diffusez votre catalogue sur WhatsApp
            </AppText>
          </View>
          <ChevronRight size={16} color={colors.status.successDark} />
        </AppPressable>

        {/* ── Espace vendeur ── */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionTitle}>
          Espace vendeur & boutique
        </AppText>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Store size={18} color={accent[600]} />}
            tint={accent[50]}
            label="Publier une nouvelle annonce"
            sublabel="Créer et mettre en vente un article"
            onPress={() => router.push('/listing/create' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Wallet size={18} color={colors.status.infoDark} />}
            tint={colors.status.infoLight}
            label="Mes ventes & commandes"
            sublabel="Suivi des commandes reçues"
            onPress={() => router.push('/(tabs)/orders' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Sparkles size={18} color={accent[600]} />}
            tint={accent[50]}
            label="Mes revenus & retraits"
            sublabel="Solde et historique des paiements"
            onPress={() => router.push('/pro/revenue' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Settings size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="Paramètres de la boutique"
            onPress={() => router.push('/settings/shop' as any)}
          />
        </View>

        {/* ── Mon compte ── */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionTitle}>
          Mon compte
        </AppText>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Heart size={18} color={accent[600]} />}
            tint={accent[50]}
            label="Mes favoris"
            onPress={() => router.push('/favorites' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Settings size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="Paramètres du compte"
            onPress={() => router.push('/settings' as any)}
          />
        </View>

        {/* ── Services partenaires ── */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionTitle}>
          Services partenaires
        </AppText>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Bike size={18} color={colors.status.successDark} />}
            tint={colors.status.successLight}
            label="Devenir livreur DaloaDelivery"
            sublabel="Rejoignez le réseau de coursiers"
            onPress={() => router.push('/affiliations' as any)}
          />
        </View>

        {/* ── Informations & support ── */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionTitle}>
          Informations & support
        </AppText>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<HelpCircle size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="Aide & support"
            onPress={() => router.push('/legal/help' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<HelpCircle size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="Questions fréquentes (FAQ)"
            onPress={() => router.push('/legal/faq' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Store size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="À propos de DaloaMarket"
            onPress={() => router.push('/legal/about' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<FileText size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="Conditions générales (CGU)"
            onPress={() => router.push('/legal/terms' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Shield size={18} color={colors.grey[600]} />}
            tint={colors.bg.subtle}
            label="Garantie séquestre & litiges"
            onPress={() => router.push('/legal/how-it-works' as any)}
          />
        </View>

        {/* ── Déconnexion ── */}
        <AppPressable
          onPress={handleLogout}
          haptic="none"
          style={styles.logoutBtn}
          accessibilityLabel="Déconnexion"
        >
          <LogOut size={16} color={colors.status.error} />
          <AppText variant="label" color={colors.status.error}>
            Déconnexion
          </AppText>
        </AppPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  // ── Hero ──
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroInfo: {
    flex: 1,
    gap: spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroName: {
    flexShrink: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  heroMeta: {
    gap: 3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // ── Share card ──
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
    borderRadius: radii.xl,
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    overflow: 'hidden',
  },
  shareIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
  // ── Menus ──
  sectionTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[4] + 4,
  },
  menuGroup: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginHorizontal: spacing[4],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuTexts: {
    flex: 1,
    gap: 1,
  },
  sep: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 36 + spacing[3] * 2,
  },
  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    borderRadius: radii.xl,
    height: 46,
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    overflow: 'hidden',
  },
});
