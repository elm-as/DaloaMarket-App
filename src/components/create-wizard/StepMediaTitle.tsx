import React from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Trash2 } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';

interface StepMediaTitleProps {
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
}

export const StepMediaTitle: React.FC<StepMediaTitleProps> = ({
  photos,
  setPhotos,
  title,
  setTitle,
  description,
  setDescription,
}) => {
  const accent = useAccent();

  const handlePickPhoto = async () => {
    Haptics.lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const handleRemove = (index: number) => {
    Haptics.lightImpact();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {/* Photos */}
      <View style={styles.sectionHeader}>
        <AppText variant="label" color={colors.text.body}>Photos de l'article</AppText>
        <AppText variant="overline" color={colors.text.subtle}>{photos.length}/5</AppText>
      </View>

      {/* Photo principale — grande zone */}
      {photos.length === 0 ? (
        <AppPressable
          onPress={handlePickPhoto}
          style={[styles.mainPhotoZone, { borderColor: accent[300], backgroundColor: accent[50] }]}
          accessibilityLabel="Ajouter des photos"
        >
          <View style={[styles.mainCameraCircle, { backgroundColor: accent.DEFAULT }]}>
            <Camera size={26} color={colors.text.inverse} />
          </View>
          <AppText variant="bodyStrong" color={accent[700]}>Ajouter des photos</AppText>
          <AppText variant="caption" color={accent[500]}>
            JPG, PNG — max 5 photos
          </AppText>
        </AppPressable>
      ) : (
        <View style={styles.photosRow}>
          {/* Grande vignette principale */}
          <View style={styles.mainThumbWrapper}>
            <Image source={{ uri: photos[0] }} style={styles.mainThumb} contentFit="cover" transition={150} />
            <View style={[styles.mainBadge, { backgroundColor: accent.DEFAULT }]}>
              <AppText variant="overline" color={colors.text.inverse}>Principale</AppText>
            </View>
            <AppPressable haptic="none" onPress={() => handleRemove(0)} style={styles.removeBtn}>
              <Trash2 size={12} color={colors.text.inverse} />
            </AppPressable>
          </View>

          {/* Petites vignettes + bouton ajout */}
          <View style={styles.thumbsCol}>
            {photos.slice(1).map((uri, i) => (
              <View key={i + 1} style={styles.smallThumbWrapper}>
                <Image source={{ uri }} style={styles.smallThumb} contentFit="cover" transition={150} />
                <AppPressable haptic="none" onPress={() => handleRemove(i + 1)} style={styles.removeBtn}>
                  <Trash2 size={10} color={colors.text.inverse} />
                </AppPressable>
              </View>
            ))}
            {photos.length < 5 && (
              <AppPressable
                onPress={handlePickPhoto}
                style={[styles.addSmallBtn, { borderColor: accent[200], backgroundColor: accent[50] }]}
              >
                <Camera size={16} color={accent.DEFAULT} />
              </AppPressable>
            )}
          </View>
        </View>
      )}

      {/* Tip */}
      <View style={[styles.tipCard, { backgroundColor: accent[50], borderColor: accent[100] }]}>
        <Camera size={14} color={accent[600]} />
        <AppText variant="caption" color={accent[700]}>
          Photo à la lumière naturelle = 3× plus de vues. Évitez les fonds encombrés.
        </AppText>
      </View>

      {/* Titre */}
      <View style={styles.fieldBox}>
        <View style={styles.labelRow}>
          <AppText variant="label" color={colors.text.body}>
            Titre de l'annonce *
          </AppText>
          <AppText variant="caption" color={colors.text.subtle}>
            {title.length}/80
          </AppText>
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          placeholder="Ex: iPhone 12 Pro Max 128Go Bleu Pacifique"
          placeholderTextColor={colors.text.subtle}
          style={styles.input}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldBox}>
        <AppText variant="label" color={colors.text.body}>
          Description détaillée
        </AppText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Précisez l'état, la provenance, les accessoires inclus..."
          placeholderTextColor={colors.text.subtle}
          style={[styles.input, styles.textArea]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  // ─── Zone photo vide ───
  mainPhotoZone: {
    height: 160,
    borderRadius: radii['2xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  mainCameraCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Zone photos remplies ───
  photosRow: {
    flexDirection: 'row',
    gap: spacing[2],
    height: 160,
  },
  mainThumbWrapper: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  mainThumb: {
    width: '100%',
    height: '100%',
  },
  thumbsCol: {
    width: 72,
    gap: spacing[2],
  },
  smallThumbWrapper: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  smallThumb: {
    width: '100%',
    height: '100%',
  },
  addSmallBtn: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: 'rgba(239,68,68,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Tip ───
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
    marginTop: -4,
  },
  // ─── Champs texte ───
  fieldBox: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    height: 50,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.medium,
    color: colors.text.DEFAULT,
    backgroundColor: colors.grey[50],
  },
  textArea: {
    height: 96,
    paddingTop: spacing[3],
  },
});
