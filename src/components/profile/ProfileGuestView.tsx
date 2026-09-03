import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, AppText, AppPressable, Button, Avatar, useAccent } from '@daloa/ui';
import {
  User,
  LogIn,
  UserPlus,
  Heart,
  Package,
  Store,
  HelpCircle,
  FileText,
  Shield,
  ChevronRight,
  ShieldCheck,
  Truck,
} from 'lucide-react-native';
import { useFavorites } from '../../context/FavoritesContext';

interface MenuItemProps {
  icon: React.ReactNode;
  tint: string;
  label: string;
  sublabel?: string;
  badgeCount?: number;
  onPress: () => void;
}

function MenuItem({ icon, tint, label, sublabel, badgeCount, onPress }: MenuItemProps) {
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
      {badgeCount != null && badgeCount > 0 ? (
        <View style={styles.menuBadge}>
          <AppText variant="caption" color={colors.text.inverse} style={styles.badgeTxt}>
            {badgeCount}
          </AppText>
        </View>
      ) : (
        <ChevronRight size={16} color={colors.text.subtle} />
      )}
    </AppPressable>
  );
}

export const ProfileGuestView: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { favoriteIds } = useFavorites();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── 1. Hero Dégradé identique au profil connecté ── */}
        <LinearGradient
          colors={[accent[400], accent[600], accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing[4] }]}
        >
          <View style={styles.avatarBorder}>
            <Avatar name="Invité" size={64} />
          </View>
          <View style={styles.heroInfo}>
            <AppText variant="h2" color={colors.text.inverse} numberOfLines={1}>
              Bienvenue sur DaloaMarket
            </AppText>
            <AppText variant="caption" color={accent[100]}>
              Connectez-vous pour accéder à toutes les fonctionnalités
            </AppText>
          </View>
        </LinearGradient>

        {/* ── 2. Carte d'action : Connexion & Inscription ── */}
        <View style={styles.authCard}>
          <View style={styles.btnRow}>
            <Button
              title="Se connecter"
              variant="market"
              size="md"
              leftIcon={<LogIn size={15} color={colors.text.inverse} />}
              onPress={() => router.push('/auth/login' as any)}
              style={styles.flex1}
            />
            <Button
              title="Créer un compte"
              variant="soft"
              size="md"
              leftIcon={<UserPlus size={15} color={accent[700]} />}
              onPress={() => router.push('/auth/register' as any)}
              style={styles.flex1}
            />
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <ShieldCheck size={14} color={colors.status.successDark} />
              <AppText variant="caption" color={colors.text.muted}>
                Séquestre Garanti
              </AppText>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Truck size={14} color={accent.DEFAULT} />
              <AppText variant="caption" color={colors.text.muted}>
                Livraison Daloa
              </AppText>
            </View>
          </View>
        </View>

        {/* ── 3. Accès Rapides ── */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionTitle}>
          Accès rapides
        </AppText>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Heart size={18} color={accent[600]} />}
            tint={accent[50]}
            label="Mes favoris"
            sublabel="Articles sauvegardés"
            badgeCount={favoriteIds.size}
            onPress={() => router.push('/favorites' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Package size={18} color={colors.status.infoDark} />}
            tint={colors.status.infoLight}
            label="Mes commandes"
            sublabel="Suivi des achats en cours"
            onPress={() => router.push('/auth/login' as any)}
          />
          <View style={styles.sep} />
          <MenuItem
            icon={<Store size={18} color={accent[600]} />}
            tint={accent[50]}
            label="Vendre sur DaloaMarket"
            sublabel="Ouvrez votre vitrine gratuitement"
            onPress={() => router.push('/auth/login' as any)}
          />
        </View>

        {/* ── 4. Informations & Support (identique au profil connecté) ── */}
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
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
  authCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginHorizontal: spacing[4],
    marginTop: -16,
    padding: spacing[4],
    gap: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flex1: { flex: 1 },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
  },
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
  menuBadge: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  sep: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 36 + spacing[3] * 2,
  },
});

export default ProfileGuestView;
