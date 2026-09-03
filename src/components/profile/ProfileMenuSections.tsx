import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Wallet,
  CreditCard,
  Heart,
  Settings,
  Truck,
  HelpCircle,
  FileText,
  Shield,
  Store,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, radii, AppText, AppPressable, useAccent } from '@daloa/ui';

interface ProfileMenuSectionsProps {
  onOpenRevenue: () => void;
  onOpenPayoutSettings: () => void;
  onOpenFavorites: () => void;
  onOpenAccountSettings: () => void;
  onJoinDelivery: () => void;
  onOpenHelp: () => void;
  onOpenFaq: () => void;
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenDisputes: () => void;
  onLogout: () => void;
}

interface MenuItemRowProps {
  icon: React.ReactNode;
  tint: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  isLast?: boolean;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({
  icon,
  tint,
  label,
  sublabel,
  onPress,
  isLast = false,
}) => {
  return (
    <>
      <AppPressable
        onPress={onPress}
        style={styles.menuRow}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={[styles.iconCircle, { backgroundColor: tint }]}>{icon}</View>
        <View style={styles.menuTexts}>
          <AppText variant="bodyStrong" color={colors.text.body} style={styles.menuLabel}>
            {label}
          </AppText>
          {sublabel ? (
            <AppText variant="caption" color={colors.text.subtle} style={styles.menuSublabel}>
              {sublabel}
            </AppText>
          ) : null}
        </View>
        <ChevronRight size={16} color={colors.text.subtle} />
      </AppPressable>
      {!isLast && <View style={styles.separator} />}
    </>
  );
};

export const ProfileMenuSections: React.FC<ProfileMenuSectionsProps> = ({
  onOpenRevenue,
  onOpenPayoutSettings,
  onOpenFavorites,
  onOpenAccountSettings,
  onJoinDelivery,
  onOpenHelp,
  onOpenFaq,
  onOpenAbout,
  onOpenTerms,
  onOpenDisputes,
  onLogout,
}) => {
  const accent = useAccent();

  return (
    <View style={styles.container}>
      {/* ── Section 1 : Mon compte & Finances ── */}
      <AppText variant="overline" color={colors.text.muted} style={styles.sectionHeader}>
        MON COMPTE & FINANCES
      </AppText>
      <View style={styles.cardGroup}>
        <MenuItemRow
          icon={<Wallet size={17} color={colors.status.infoDark} />}
          tint={colors.status.infoLight}
          label="Mes revenus & retraits"
          sublabel="Solde et historique des versements"
          onPress={onOpenRevenue}
        />
        <MenuItemRow
          icon={<CreditCard size={17} color={colors.status.successDark} />}
          tint={colors.status.successLight}
          label="Coordonnées de retrait"
          sublabel="Wave, Orange Money, MTN MoMo, Moov"
          onPress={onOpenPayoutSettings}
        />
        <MenuItemRow
          icon={<Heart size={17} color={accent[600]} />}
          tint={accent[50]}
          label="Mes favoris"
          sublabel="Articles sauvegardés"
          onPress={onOpenFavorites}
        />
        <MenuItemRow
          icon={<Settings size={17} color={colors.grey[600]} />}
          tint={colors.bg.subtle}
          label="Paramètres du compte"
          sublabel="Sécurité et préférences"
          onPress={onOpenAccountSettings}
          isLast
        />
      </View>

      {/* ── Section 2 : Réseau Partenaires ── */}
      <AppText variant="overline" color={colors.text.muted} style={styles.sectionHeader}>
        RÉSEAU PARTENAIRES
      </AppText>
      <View style={styles.cardGroup}>
        <MenuItemRow
          icon={<Truck size={17} color={colors.status.successDark} />}
          tint={colors.status.successLight}
          label="Rejoindre DaloaDelivery"
          sublabel="Postuler en tant que coursier indépendant"
          onPress={onJoinDelivery}
          isLast
        />
      </View>

      {/* ── Section 3 : Assistance & Légal ── */}
      <AppText variant="overline" color={colors.text.muted} style={styles.sectionHeader}>
        ASSISTANCE & LÉGAL
      </AppText>
      <View style={styles.cardGroup}>
        <MenuItemRow
          icon={<HelpCircle size={17} color={colors.grey[600]} />}
          tint={colors.bg.subtle}
          label="Aide & support"
          onPress={onOpenHelp}
        />
        <MenuItemRow
          icon={<HelpCircle size={17} color={colors.grey[600]} />}
          tint={colors.bg.subtle}
          label="Questions fréquentes (FAQ)"
          onPress={onOpenFaq}
        />
        <MenuItemRow
          icon={<Store size={17} color={colors.grey[600]} />}
          tint={colors.bg.subtle}
          label="À propos de DaloaMarket"
          onPress={onOpenAbout}
        />
        <MenuItemRow
          icon={<FileText size={17} color={colors.grey[600]} />}
          tint={colors.bg.subtle}
          label="Conditions générales (CGU)"
          onPress={onOpenTerms}
        />
        <MenuItemRow
          icon={<Shield size={17} color={colors.grey[600]} />}
          tint={colors.bg.subtle}
          label="Garantie séquestre & litiges"
          onPress={onOpenDisputes}
          isLast
        />
      </View>

      {/* ── Bouton Déconnexion ── */}
      <AppPressable
        onPress={onLogout}
        style={styles.logoutBtn}
        accessibilityLabel="Déconnexion"
      >
        <LogOut size={16} color={colors.status.error} />
        <AppText variant="label" color={colors.status.error} style={styles.logoutText}>
          Déconnexion du compte
        </AppText>
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  sectionHeader: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  cardGroup: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    gap: spacing[3],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTexts: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  menuSublabel: {
    fontSize: 11,
    color: colors.text.subtle,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing[3] + 32 + spacing[3],
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: spacing[3],
    borderRadius: radii.xl,
    marginTop: spacing[2],
  },
  logoutText: {
    fontWeight: '800',
    fontSize: 13,
  },
});
