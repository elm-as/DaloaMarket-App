import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { ArrowLeft, ShieldCheck, Rocket, TrendingUp, Lock, Save } from 'lucide-react-native';
import type { PhaseConfig } from '@daloa/api';
import { systemSettingsService } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';
import { usePhase } from '../../src/context/PhaseContext';

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { phaseConfig, savePhaseConfig, isLoading } = usePhase();

  const [form, setForm] = useState<PhaseConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // On repart de la configuration en base dès qu'elle arrive, puis on laisse
  // l'utilisateur éditer localement jusqu'à l'enregistrement.
  useEffect(() => {
    if (!isLoading && form === null) setForm(phaseConfig);
  }, [isLoading, phaseConfig, form]);

  const active = form ?? phaseConfig;
  const isPhase0 = active.phase === 0;
  const patch = (next: Partial<PhaseConfig>) => setForm({ ...active, ...next });

  const applyPreset = (target: 0 | 1) => setForm(systemSettingsService.phasePreset(target));

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePhaseConfig(active);
      Alert.alert(
        'Configuration enregistrée',
        active.phase === 0
          ? 'Phase 0 (Lancement libre) active en temps réel sur le web et le mobile.'
          : 'Phase 1 (Croissance Pro) active en temps réel sur le web et le mobile.'
      );
    } catch (err: any) {
      Alert.alert('Échec', err?.message || 'Erreur lors de la mise à jour de la phase.');
    } finally {
      setSaving(false);
    }
  };

  // ── Accès refusé ─────────────────────────────────────────────────────────
  if (!authLoading && !isAdmin) {
    return (
      <View style={[styles.container, styles.denied, { paddingTop: insets.top + spacing[10] }]}>
        <View style={styles.deniedIcon}>
          <Lock size={26} color={colors.status.errorDark} />
        </View>
        <AppText variant="title" color={colors.text.DEFAULT}>
          Accès réservé
        </AppText>
        <AppText variant="body" color={colors.text.muted} style={styles.deniedText}>
          Cette console est réservée à l’administration de DaloaMarket.
        </AppText>
        <AppPressable onPress={() => router.back()} style={[styles.primaryBtn, { backgroundColor: accent.DEFAULT }]}>
          <AppText variant="bodyStrong" color={colors.text.inverse}>
            Retour
          </AppText>
        </AppPressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <AppPressable onPress={() => router.back()} rippleBorderless style={styles.backBtn} accessibilityLabel="Retour">
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Administration
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Configuration de phase
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <ShieldCheck size={18} color={accent[200]} />
          </View>
        </View>
      </LinearGradient>

      {isLoading && form === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={accent.DEFAULT} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Phase active */}
          <View
            style={[
              styles.banner,
              isPhase0
                ? { backgroundColor: colors.status.successLight, borderColor: colors.status.successBorder }
                : { backgroundColor: colors.status.warningLight, borderColor: colors.status.warningBorder },
            ]}
          >
            <AppText variant="overline" color={isPhase0 ? colors.status.successDark : colors.status.warningDark}>
              Phase active
            </AppText>
            <AppText variant="bodyStrong" color={isPhase0 ? colors.status.successDark : colors.status.warningDark}>
              {isPhase0 ? 'Phase 0 — Lancement libre' : 'Phase 1 — Croissance Pro'}
            </AppText>
            <AppText variant="caption" color={colors.text.muted}>
              {isPhase0
                ? '0 % de commission vendeur, paiement à la livraison ouvert à tous, annonces illimitées.'
                : 'Commission vendeur 3,5 % (2,5 % pour un Pro), paiement en ligne par défaut.'}
            </AppText>
          </View>

          {/* Préréglages */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            Préréglages
          </AppText>
          <View style={styles.presetRow}>
            <AppPressable
              onPress={() => applyPreset(0)}
              style={[
                styles.preset,
                isPhase0 && { borderColor: colors.status.success, backgroundColor: colors.status.successLight },
              ]}
            >
              <Rocket size={18} color={isPhase0 ? colors.status.successDark : colors.text.muted} />
              <AppText variant="bodyStrong" color={isPhase0 ? colors.status.successDark : colors.text.body}>
                Phase 0
              </AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Lancement
              </AppText>
            </AppPressable>

            <AppPressable
              onPress={() => applyPreset(1)}
              style={[
                styles.preset,
                !isPhase0 && { borderColor: colors.status.warning, backgroundColor: colors.status.warningLight },
              ]}
            >
              <TrendingUp size={18} color={!isPhase0 ? colors.status.warningDark : colors.text.muted} />
              <AppText variant="bodyStrong" color={!isPhase0 ? colors.status.warningDark : colors.text.body}>
                Phase 1
              </AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Croissance
              </AppText>
            </AppPressable>
          </View>

          {/* Règles d'accès */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            Règles d’accès
          </AppText>
          <View style={styles.card}>
            <ToggleRow
              title="Paiement à la livraison pour tous"
              hint="Sinon réservé aux vendeurs Pro"
              value={active.allow_cod_for_all}
              onChange={(v) => patch({ allow_cod_for_all: v })}
              accent={accent.DEFAULT}
            />
            <ToggleRow
              title="Retrait en boutique pour tous"
              hint="Autorise le mode « retrait » sans livreur"
              value={active.allow_pickup_for_all}
              onChange={(v) => patch({ allow_pickup_for_all: v })}
              accent={accent.DEFAULT}
            />
            <ToggleRow
              title="Livreurs affiliés pour tous"
              hint="Ouvre le réseau de livreurs à tous les vendeurs"
              value={active.allow_affiliated_deliverers_for_all}
              onChange={(v) => patch({ allow_affiliated_deliverers_for_all: v })}
              accent={accent.DEFAULT}
              isLast
            />
          </View>

          {/* Monétisation */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            Monétisation
          </AppText>
          <View style={styles.card}>
            <ToggleRow
              title="Boost d’annonce"
              value={active.enable_boost}
              onChange={(v) => patch({ enable_boost: v })}
              accent={accent.DEFAULT}
            />
            <ToggleRow
              title="Remontée d’annonce (bump)"
              value={active.enable_bump}
              onChange={(v) => patch({ enable_bump: v })}
              accent={accent.DEFAULT}
            />
            <ToggleRow
              title="Badge Vendeur Pro"
              value={active.enable_seller_badge}
              onChange={(v) => patch({ enable_seller_badge: v })}
              accent={accent.DEFAULT}
              isLast
            />
          </View>

          {/* Paiement par défaut */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            Paiement par défaut au checkout
          </AppText>
          <View style={styles.segment}>
            {(['cod', 'online'] as const).map((mode) => {
              const on = active.default_payment_method === mode;
              return (
                <AppPressable
                  key={mode}
                  onPress={() => patch({ default_payment_method: mode })}
                  style={[styles.segmentItem, on && { backgroundColor: accent.DEFAULT }]}
                >
                  <AppText variant="bodyStrong" color={on ? colors.text.inverse : colors.text.body}>
                    {mode === 'cod' ? 'À la livraison' : 'En ligne'}
                  </AppText>
                </AppPressable>
              );
            })}
          </View>

          {/* Valeurs numériques */}
          <AppText variant="overline" color={colors.text.muted} style={styles.sectionLabel}>
            Plafonds et commission
          </AppText>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabel}>
                <AppText variant="body" color={colors.text.body}>
                  Annonces gratuites
                </AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Vide = illimité
                </AppText>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="∞"
                placeholderTextColor={colors.text.subtle}
                value={active.max_free_listings >= 999999 ? '' : String(active.max_free_listings)}
                onChangeText={(t) =>
                  patch({ max_free_listings: t.trim() === '' ? 999999 : Math.max(0, parseInt(t, 10) || 0) })
                }
              />
            </View>
            <View style={[styles.fieldRow, styles.fieldRowLast]}>
              <View style={styles.fieldLabel}>
                <AppText variant="body" color={colors.text.body}>
                  Commission vendeur
                </AppText>
                <AppText variant="caption" color={colors.text.muted}>
                  Vide = grille par défaut · 0 = gratuit
                </AppText>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="auto"
                placeholderTextColor={colors.text.subtle}
                value={active.seller_fee_override === null ? '' : String(active.seller_fee_override)}
                onChangeText={(t) => {
                  const clean = t.replace(',', '.').trim();
                  patch({ seller_fee_override: clean === '' ? null : Math.max(0, parseFloat(clean) || 0) });
                }}
              />
            </View>
          </View>

          <AppText variant="caption" color={colors.text.muted} style={styles.footnote}>
            La commission s’exprime en taux : 0.035 = 3,5 %. Le changement s’applique
            immédiatement au web et au mobile, sans redéploiement.
          </AppText>

          <AppPressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.primaryBtn, { backgroundColor: accent.DEFAULT }, saving && styles.btnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Save size={17} color={colors.text.inverse} />
                <AppText variant="bodyStrong" color={colors.text.inverse}>
                  Enregistrer la configuration
                </AppText>
              </>
            )}
          </AppPressable>
        </ScrollView>
      )}
    </View>
  );
}

