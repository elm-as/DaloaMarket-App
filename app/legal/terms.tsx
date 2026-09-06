import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  FileText,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react-native';
import { TERMS_ARTICLES, TERMS_LAST_UPDATE, LegalArticle } from '../../src/legal/terms-data';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TermsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['acceptance', 'service-desc', 'payments-escrow']));

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(new Set(TERMS_ARTICLES.map((a) => a.id)));
  };

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
              Cadre Contractuel Officiel
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Conditions Générales (CGU)
            </AppText>
          </View>
          <View style={styles.iconCircle}>
            <FileText size={18} color={accent[100]} />
          </View>
        </View>

        <View style={styles.metaBadge}>
          <AppText variant="caption" color={colors.text.inverse} style={styles.metaText}>
            Dernière mise à jour : {TERMS_LAST_UPDATE} • Daloa, Côte d'Ivoire
          </AppText>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.actionRow}>
          <AppText variant="caption" color={colors.text.muted}>
            {TERMS_ARTICLES.length} articles contractuels
          </AppText>
          <AppPressable onPress={expandAll} haptic="light">
            <AppText variant="caption" color={accent[600]} style={styles.expandAllText}>
              Tout déplier
            </AppText>
          </AppPressable>
        </View>

        <View style={styles.card}>
          {TERMS_ARTICLES.map((article, idx) => {
            const isExpanded = expandedIds.has(article.id);
            const isLast = idx === TERMS_ARTICLES.length - 1;

            return (
              <View key={article.id} style={[styles.articleWrap, !isLast && styles.articleDivider]}>
                <AppPressable
                  onPress={() => toggleExpand(article.id)}
                  style={styles.articleHeader}
                  haptic="light"
                  accessibilityLabel={`Article ${article.number} ${article.title}`}
                >
                  <View style={styles.numberBadge}>
                    <AppText variant="bodyStrong" color={accent[700]}>
                      {article.number}
                    </AppText>
                  </View>
                  <View style={styles.articleHeaderText}>
                    <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
                      {article.title}
                    </AppText>
                    <AppText variant="caption" color={colors.text.muted} numberOfLines={isExpanded ? undefined : 1}>
                      {article.summary}
                    </AppText>
                  </View>
                  <View style={[styles.chevronWrap, isExpanded && styles.chevronRotated]}>
                    <ChevronDown size={18} color={colors.text.muted} />
                  </View>
                </AppPressable>

                {isExpanded && (
                  <View style={styles.articleBody}>
                    {article.paragraphs.map((p, pIdx) => (
                      <AppText key={pIdx} variant="caption" color={colors.text.DEFAULT} style={styles.paragraph}>
                        {p}
                      </AppText>
                    ))}

                    {article.bullets && article.bullets.length > 0 && (
                      <View style={styles.bulletsWrap}>
                        {article.bullets.map((b, bIdx) => (
                          <View key={bIdx} style={styles.bulletRow}>
                            <CheckCircle2 size={14} color={accent[600]} style={styles.bulletIcon} />
                            <AppText variant="caption" color={colors.text.DEFAULT} style={styles.bulletText}>
                              {b}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    )}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  expandAllText: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  articleWrap: {
    paddingVertical: spacing[2],
  },
  articleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 127, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  articleHeaderText: {
    flex: 1,
  },
  chevronWrap: {
    marginLeft: spacing[2],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  articleBody: {
    paddingLeft: spacing[8],
    paddingRight: spacing[2],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  paragraph: {
    lineHeight: 19,
    color: '#374151',
  },
  bulletsWrap: {
    marginTop: spacing[2],
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: spacing[2],
  },
  bulletText: {
    flex: 1,
    lineHeight: 18,
    color: '#4B5563',
  },
});
