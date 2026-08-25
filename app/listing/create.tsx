import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { listingsService } from '@daloa/api';
import { MARKET_CATEGORIES, DALOA_DISTRICTS, LISTING_CONDITIONS } from '@daloa/config';
import { ListingVariant } from '@daloa/types';
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
import { Camera, Plus, Trash2, X, Sparkles, Check } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';

export default function ListingCreateScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('fashion');
  const [selectedCondition, setSelectedCondition] = useState<string>('like_new');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Lobia');
  const [stock, setStock] = useState('1');
  const [acceptsDelivery, setAcceptsDelivery] = useState(true);
  const [variants, setVariants] = useState<Array<{ label: string; price?: number; stock: number }>>([]);
  const [newVariantLabel, setNewVariantLabel] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickImage = async () => {
    Haptics.lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 6)); // max 6 photos
    }
  };

  const handleRemovePhoto = (index: number) => {
    Haptics.lightImpact();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    if (!newVariantLabel.trim()) return;
    Haptics.selection();
    setVariants((prev) => [
      ...prev,
      { label: newVariantLabel.trim(), stock: 1 },
    ]);
    setNewVariantLabel('');
  };

  const handleRemoveVariant = (index: number) => {
    Haptics.lightImpact();
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (!title.trim() || title.length < 3) {
      setErrorMsg('Veuillez renseigner un titre valide (min 3 caractères)');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Veuillez renseigner un prix valide en FCFA');
      return;
    }
    if (photos.length === 0) {
      setErrorMsg('Veuillez ajouter au moins une photo de votre article');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // 1. Upload des photos vers Supabase Storage
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
        } else {
          const url = await listingsService.uploadImage(uri);
          uploadedUrls.push(url);
        }
      }

      // 2. Création de l'annonce
      const created = await listingsService.createListing(user.id, {
        title: title.trim(),
        description: description.trim() || title.trim(),
        price: numPrice,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        category: selectedCategory,
        condition: selectedCondition as any,
        district: selectedDistrict,
        stock: parseInt(stock, 10) || 1,
        accepts_delivery: acceptsDelivery,
        photos: uploadedUrls,
        variants: variants.map((v) => ({
          label: v.label,
          price: v.price || numPrice,
          stock: v.stock || 1,
          active: true,
        })),
      });

      Haptics.success();
      router.replace(`/listing/${created.id}`);
    } catch (err: any) {
      console.error('Erreur publication:', err);
      setErrorMsg(err.message || 'Échec de la publication de l’annonce');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Déposer une annonce" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Photos Sélecteur */}
        <Text style={styles.sectionTitle}>Photos de l’article ({photos.length}/6)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoBox}>
              <Image source={{ uri }} style={styles.photoImage} />
              <TouchableOpacity
                onPress={() => handleRemovePhoto(index)}
                style={styles.photoDeleteBtn}
              >
                <X size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 6 && (
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.8}
              style={styles.addPhotoBtn}
            >
              <Camera size={26} color={colors.market.primary} />
              <Text style={styles.addPhotoText}>Ajouter</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Titre & Description */}
        <Input
          label="Titre de l'annonce *"
          placeholder="Ex: iPhone 13 Pro 128 Go Bleu Pacifique"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description détaillée"
          placeholder="Précisez l'état, les accessoires fournis, la garantie..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          inputStyle={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        {/* Prix */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Prix de vente (FCFA) *"
              placeholder="Ex: 25000"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing[2] }}>
            <Input
              label="Prix d'origine (Optionnel)"
              placeholder="Ex: 35000"
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="number-pad"
              helperText="Pour afficher une remise"
            />
          </View>
        </View>

        {/* Catégorie */}
        <Text style={styles.sectionTitle}>Catégorie *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {MARKET_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* État du produit */}
        <Text style={styles.sectionTitle}>État de l'article *</Text>
        <View style={styles.chipsGrid}>
          {LISTING_CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond.id}
              onPress={() => setSelectedCondition(cond.id)}
              style={[styles.chip, selectedCondition === cond.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCondition === cond.id && styles.chipTextActive]}>
                {cond.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quartier à Daloa */}
        <Text style={styles.sectionTitle}>Quartier où se trouve l'article (Daloa) *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {DALOA_DISTRICTS.slice(0, 20).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDistrict(d)}
              style={[styles.chip, selectedDistrict === d && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedDistrict === d && styles.chipTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Variantes (Tailles / Couleurs) */}
        <Card style={styles.variantsCard}>
          <Text style={styles.variantsTitle}>Options & Variantes (Couleurs, Tailles...)</Text>
          <View style={styles.variantInputRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Ex: Taille XL ou Noir"
                value={newVariantLabel}
                onChangeText={setNewVariantLabel}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <TouchableOpacity onPress={handleAddVariant} style={styles.addVariantBtn}>
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {variants.length > 0 && (
            <View style={styles.variantsList}>
              {variants.map((v, i) => (
                <View key={i} style={styles.variantTag}>
                  <Text style={styles.variantTagText}>{v.label}</Text>
                  <TouchableOpacity onPress={() => handleRemoveVariant(i)}>
                    <X size={14} color={colors.dark.textDim} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Livraison éligible */}
        <View style={styles.deliverySwitchCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliverySwitchTitle}>Accepter la livraison par DaloaDelivery</Text>
            <Text style={styles.deliverySwitchSub}>
              Un coursier partenaire récupérera le colis chez vous après paiement sécurisé.
            </Text>
          </View>
          <Switch
            value={acceptsDelivery}
            onValueChange={setAcceptsDelivery}
            trackColor={{ false: colors.dark.surfaceRaised, true: colors.market.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {errorMsg && <Text style={styles.errorBanner}>{errorMsg}</Text>}

        {/* Bouton de Publication */}
        <Button
          title="Publier mon annonce"
          variant="market"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit}
          style={styles.submitBtn}
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
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  photosScroll: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  photoBox: {
    width: 90,
    height: 90,
    borderRadius: radii.xl,
    marginRight: spacing[2],
    position: 'relative',
    backgroundColor: colors.dark.surfaceRaised,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: radii.xl,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radii.full,
    padding: 3,
  },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  addPhotoText: {
    color: colors.market.primary,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  chip: {
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  chipActive: {
    backgroundColor: colors.market.primary,
    borderColor: colors.market.primary,
  },
  chipText: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  variantsCard: {
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  variantsTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  variantInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addVariantBtn: {
    width: 50,
    height: 50,
    borderRadius: radii.xl,
    backgroundColor: colors.market.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  variantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.lg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
  },
  variantTagText: {
    color: colors.dark.text,
    fontSize: typography.sizes.xs,
  },
  deliverySwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  deliverySwitchTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  deliverySwitchSub: {
    color: colors.dark.textDim,
    fontSize: 11,
    marginTop: 2,
    maxWidth: 240,
  },
  errorBanner: {
    color: colors.status.error,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  submitBtn: {
    marginTop: spacing[2],
  },
});
