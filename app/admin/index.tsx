import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  ShoppingBag,
  Package,
  Flag,
  AlertTriangle,
  Banknote,
  MessageSquare,
  Lightbulb,
  BadgeCheck,
  Truck,
  Bell,
  FileText,
  Rocket,
  Wrench,
  ChevronRight,
  ExternalLink,
  Lock,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { adminService, useSystemSettings, type AdminKpis, type AdminPendingCounts } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';

const WEB_ADMIN = 'https://daloamarket.com';
const DELIVERY_ADMIN = 'https://delivery.daloamarket.com/admin';

/**
 * Console d'administration mobile, rangée comme celle du site : chiffres clés,
 * ce qui attend une action, puis les réglages. Les écrans lourds (litiges,
 * versements, modération) s'ouvrent dans l'admin du site ; la maintenance et la
 * monétisation se règlent ici, pour pouvoir agir depuis le téléphone.
 */
export default function AdminHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: settings } = useSystemSettings();

  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [counts, setCounts] = useState<AdminPendingCounts | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [k, c] = await Promise.allSettled([adminService.getKpis(), adminService.getPendingCounts()]);
    if (k.status === 'fulfilled') setKpis(k.value);
    if (c.status === 'fulfilled') setCounts(c.value);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!authLoading && !isAdmin) {
    return (
      <View style={[styles.container, styles.denied, { paddingTop: insets.top + spacing[10] }]}>
        <View style={styles.deniedIcon}>
          <Lock size={26} color={colors.status.errorDark} />
        </View>
        <AppText variant="title">Accès réservé</AppText>
        <AppText variant="body" color={colors.text.muted} style={styles.center}>
          Cette console est réservée à l’administration de DaloaMarket.
        </AppText>
        <AppPressable onPress={() => router.back()} style={[styles.primaryBtn, { backgroundColor: accent.DEFAULT }]}>
          <AppText variant="bodyStrong" color={colors.text.inverse}>Retour</AppText>
        </AppPressable>
      </View>
    );
  }

  const openWeb = (path: string) => Linking.openURL(path.startsWith('http') ? path : `${WEB_ADMIN}${path}`);

  const todo: { label: string; count: number; icon: LucideIcon; tone: string; path: string }[] = counts
    ? [
        { label: 'Litiges à arbitrer', count: counts.litiges, icon: AlertTriangle, tone: colors.status.error, path: '/admin/litiges' },
        { label: 'Signalements à examiner', count: counts.signalements, icon: Flag, tone: colors.status.warning, path: '/admin/reports' },
        { label: 'Versements en attente', count: counts.payouts_en_attente, icon: Banknote, tone: colors.status.warning, path: '/admin/versements' },
        { label: 'Avis sans réponse', count: counts.avis_sans_reponse, icon: MessageSquare, tone: colors.grey[500], path: '/admin/feedbacks' },
        { label: 'Idées à trier', count: counts.suggestions, icon: Lightbulb, tone: colors.grey[500], path: '/admin/features' },
        { label: 'Pièces livreurs à vérifier', count: counts.kyc_a_verifier, icon: BadgeCheck, tone: colors.grey[500], path: DELIVERY_ADMIN },
      ].filter((t) => t.count > 0)
    : [];

  const manage: { label: string; icon: LucideIcon; path: string }[] = [
    { label: 'Annonces', icon: FileText, path: '/admin/listings' },
    { label: 'Utilisateurs', icon: Users, path: '/admin/users' },
    { label: 'Livraisons', icon: Truck, path: '/admin/livraisons' },
    { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
  ];

  const maintenanceOn = Boolean(settings?.maintenance?.enabled);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing[2] }]}
      >
        <View style={styles.heroRow}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <AppText variant="title" color={colors.text.inverse} style={styles.flex}>
            Administration
          </AppText>
          <ShieldCheck size={20} color={accent[100]} />
        </View>

        {/* Chiffres clés */}
        <View style={styles.kpiGrid}>
          {[
            { label: 'Utilisateurs', value: kpis?.users, icon: Users },
            { label: 'Annonces en ligne', value: kpis?.activeListings, icon: ShoppingBag },
            { label: 'Commandes', value: kpis?.orders, icon: Package },
            { label: 'Signalements', value: kpis?.reports, icon: Flag },
          ].map(({ label, value, icon: Icon }) => (
            <View key={label} style={styles.kpiTile}>
              <Icon size={15} color={accent[100]} />
              <AppText variant="h2" color={colors.text.inverse} style={styles.tnum}>
                {value ?? '…'}
              </AppText>
              <AppText variant="caption" color={accent[50]}>{label}</AppText>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.DEFAULT} />}
      >
        {/* À traiter */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>À traiter</AppText>
        <View style={styles.card}>
          {counts == null ? (
            <AppText variant="caption" color={colors.text.muted} style={styles.cardPad}>Chargement…</AppText>
          ) : todo.length === 0 ? (
            <AppText variant="body" color={colors.text.muted} style={styles.cardPad}>Rien en attente.</AppText>
          ) : (
            todo.map((t, i) => (
              <AppPressable
                key={t.label}
                onPress={() => openWeb(t.path)}
                style={[styles.row, i > 0 && styles.rowBorder]}
                accessibilityLabel={`${t.label} : ${t.count}`}
              >
                <t.icon size={18} color={t.tone} />
                <AppText variant="body" style={styles.flex}>{t.label}</AppText>
                <View style={[styles.countPill, { backgroundColor: t.tone }]}>
                  <AppText variant="caption" color={colors.text.inverse} style={styles.countText}>{t.count}</AppText>
                </View>
                <ExternalLink size={15} color={colors.grey[400]} />
              </AppPressable>
            ))
          )}
        </View>

        {/* Réglages : faisables depuis le téléphone */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>Réglages</AppText>
        <View style={styles.card}>
          <AppPressable onPress={() => router.push('/admin/maintenance' as any)} style={styles.row}>
            <Wrench size={18} color={accent.DEFAULT} />
            <AppText variant="body" style={styles.flex}>Maintenance</AppText>
            <View
              style={[
                styles.statePill,
                maintenanceOn
                  ? { backgroundColor: colors.status.warningLight }
                  : { backgroundColor: colors.status.successLight },
              ]}
            >
              <AppText variant="caption" color={maintenanceOn ? colors.status.warningDark : colors.status.successDark}>
                {maintenanceOn ? 'Activée' : 'Site ouvert'}
              </AppText>
            </View>
            <ChevronRight size={16} color={colors.grey[400]} />
          </AppPressable>
          <AppPressable onPress={() => router.push('/admin/monetisation' as any)} style={[styles.row, styles.rowBorder]}>
            <Rocket size={18} color={accent.DEFAULT} />
            <AppText variant="body" style={styles.flex}>Monétisation</AppText>
            <ChevronRight size={16} color={colors.grey[400]} />
          </AppPressable>
        </View>

        {/* Le reste de l'admin, sur le site */}
        <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>Gérer sur le site</AppText>
        <View style={styles.manageGrid}>
          {manage.map(({ label, icon: Icon, path }) => (
            <AppPressable key={label} onPress={() => openWeb(path)} style={styles.manageTile} accessibilityLabel={label}>
              <View style={[styles.manageIcon, { backgroundColor: accent[50] }]}>
                <Icon size={18} color={accent.DEFAULT} />
              </View>
              <AppText variant="label" numberOfLines={1}>{label}</AppText>
            </AppPressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  tnum: { fontVariant: ['tabular-nums'] },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[4] },
  kpiTile: {
    width: '48.5%',
    gap: 2,
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scroll: { padding: spacing[4] },
  sectionLabel: { marginTop: spacing[2], marginBottom: spacing[2], marginLeft: spacing[1] },
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  cardPad: { padding: spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border.DEFAULT },
  countPill: { minWidth: 24, paddingHorizontal: 6, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: typography.families.bold },
  statePill: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radii.full },
  manageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  manageTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  manageIcon: { width: 34, height: 34, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  denied: { alignItems: 'center', paddingHorizontal: spacing[6], gap: spacing[3] },
  deniedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.status.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: { marginTop: spacing[2], paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radii.lg },
});
