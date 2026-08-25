import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { authService } from '@daloa/api';
import { DALOA_DISTRICTS } from '@daloa/config';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Input,
  Button,
  Card,
} from '@daloa/ui';
import { Store, MapPin, Truck } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function ShopSettingsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [shopName, setShopName] = useState(profile?.shop_name || profile?.full_name || '');
  const [shopDescription, setShopDescription] = useState(profile?.shop_description || '');
  const [shopSlug, setShopSlug] = useState(profile?.shop_slug || '');
  const [district, setDistrict] = useState(profile?.district || 'Lobia');
  const [address, setAddress] = useState(profile?.address || '');
  const [cashOnDelivery, setCashOnDelivery] = useState(Boolean(profile?.cash_on_delivery_enabled));

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!shopName.trim()) {
      Alert.alert('Erreur', 'Le nom de boutique est obligatoire.');
      return;
    }

    try {
      setIsSaving(true);
      await authService.updateProfile(user.id, {
        shop_name: shopName.trim(),
        shop_description: shopDescription.trim() || null,
        shop_slug: shopSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || null,
        district,
        address: address.trim() || null,
        cash_on_delivery_enabled: cashOnDelivery,
      });

      await refreshProfile();
      Haptics.success();
      Alert.alert('Succès', 'Paramètres de votre boutique mis à jour.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d’enregistrer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Paramètres Boutique" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Input
          label="Nom public de la boutique *"
          placeholder="Ex: Boutique Élégance Daloa"
          value={shopName}
          onChangeText={setShopName}
        />

        <Input
          label="Identifiant URL boutique (Slug)"
          placeholder="Ex: elegance-daloa"
          value={shopSlug}
          onChangeText={setShopSlug}
          autoCapitalize="none"
          helperText="Lien court : daloamarket.com/shop/votre-slug"
        />

        <Input
          label="Description & Spécialité"
          placeholder="Décrivez votre boutique, vos horaires et vos garanties..."
          value={shopDescription}
          onChangeText={setShopDescription}
          multiline
          numberOfLines={3}
          inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <Input
          label="Quartier principal à Daloa *"
          placeholder="Ex: Lobia, Kennedy, Tazibouo..."
          value={district}
          onChangeText={setDistrict}
        />

        <Input
          label="Adresse physique ou repère boutique"
          placeholder="Ex: Face au grand marché, boutique N°12"
          value={address}
          onChangeText={setAddress}
        />

        {/* Option Paiement à la livraison */}
        <Card style={styles.switchCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Accepter le paiement à la livraison (COD)</Text>
            <Text style={styles.switchSub}>
              Autorise les clients à régler en espèces à la remise du colis par le coursier.
            </Text>
          </View>
          <Switch
            value={cashOnDelivery}
            onValueChange={setCashOnDelivery}
            trackColor={{ false: colors.dark.surfaceRaised, true: colors.market.primary }}
            thumbColor="#FFFFFF"
          />
        </Card>

        <Button
          title="Enregistrer les modifications"
          variant="market"
          size="lg"
          loading={isSaving}
          onPress={handleSave}
          style={{ marginTop: spacing[3] }}
        />

        <View style={{ height: 40 }} />
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
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    marginVertical: spacing[3],
  },
  switchTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  switchSub: {
    color: colors.dark.textDim,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    maxWidth: 240,
  },
});
