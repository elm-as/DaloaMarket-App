import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, typography, Header, Input, Button, Card } from '@daloa/ui';
import { ShieldAlert, Send } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '@daloa/api';

export default function BannedScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAppeal = async () => {
    if (!appealReason.trim()) {
      Alert.alert('Erreur', 'Veuillez expliquer les raisons de votre contestation.');
      return;
    }

    try {
      setIsSubmitting(true);
      await supabase.from('ban_appeals').insert({
        user_id: user?.id || 'anonymous',
        full_name: profile?.full_name || 'Utilisateur',
        phone: profile?.phone || '',
        reason: appealReason.trim(),
        status: 'pending',
      });

      Alert.alert('Demande transmise', 'Votre recours a été envoyé aux administrateurs de DaloaMarket.');
      setAppealReason('');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d’envoyer le recours');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Compte Suspendu" onBack={() => logout()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconBox}>
          <ShieldAlert size={48} color={colors.status.error} />
        </View>

        <Text style={styles.title}>Accès temporairement restreint</Text>
        <Text style={styles.sub}>
          Votre compte a été suspendu pour non-respect des règles de sécurité de la communauté DaloaMarket.
        </Text>

        {profile?.ban_reason && (
          <Card style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>Motif de la suspension :</Text>
            <Text style={styles.reasonText}>{profile.ban_reason}</Text>
          </Card>
        )}

        <Text style={styles.appealTitle}>Contester cette décision</Text>
        <Input
          label="Votre message à la modération *"
          placeholder="Expliquez la situation aux modérateurs..."
          value={appealReason}
          onChangeText={setAppealReason}
          multiline
          numberOfLines={4}
          inputStyle={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        <Button
          title="Envoyer mon recours"
          variant="danger"
          size="lg"
          loading={isSubmitting}
          onPress={handleAppeal}
          leftIcon={<Send size={16} color="#FFFFFF" />}
          style={{ marginTop: spacing[2] }}
        />

        <Button
          title="Se déconnecter"
          variant="secondary"
          size="md"
          onPress={() => logout()}
          style={{ marginTop: spacing[4] }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[4],
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  sub: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing[4],
  },
  reasonCard: {
    width: '100%',
    padding: spacing[4],
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: spacing[4],
  },
  reasonLabel: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  reasonText: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
  },
  appealTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
});