function ToggleRow({
  title,
  hint,
  value,
  onChange,
  accent,
  isLast,
}: {
  title: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, isLast && styles.fieldRowLast]}>
      <View style={styles.fieldLabel}>
        <AppText variant="body" color={colors.text.body}>
          {title}
        </AppText>
        {hint ? (
          <AppText variant="caption" color={colors.text.muted}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border.strong, true: accent }}
        thumbColor={colors.bg.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  hero: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: radii['2xl'],
    borderBottomRightRadius: radii['2xl'],
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTitles: { flex: 1, gap: 2 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing[4], paddingBottom: spacing[12], gap: spacing[2] },
  banner: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: 2,
  },
  sectionLabel: { marginTop: spacing[4], marginBottom: spacing[1] },
  presetRow: { flexDirection: 'row', gap: spacing[3] },
  preset: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.surface,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing[4],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  fieldRowLast: { borderBottomWidth: 0 },
  fieldLabel: { flex: 1, gap: 1 },
  input: {
    minWidth: 90,
    textAlign: 'right',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.subtle,
    color: colors.text.DEFAULT,
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radii.md,
  },
  footnote: { marginTop: spacing[3] },
  primaryBtn: {
    marginTop: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
  },
  btnDisabled: { opacity: 0.6 },
  denied: { alignItems: 'center', paddingHorizontal: spacing[6], gap: spacing[3] },
  deniedIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.errorLight,
  },
  deniedText: { textAlign: 'center' },
});
