import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { FileText, ArrowLeft, Building2 } from 'lucide-react-native';
import { LEGAL_NOTICE_DATA } from '../../src/legal/legal-notice-data';

export default function LegalNoticeScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[accent[500], accent[600], accent[700]]}
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
              Informations Officielles
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Mentions Légales
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <Building2 size={18} color={accent[100]} />
          </View>
        </View>

        <View style={styles.metaBadge}>
          <AppText variant="caption" color={colors.text.inverse} style={styles.metaText}>
            Éditeur officiel • Daloa / Abidjan, Côte d'Ivoire
          </AppText>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {LEGAL_NOTICE_DATA.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.groupTitle}>
                {group.title}
              </AppText>
              <View style={styles.itemsWrap}>
                {group.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <AppText variant="caption" color={colors.text.muted} style={styles.itemLabel}>
                      {item.label}
                    </AppText>
                    <AppText variant="caption" color={colors.text.DEFAULT} style={styles.itemValue}>
                      {item.value}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          ))}
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
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
    marginHorizontal: spacing[3],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBadge: {
    marginTop: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 11,
  },
  scrollContent: {
    padding: spacing[4],
  },
  contentWrap: {
    gap: spacing[3],
  },
  groupCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  groupTitle: {
    marginBottom: spacing[2],
    fontSize: 14,
    fontWeight: '700',
  },
  itemsWrap: {
    gap: spacing[2],
  },
  itemRow: {
    paddingVertical: spacing[1],
  },
  itemLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  itemValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 1,
  },
});
