import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, typography, Header, Card } from '@daloa/ui';
import { Store, CreditCard, Bell, Shield, FileText, ChevronRight } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Paramètres" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <SettingRow
            icon={<Store size={18} color={colors.market.primary} />}
            title="Paramètres de ma boutique"
            onPress={() => router.push('/settings/shop')}
          />
          <SettingRow
            icon={<CreditCard size={18} color="#10B981" />}
            title="Compte de retrait Mobile Money"
            onPress={() => router.push('/settings/payout')}
          />
          <SettingRow
            icon={<Shield size={18} color="#3B82F6" />}
            title="Sécurité & Confidentialité"
            onPress={() => router.push('/legal/privacy')}
            isLast
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, title, onPress, isLast = false }: { icon: React.ReactNode; title: string; onPress: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        Haptics.lightImpact();
        onPress();
      }}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <ChevronRight size={18} color={colors.dark.textDim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: spacing[4],
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.dark.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
});
