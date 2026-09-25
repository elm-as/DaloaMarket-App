import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wrench } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, Button, useAccent, showAlert } from '@daloa/ui';
import { systemSettingsService, useSystemSettings, DEFAULT_MAINTENANCE, type MaintenanceConfig } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';

/**
 * Maintenance du site et des apps, réglable depuis le téléphone. Les admins
 * continuent de naviguer pendant la maintenance : c'est ici qu'on la coupe.
 */
export default function AdminMaintenanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { data: settings } = useSystemSettings();

  const [form, setForm] = useState<MaintenanceConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && form === null) setForm(settings.maintenance);
  }, [settings, form]);

  const current = form ?? settings?.maintenance ?? DEFAULT_MAINTENANCE;
  const patch = (next: Partial<MaintenanceConfig>) => setForm({ ...current, ...next });

  const save = async () => {
    setSaving(true);
    try {
      await systemSettingsService.saveMaintenance({
        ...current,
        message: current.message.trim() || DEFAULT_MAINTENANCE.message,
        expected_reopening: current.expected_reopening?.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      showAlert(
        'Enregistré',
        current.enabled
          ? 'La maintenance est active sur le site et les apps. Les admins gardent l’accès.'
          : 'La maintenance est coupée : le site et les apps sont ouverts.'
      );
    } catch (err: any) {
      showAlert('Échec', err?.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  // Réservé aux admins : sinon retour à la console (qui affiche « Accès réservé »).
  if (!isAdmin) return <Redirect href={'/admin' as any} />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            Maintenance
          </AppText>
          <Wrench size={20} color={accent[100]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing[8] }]}>
        <View
          style={[
            styles.card,
            current.enabled
              ? { borderColor: colors.status.warningBorder, backgroundColor: colors.status.warningLight }
              : { borderColor: colors.status.successBorder, backgroundColor: colors.status.successLight },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <AppText variant="bodyStrong" color={current.enabled ? colors.status.warningDark : colors.status.successDark}>
                {current.enabled ? 'Maintenance activée' : 'Site et apps ouverts'}
              </AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Les visiteurs voient l’écran de maintenance ; les admins continuent de naviguer.
              </AppText>
            </View>
            <Switch
              value={current.enabled}
              onValueChange={(v) => patch({ enabled: v })}
              trackColor={{ false: colors.grey[300], true: accent.DEFAULT }}
              thumbColor={colors.bg.surface}
            />
          </View>
        </View>

        <AppText variant="label" style={styles.fieldLabel}>Message affiché</AppText>
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          maxLength={400}
          value={current.message}
          onChangeText={(t) => patch({ message: t })}
          placeholder={DEFAULT_MAINTENANCE.message}
          placeholderTextColor={colors.text.subtle}
          textAlignVertical="top"
        />

        <AppText variant="label" style={styles.fieldLabel}>Réouverture prévue (facultatif)</AppText>
        <TextInput
          style={styles.input}
          value={current.expected_reopening ?? ''}
          onChangeText={(t) => patch({ expected_reopening: t })}
          placeholder="AAAA-MM-JJTHH:MM, ex. 2026-09-27T08:00"
          placeholderTextColor={colors.text.subtle}
          autoCapitalize="none"
        />

        <Button
          title="Enregistrer"
          variant="market"
          size="lg"
          loading={saving}
          onPress={save}
          fullWidth
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
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
  scroll: { padding: spacing[4] },
  card: { borderWidth: 1, borderRadius: radii.xl, padding: spacing[4], marginBottom: spacing[4] },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  fieldLabel: { marginBottom: spacing[1], marginTop: spacing[2] },
  input: {
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    color: colors.text.DEFAULT,
  },
  multiline: { minHeight: 110 },
  saveBtn: { marginTop: spacing[6] },
});
