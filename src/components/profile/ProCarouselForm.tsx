import React from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Upload } from 'lucide-react-native';
import {
  colors,
  spacing,
  radii,
  typography,
  AppText,
  AppPressable,
} from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';

export interface CarouselPackItem {
  id: string;
  days: number;
  price: number;
  label: string;
  popular?: boolean;
}

export interface ProListingItem {
  id: string;
  title: string;
  price: number;
  photos: string[];
}

interface ProCarouselFormProps {
  packs: CarouselPackItem[];
  selectedPackIndex: number;
  onSelectPackIndex: (index: number) => void;
  listings: ProListingItem[];
  selectedListingId: string | null;
  onSelectListing: (listing: ProListingItem) => void;
  title: string;
  onChangeTitle: (val: string) => void;
  subtitle: string;
  onChangeSubtitle: (val: string) => void;
  imageUrl: string;
  onPickImage: () => void;
  uploadingImage: boolean;
  submitting: boolean;
  onSubmit: () => void;
  accentColor: string;
  accentBg: string;
}

export const ProCarouselForm: React.FC<ProCarouselFormProps> = ({
  packs,
  selectedPackIndex,
  onSelectPackIndex,
  listings,
  selectedListingId,
  onSelectListing,
  title,
  onChangeTitle,
  subtitle,
  onChangeSubtitle,
  imageUrl,
  onPickImage,
  uploadingImage,
  submitting,
  onSubmit,
  accentColor,
  accentBg,
}) => {
  const currentPack = packs[selectedPackIndex] || packs[0];

  return (
    <View style={styles.card}>
      <AppText variant="h2" style={styles.cardTitle}>
        Créer une affiche carrousel
      </AppText>

      {/* Formules de durée */}
      <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
        Durée de diffusion
      </AppText>
      <View style={styles.packsRow}>
        {packs.map((p, idx) => {
          const active = selectedPackIndex === idx;
          return (
            <AppPressable
              key={p.id}
              haptic="selection"
              onPress={() => onSelectPackIndex(idx)}
              style={[
                styles.packPill,
                active && { borderColor: accentColor, backgroundColor: accentBg },
              ]}
            >
              <AppText
                variant="caption"
                style={
                  active
                    ? { color: accentColor, fontFamily: typography.families.bold }
                    : { color: colors.text.subtle }
                }
              >
                {p.days} jours
              </AppText>
              <AppText
                variant="bodyStrong"
                style={[
                  styles.tabular,
                  active
                    ? { color: accentColor, fontFamily: typography.families.extrabold }
                    : { color: colors.text.body },
                ]}
              >
                {formatFCFA(p.price)}
              </AppText>
            </AppPressable>
          );
        })}
      </View>

      {/* Sélection d'article de la boutique */}
      {listings.length > 0 && (
        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
            Article ciblé (Optionnel — sinon renvoie sur la boutique)
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listingsScroll}
          >
            {listings.map((item) => {
              const isSelected = selectedListingId === item.id;
              return (
                <AppPressable
                  key={item.id}
                  haptic="selection"
                  onPress={() => onSelectListing(item)}
                  style={[
                    styles.listingChip,
                    isSelected && { borderColor: accentColor, backgroundColor: accentBg },
                  ]}
                >
                  <ExpoImage
                    source={{ uri: item.photos[0] }}
                    style={styles.chipPhoto}
                    contentFit="cover"
                  />
                  <View style={styles.chipTexts}>
                    <AppText
                      variant="caption"
                      numberOfLines={1}
                      style={styles.chipTitle}
                    >
                      {item.title}
                    </AppText>
                    <AppText
                      variant="caption"
                      color={colors.primary.DEFAULT}
                      style={[styles.chipPrice, styles.tabular]}
                    >
                      {formatFCFA(item.price)}
                    </AppText>
                  </View>
                </AppPressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Saisie Titre */}
      <View style={styles.fieldGroup}>
        <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
          Titre principal de l'affiche *
        </AppText>
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          placeholder="Ex: Nouveautés Chaussures & Robes"
          placeholderTextColor={colors.text.subtle}
          maxLength={55}
          style={styles.textInput}
        />
      </View>

      {/* Saisie Sous-titre */}
      <View style={styles.fieldGroup}>
        <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
          Sous-titre / Message promo
        </AppText>
        <TextInput
          value={subtitle}
          onChangeText={onChangeSubtitle}
          placeholder="Ex: Jusqu'à -20% cette semaine"
          placeholderTextColor={colors.text.subtle}
          maxLength={90}
          style={styles.textInput}
        />
      </View>

      {/* Upload Visuel 16:9 */}
      <View style={styles.fieldGroup}>
        <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
          Visuel officiel 16:9 *
        </AppText>
        {imageUrl ? (
          <View style={styles.previewBox}>
            <ExpoImage
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.previewContent}>
              <View style={[styles.badgeChip, { backgroundColor: accentColor }]}>
                <AppText variant="overline" color="#FFFFFF">
                  VEDETTE PRO
                </AppText>
              </View>
              <View>
                <AppText variant="bodyStrong" color="#FFFFFF" numberOfLines={1}>
                  {title || 'Titre de l’affiche'}
                </AppText>
                {subtitle ? (
                  <AppText
                    variant="caption"
                    color="rgba(255,255,255,0.85)"
                    numberOfLines={1}
                  >
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
            </View>
            <AppPressable haptic="light" onPress={onPickImage} style={styles.changePicBtn}>
              <AppText variant="caption" color="#FFFFFF">
                Changer
              </AppText>
            </AppPressable>
          </View>
        ) : (
          <AppPressable
            haptic="medium"
            onPress={onPickImage}
            style={styles.uploadPlaceholder}
          >
            {uploadingImage ? (
              <ActivityIndicator color={accentColor} />
            ) : (
              <Upload size={24} color={accentColor} />
            )}
            <AppText
              variant="bodyStrong"
              color={colors.text.body}
              style={styles.uploadText}
            >
              Choisir une affiche depuis la galerie
            </AppText>
            <AppText variant="caption" color={colors.text.subtle}>
              Format recommandé 16:9 ou 2:1
            </AppText>
          </AppPressable>
        )}
      </View>

      {/* Bouton de confirmation */}
      <AppPressable
        haptic="heavy"
        onPress={onSubmit}
        disabled={submitting || uploadingImage}
        style={[
          styles.submitBtn,
          { backgroundColor: accentColor },
          (submitting || uploadingImage) && { opacity: 0.6 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <AppText variant="bodyStrong" color="#FFFFFF">
            Lancer la diffusion ({formatFCFA(currentPack.price)})
          </AppText>
        )}
      </AppPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardTitle: {
    fontSize: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: typography.families.semibold,
  },
  packsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  packPill: {
    flex: 1,
    padding: spacing[2],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    gap: 2,
  },
  listingsScroll: {
    gap: spacing[2],
    paddingVertical: 2,
  },
  listingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: 8,
    width: 170,
  },
  chipPhoto: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
  },
  chipTexts: {
    flex: 1,
  },
  chipTitle: {
    fontSize: 11,
  },
  chipPrice: {
    fontSize: 10,
    fontFamily: typography.families.bold,
  },
  textInput: {
    height: 44,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    fontSize: 13,
    color: colors.text.body,
    backgroundColor: colors.bg.DEFAULT,
  },
  uploadPlaceholder: {
    height: 120,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.bg.subtle,
  },
  uploadText: {
    marginTop: 4,
  },
  previewBox: {
    height: 130,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing[3],
  },
  badgeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  changePicBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  submitBtn: {
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
