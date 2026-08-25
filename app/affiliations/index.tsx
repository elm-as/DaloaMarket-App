import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useAffiliatedDeliverers } from '@daloa/api';
import { colors, radii, spacing, typography, Header, Avatar, Card, Button, EmptyState } from '@daloa/ui';
import { Bike, Plus, PhoneCall } from 'lucide-react-native';

export default function AffiliationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: affiliations } = useAffiliatedDeliverers(user?.id);

  const list = affiliations || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Mes Livreurs Affiliés" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Bike size={24} color={colors.delivery.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Livreurs dédiés à votre boutique</Text>
            <Text style={styles.infoSub}>
              Rattachez vos livreurs de confiance pour qu'ils soient notifiés en priorité lors de vos ventes.
            </Text>
          </View>
        </View>

        {list.length === 0 ? (
          <EmptyState
            icon={<Bike size={32} color={colors.delivery.primary} />}
            title="Aucun livreur affilié"
            description="Associez vos livreurs réguliers à votre boutique DaloaMarket."
          />
        ) : (
          list.map((aff) => {
            const driver = aff.delivery_persons;
            return (
              <Card key={aff.id} style={styles.driverCard}>
                <Avatar uri={driver?.photo_url} name={driver?.name} size={48} />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver?.name || 'Livreur Partenaire'}</Text>
                  <Text style={styles.driverPhone}>{driver?.phone}</Text>
                  <Text style={styles.driverVehicle}>🛵 {driver?.vehicle_type?.toUpperCase()}</Text>
                </View>
              </Card>
            );
          })
        )}
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
    gap: spacing[3],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  infoTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  infoSub: {
    color: colors.dark.textDim,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  driverPhone: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.xs,
  },
  driverVehicle: {
    color: colors.delivery.primary,
    fontSize: 11,
  },
});
