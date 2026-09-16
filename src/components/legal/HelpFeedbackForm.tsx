import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, Button, AppText, AppPressable, useAccent, typography, showAlert } from '@daloa/ui';
import {
  MessageSquare, Lightbulb, CircleAlert, CircleCheck, Zap,
  Star, Send, Lock, LogIn, UserPlus,
} from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { supabase } from '@daloa/api';

type FeedbackType = 'general' | 'feature' | 'bug' | 'pricing';
type TopicKey =
  | 'prefers_native_app'
  | 'pricing_too_high'
  | 'visibility_issue'
  | 'search_navigation_issue'
  | 'payment_security_issue'
  | 'slow_response_issue'
  | 'complex_checkout_issue';

interface HelpFeedbackFormProps {
  userId?: string | null;
  onSubmitted?: () => void;
}

const FEEDBACK_TYPES = [
  { id: 'general' as const, label: 'Général', Icon: MessageSquare },
  { id: 'feature' as const, label: 'Suggestion', Icon: Lightbulb },
  { id: 'bug' as const, label: 'Problème', Icon: CircleAlert },
  { id: 'pricing' as const, label: 'Tarifs', Icon: Zap },
];

const TOPICS: { id: TopicKey; label: string }[] = [
  { id: 'prefers_native_app', label: 'App mobile' },
  { id: 'pricing_too_high', label: 'Tarifs trop élevés' },
  { id: 'visibility_issue', label: 'Visibilité' },
  { id: 'search_navigation_issue', label: 'Recherche & filtres' },
  { id: 'payment_security_issue', label: 'Paiement sécurisé' },
  { id: 'slow_response_issue', label: 'Lenteur réponses' },
  { id: 'complex_checkout_issue', label: 'Processus commande' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Très insatisfait',
  2: 'Peu satisfait',
  3: 'Moyen',
  4: 'Satisfait',
  5: 'Très satisfait !',
};

export function HelpFeedbackForm({ userId, onSubmitted }: HelpFeedbackFormProps) {
  const accent = useAccent();
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [comment, setComment] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<Record<TopicKey, boolean>>({
    prefers_native_app: false,
    pricing_too_high: false,
    visibility_issue: false,
    search_navigation_issue: false,
    payment_security_issue: false,
    slow_response_issue: false,
    complex_checkout_issue: false,
  });
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Message d'erreur affiché en ligne : showAlert() est un no-op sur react-native-web,
  // donc toute erreur passée par Alert était invisible sur la version web de l'app.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleTopic = (id: TopicKey) => {
    Haptics.selection();
    setErrorMsg(null);
    setSelectedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      Haptics.warning?.();
      setErrorMsg('Vous devez être connecté pour envoyer un avis.');
      return;
    }

    const hasTopics = Object.values(selectedTopics).some(Boolean);
    if (!comment.trim() && !hasTopics && rating === null) {
      setErrorMsg('Attribuez une note, choisissez un thème ou rédigez un commentaire avant d’envoyer.');
      return;
    }

    setErrorMsg(null);
    setIsSending(true);
    try {
      const typeLabel = FEEDBACK_TYPES.find((t) => t.id === selectedType)?.label || 'Avis';
      const ratingText = rating ? `[Note: ${rating}/5 - ${RATING_LABELS[rating]}]` : '';
      const typeText = `[Type: ${typeLabel}]`;
      const topicLabels = TOPICS.filter((t) => selectedTopics[t.id]).map((t) => t.label);
      const topicsText = topicLabels.length > 0 ? `[Thèmes: ${topicLabels.join(', ')}]` : '';

      const prefixes = [typeText, ratingText, topicsText].filter(Boolean).join(' ');
      const cleanComment = comment.trim();
      const finalContent = cleanComment ? (prefixes ? `${prefixes}\n${cleanComment}` : cleanComment) : prefixes;

      const payload = {
        user_id: userId,
        source: 'mobile',
        dislikes: finalContent,
        recommended_features: finalContent,
        prefers_native_app: selectedTopics.prefers_native_app,
        pricing_too_high: selectedTopics.pricing_too_high,
        visibility_issue: selectedTopics.visibility_issue,
        search_navigation_issue: selectedTopics.search_navigation_issue,
        payment_security_issue: selectedTopics.payment_security_issue,
        slow_response_issue: selectedTopics.slow_response_issue,
        complex_checkout_issue: selectedTopics.complex_checkout_issue,
      };

      const { error } = await supabase.from('user_feedbacks').insert(payload);
      if (error) throw error;

      Haptics.success();
      setIsSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      console.error('Erreur retour feedback:', err);
      // 42501 = violation RLS : la session n'est plus valide côté Supabase.
      const isAuthError = err?.code === '42501' || /row-level security|JWT|not authenticated/i.test(err?.message || '');
      setErrorMsg(
        isAuthError
          ? 'Votre session a expiré. Reconnectez-vous puis renvoyez votre avis.'
          : err?.message || 'Impossible d’enregistrer votre retour pour le moment.'
      );
    } finally {
      setIsSending(false);
    }
  };

  /* ── VISITEUR NON CONNECTÉ : on n'affiche pas un formulaire inutilisable ── */
  if (!userId) {
    return (
      <View style={styles.gateCard}>
        <View style={[styles.gateIconBox, { backgroundColor: accent[50] }]}>
          <Lock size={24} color={accent.DEFAULT} />
        </View>
        <AppText variant="subtitle" style={styles.bold} center>Connectez-vous pour donner votre avis</AppText>
        <AppText variant="caption" color={colors.text.muted} center style={styles.gateSub}>
          Votre avis est rattaché à votre compte pour que l’équipe DaloaMarket puisse vous répondre
          directement ici.
        </AppText>
        <View style={styles.gateBtns}>
          <Button
            title="Se connecter"
            variant="market"
            size="md"
            leftIcon={<LogIn size={16} color={colors.text.inverse} />}
            onPress={() => router.push('/auth/login' as any)}
            fullWidth
          />
          <Button
            title="Créer un compte"
            variant="soft"
            size="md"
            leftIcon={<UserPlus size={16} color={accent[700]} />}
            onPress={() => router.push('/auth/register' as any)}
            fullWidth
          />
        </View>
      </View>
    );
  }

  if (isSubmitted) {
    return (
      <View style={styles.successCard}>
        <View style={styles.successIconBox}>
          <CircleCheck size={36} color="#059669" strokeWidth={2.2} />
        </View>
        <AppText variant="subtitle" style={styles.bold} center>Merci pour votre retour !</AppText>
        <AppText variant="caption" color={colors.text.muted} center style={styles.successSub}>
          Vos remarques nous aident à améliorer DaloaMarket. Notre équipe lit et prend en compte chaque avis.
        </AppText>
        <Button
          title="Envoyer un autre avis"
          variant="outline"
          size="sm"
          onPress={() => {
            setIsSubmitted(false);
            setComment('');
            setRating(null);
            setErrorMsg(null);
          }}
          style={styles.newFeedbackBtn}
        />
      </View>
    );
  }

  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <AppText variant="subtitle" style={styles.bold}>Donnez votre avis</AppText>
        <AppText variant="caption" color={colors.text.muted}>
          Aidez-nous à améliorer DaloaMarket avec vos suggestions.
        </AppText>
      </View>

      {/* Catégories */}
      <View style={styles.section}>
        <AppText variant="caption" color={colors.text.body} style={styles.label}>Catégorie</AppText>
        <View style={styles.typeRow}>
          {FEEDBACK_TYPES.map(({ id, label, Icon }) => {
            const active = selectedType === id;
            return (
              <AppPressable
                key={id}
                onPress={() => { Haptics.selection(); setSelectedType(id); }}
                style={[styles.typeBtn, active && styles.typeBtnActive]}
              >
                <Icon size={14} color={active ? accent.DEFAULT : colors.text.muted} />
                <AppText variant="caption" style={[styles.typeBtnText, active && { color: accent.DEFAULT, fontFamily: typography.families.bold }]}>
                  {label}
                </AppText>
              </AppPressable>
            );
          })}
        </View>
      </View>

      {/* Évaluation étoiles */}
      <View style={styles.ratingCard}>
        <AppText variant="caption" color={colors.text.body} style={styles.labelCenter}>
          Satisfaction globale
        </AppText>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = (rating ?? 0) >= star;
            return (
              <AppPressable
                key={star}
                onPress={() => { Haptics.selection(); setRating(star); setErrorMsg(null); }}
                style={styles.starBtn}
              >
                <Star size={28} color={filled ? '#F59E0B' : colors.border.DEFAULT} fill={filled ? '#F59E0B' : 'none'} />
              </AppPressable>
            );
          })}
        </View>
        {rating && (
          <AppText variant="caption" style={styles.ratingLabel}>{RATING_LABELS[rating]}</AppText>
        )}
      </View>

      {/* Thématiques */}
      <View style={styles.section}>
        <AppText variant="caption" color={colors.text.body} style={styles.label}>
          Thèmes concernés (facultatif)
        </AppText>
        <View style={styles.topicWrap}>
          {TOPICS.map((topic) => {
            const active = selectedTopics[topic.id];
            return (
              <AppPressable
                key={topic.id}
                onPress={() => toggleTopic(topic.id)}
                style={[styles.topicChip, active && styles.topicChipActive]}
              >
                <AppText variant="caption" style={[styles.topicChipText, active && styles.topicChipTextActive]}>
                  {topic.label}
                </AppText>
              </AppPressable>
            );
          })}
        </View>
      </View>

      {/* Zone de texte */}
      <View style={styles.section}>
        <View style={styles.textHeader}>
          <AppText variant="caption" color={colors.text.body} style={styles.label}>Détails &amp; suggestions</AppText>
          <AppText variant="caption" color={colors.text.subtle}>{comment.length}/500</AppText>
        </View>
        <TextInput
          style={styles.textarea}
          placeholder="Décrivez votre expérience ou ce qu'on peut améliorer..."
          placeholderTextColor={colors.grey[400]}
          multiline
          numberOfLines={4}
          maxLength={500}
          value={comment}
          onChangeText={(t) => { setComment(t); if (errorMsg) setErrorMsg(null); }}
        />
      </View>

      {/* Message d'erreur en ligne (visible sur web ET natif) */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <CircleAlert size={14} color="#B91C1C" />
          <AppText variant="caption" color="#991B1B" style={styles.errorText}>{errorMsg}</AppText>
        </View>
      ) : null}

      <Button
        title={isSending ? 'Envoi en cours...' : 'Envoyer mon avis'}
        variant="primary"
        size="md"
        leftIcon={<Send size={16} color={colors.text.inverse} />}
        onPress={handleSubmit}
        disabled={isSending}
        style={styles.submitBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.bg.surface, borderRadius: radii['2xl'], padding: spacing[4],
    borderWidth: 1, borderColor: colors.border.subtle, gap: 14,
  },
  formHeader: { gap: 2 },
  bold: { fontFamily: typography.families.bold },
  section: { gap: 6 },
  label: { fontSize: 11, fontFamily: typography.families.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelCenter: { fontSize: 11, fontFamily: typography.families.bold, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  typeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeBtn: {
    flex: 1, minWidth: '22%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, height: 36, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.DEFAULT,
  },
  typeBtnActive: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  typeBtnText: { fontSize: 11, color: colors.text.muted },
  ratingCard: {
    backgroundColor: colors.bg.subtle, borderRadius: radii.xl, padding: spacing[3],
    alignItems: 'center', gap: 6,
  },
  starsRow: { flexDirection: 'row', gap: spacing[2] },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 12, fontFamily: typography.families.bold, color: colors.text.DEFAULT },
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.full,
    borderWidth: 1, borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.DEFAULT,
  },
  topicChipActive: { backgroundColor: colors.grey[900], borderColor: colors.grey[900] },
  topicChipText: { fontSize: 11, color: colors.text.body },
  topicChipTextActive: { color: colors.text.inverse, fontFamily: typography.families.semibold },
  textHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textarea: {
    borderWidth: 1, borderColor: colors.border.DEFAULT, borderRadius: radii.xl,
    padding: spacing[3], fontSize: 13, minHeight: 90, textAlignVertical: 'top',
    backgroundColor: colors.bg.DEFAULT,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', borderRadius: radii.lg,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
  },
  errorText: { flex: 1, fontSize: 11, lineHeight: 16 },
  submitBtn: { marginTop: spacing[1] },
  gateCard: {
    backgroundColor: colors.bg.surface, borderRadius: radii['2xl'], padding: spacing[5],
    alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle, gap: spacing[2],
  },
  gateIconBox: {
    width: 52, height: 52, borderRadius: radii.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing[1],
  },
  gateSub: { maxWidth: 280, lineHeight: 18 },
  gateBtns: { width: '100%', gap: spacing[2], marginTop: spacing[3] },
  successCard: {
    backgroundColor: colors.bg.surface, borderRadius: radii['2xl'], padding: spacing[6],
    alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle, gap: spacing[2],
  },
  successIconBox: {
    width: 60, height: 60, borderRadius: radii.full, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing[1],
  },
  successSub: { maxWidth: 260, lineHeight: 18 },
  newFeedbackBtn: { marginTop: spacing[3] },
});
