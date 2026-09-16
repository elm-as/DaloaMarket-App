import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, AppText, useAccent, typography } from '@daloa/ui';
import {
  MessageSquare, Star, CircleCheck, Clock,
} from 'lucide-react-native';

export interface UserFeedbackItem {
  id: string;
  dislikes: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  source?: string | null;
}

interface UserFeedbacksListProps {
  feedbacks: UserFeedbackItem[];
}

function parseFeedbackText(raw: string | null) {
  const text = raw || '';
  const ratingMatch = text.match(/\[Note:\s*(\d)\s*\/\s*5/i);
  const typeMatch = text.match(/\[Type:\s*([^\]]+)\]/i);
  const topicsMatch = text.match(/\[Thèmes:\s*([^\]]+)\]/i);
  const body = text.replace(/\[(Type|Note|Thèmes):[^\]]*\]/gi, '').trim();
  return {
    rating: ratingMatch ? Number(ratingMatch[1]) : null,
    type: typeMatch ? typeMatch[1].trim() : null,
    topics: topicsMatch ? topicsMatch[1].split(',').map((t) => t.trim()).filter(Boolean) : [],
    body,
  };
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

export function UserFeedbacksList({ feedbacks }: UserFeedbacksListProps) {
  const accent = useAccent();

  if (!feedbacks || feedbacks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconBox, { backgroundColor: accent[50] }]}>
          <MessageSquare size={18} color={accent.DEFAULT} />
        </View>
        <View style={styles.sectionHeaderText}>
          <AppText variant="subtitle" style={styles.bold}>
            Vos avis ({feedbacks.length})
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Historique de vos retours et réponses de l'équipe
          </AppText>
        </View>
      </View>

      <View style={styles.list}>
        {feedbacks.map((item) => {
          const parsed = parseFeedbackText(item.dislikes);
          const isAnswered = Boolean(item.admin_reply);
          const creationDate = formatDate(item.created_at);
          const replyDate = item.replied_at ? formatDate(item.replied_at) : '';

          return (
            <View key={item.id} style={styles.card}>
              {/* Entête avec métadonnées et statut */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  {parsed.type && (
                    <View style={styles.typeBadge}>
                      <AppText variant="caption" style={styles.typeBadgeText}>
                        {parsed.type}
                      </AppText>
                    </View>
                  )}
                  {parsed.rating !== null && (
                    <View style={styles.ratingBadge}>
                      <Star size={11} color="#F59E0B" fill="#F59E0B" />
                      <AppText variant="caption" style={styles.ratingText}>
                        {parsed.rating}/5
                      </AppText>
                    </View>
                  )}
                </View>

                {/* Statut */}
                {isAnswered ? (
                  <View style={styles.statusAnswered}>
                    <CircleCheck size={11} color="#059669" strokeWidth={2.5} />
                    <AppText variant="caption" style={styles.statusAnsweredText}>
                      Répondu
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.statusPending}>
                    <Clock size={11} color="#D97706" />
                    <AppText variant="caption" style={styles.statusPendingText}>
                      En attente
                    </AppText>
                  </View>
                )}
              </View>

              {/* Contenu de l'avis utilisateur */}
              <View style={styles.userContentBox}>
                <View style={styles.userMetaRow}>
                  <AppText variant="caption" style={styles.userMetaTitle}>
                    Votre avis
                  </AppText>
                  {creationDate ? (
                    <AppText variant="caption" color={colors.text.subtle} style={styles.dateText}>
                      {creationDate}
                    </AppText>
                  ) : null}
                </View>

                {parsed.body ? (
                  <AppText variant="body" color={colors.text.DEFAULT} style={styles.userBody}>
                    « {parsed.body} »
                  </AppText>
                ) : (
                  <AppText variant="caption" color={colors.text.muted} style={styles.italic}>
                    Avis enregistré
                  </AppText>
                )}

                {/* Thèmes concernés */}
                {parsed.topics.length > 0 && (
                  <View style={styles.topicsRow}>
                    {parsed.topics.map((t) => (
                      <View key={t} style={styles.topicPill}>
                        <AppText variant="caption" style={styles.topicPillText}>
                          {t}
                        </AppText>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Réponse de l'équipe (si répondu) */}
              {isAnswered ? (
                <View style={styles.replyBox}>
                  <View style={styles.replyHeader}>
                    <View style={styles.replyBrand}>
                      <View style={styles.teamDot} />
                      <AppText variant="caption" style={styles.replyTeamName}>
                        Équipe DaloaMarket
                      </AppText>
                    </View>
                    {replyDate ? (
                      <AppText variant="caption" style={styles.replyDateText}>
                        {replyDate}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="caption" color="#451A03" style={styles.replyBody}>
                    {item.admin_reply}
                  </AppText>
                </View>
              ) : (
                <View style={styles.pendingNotice}>
                  <Clock size={13} color="#B45309" />
                  <AppText variant="caption" color="#92400E" style={styles.pendingNoticeText}>
                    Avis bien reçu. Notre équipe prépare une réponse pour vous ici-même.
                  </AppText>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: { width: 34, height: 34, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  sectionHeaderText: { flex: 1, gap: 1 },
  bold: { fontFamily: typography.families.bold },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.bg.surface, borderRadius: radii['2xl'], padding: spacing[4],
    borderWidth: 1, borderColor: colors.border.subtle, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.md,
    backgroundColor: colors.bg.subtle, borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  typeBadgeText: { fontSize: 10, fontFamily: typography.families.bold, color: colors.text.body },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: radii.md, backgroundColor: '#FEF3C7',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  ratingText: { fontSize: 10, fontFamily: typography.families.bold, color: '#92400E' },
  statusAnswered: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: radii.full, backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  statusAnsweredText: { fontSize: 10, fontFamily: typography.families.bold, color: '#065F46' },
  statusPending: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: radii.full, backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  statusPendingText: { fontSize: 10, fontFamily: typography.families.bold, color: '#92400E' },
  userContentBox: {
    backgroundColor: colors.bg.subtle, borderRadius: radii.xl, padding: spacing[3],
    gap: 6,
  },
  userMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userMetaTitle: { fontSize: 10, fontFamily: typography.families.bold, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text.muted },
  dateText: { fontSize: 10 },
  userBody: { fontSize: 12, lineHeight: 18, fontFamily: typography.families.medium },
  italic: { fontStyle: 'italic', fontSize: 11 },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  topicPill: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.sm,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border.subtle,
  },
  topicPillText: { fontSize: 10, color: colors.text.muted },
  replyBox: {
    backgroundColor: '#FFFBEB', borderRadius: radii.xl, padding: spacing[3],
    borderWidth: 1, borderColor: '#FDE68A', gap: 6,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamDot: { width: 6, height: 6, borderRadius: radii.full, backgroundColor: '#D97706' },
  replyTeamName: { fontSize: 11, fontFamily: typography.families.bold, color: '#92400E' },
  replyDateText: { fontSize: 10, fontFamily: typography.families.semibold, color: '#B45309' },
  replyBody: { fontSize: 12, lineHeight: 18 },
  pendingNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB',
    paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radii.lg,
    borderWidth: 1, borderColor: '#FEF3C7',
  },
  pendingNoticeText: { fontSize: 11, flex: 1 },
});
