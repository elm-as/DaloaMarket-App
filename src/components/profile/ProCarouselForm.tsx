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
import { Upload, Check, Sparkles, ArrowRight } from 'lucide-react-native';
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
}) => {
  const currentPack = packs[selectedPackIndex] || packs[0];

  return (
    <View style={styles.root}>
      {/* 1. APERÇU EN DIRECT EN TÊTE D'ÉCRAN */}
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <AppText variant="bodyStrong">Aperçu en tête d’accueil</AppText>
          <View style={styles.formatPill}>
            <AppText variant="caption" color="#C2410C" style={styles.formatPillText}>
              Format 16:9
            </AppText>
          </View>
        </View>

        <View style={styles.previewBox}>
          {imageUrl ? (
            <ExpoImage
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : (
            <View style={styles.emptyPreviewBg}>
              <Sparkles size={22} color="#FBBF24" />
              <AppText variant="caption" color="#CBD5E1" center>
                Sélectionnez un article ci-dessous ou choisissez une photo
              </AppText>
            </View>
          )}
          <LinearGradient
            colors={['rgba(15,23,42,0.15)', 'rgba(15,23,42,0.88)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.previewContent}>
            <View style={styles.previewTopRow}>
              <View style={[styles.badgeChip, { backgroundColor: accentColor }]}>
                <AppText variant="overline" color="#FFFFFF" style={styles.badgeText}>
                  VEDETTE PRO
                </AppText>
              </View>
              {imageUrl ? (
                <AppPressable haptic="light" onPress={onPickImage} style={styles.changePicBtn}>
                  <AppText variant="caption" color="#FFFFFF" style={styles.changePicText}>
                    Changer la photo
                  </AppText>
                </AppPressable>
              ) : null}
            </View>

            <View style={styles.previewBottomRow}>
              <View style={styles.flex1}>
                <AppText variant="bodyStrong" color="#FFFFFF" numberOfLines={1} style={styles.previewTitle}>
                  {title || 'Titre de votre affiche promotionnelle'}
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.88)" numberOfLines={1}>
                  {subtitle || 'Sous-titre ou offre spéciale à Daloa'}
                </AppText>
              </View>
              <View style={[styles.ctaPill, { backgroundColor: accentColor }]}>
                <AppText variant="caption" color="#FFFFFF" style={styles.ctaPillText}>
                  Voir
                </AppText>
                <ArrowRight size={11} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 2. FORMULAIRE COMPACT ET FLUIDE */}
      <View style={styles.card}>
        {listings.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText variant="bodyStrong" style={styles.stepTitle}>
              1. Choisir un article à mettre en avant (optionnel)
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
                  >
                    <View
                      style={[
                        styles.listingChip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      <ExpoImage
                        source={{ uri: item.photos[0] }}
                        style={styles.chipPhoto}
                        contentFit="cover"
                      />
                      <View style={styles.chipTexts}>
                        <AppText variant="caption" numberOfLines={1} style={styles.chipTitle}>
                          {item.title}
                        </AppText>
                        <AppText variant="caption" color={colors.primary.DEFAULT} style={[styles.chipPrice, styles.tabular]}>
                          {formatFCFA(item.price)}
                        </AppText>
                      </View>
                    </View>
                  </AppPressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <AppText variant="bodyStrong" style={styles.stepTitle}>
            2. Durée de diffusion
          </AppText>
          <View style={styles.packsRow}>
            {packs.map((p, idx) => {
              const active = selectedPackIndex === idx;
              const perDay = Math.round(p.price / p.days);
              return (
                <AppPressable
                  key={p.id}
                  haptic="selection"
                  onPress={() => onSelectPackIndex(idx)}
                  style={styles.flex1}
                >
                  <View style={[styles.packCard, active ? styles.packSelected : styles.packUnselected]}>
                    <View style={styles.packTopRow}>
                      <AppText variant="caption" color={active ? '#C2410C' : colors.text.subtle} style={styles.packDays}>
                        {p.days} jours
                      </AppText>
                      <View style={[styles.radioCircle, active ? styles.radioActive : styles.radioInactive]}>
                        {active && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </View>
                    <AppText variant="bodyStrong" color={active ? '#C2410C' : colors.text.DEFAULT} style={styles.tabular}>
                      {formatFCFA(p.price)}
                    </AppText>
                    <AppText variant="caption" color={colors.text.muted} style={[styles.perDayText, styles.tabular]}>
                      ~{perDay} F / j
                    </AppText>
                  </View>
                </AppPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
            Titre principal de l'affiche *
          </AppText>
          <TextInput
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Ex: Arrivage Chaussures & Robes"
            placeholderTextColor={colors.text.subtle}
            maxLength={55}
            style={styles.textInput}
          />
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={colors.text.subtle} style={styles.fieldLabel}>
            Sous-titre / Message promo
          </AppText>
          <TextInput
            value={subtitle}
            onChangeText={onChangeSubtitle}
            placeholder="Ex: -20% cette semaine à Tazibouo"
            placeholderTextColor={colors.text.subtle}
            maxLength={90}
            style={styles.textInput}
          />
        </View>

        <AppPressable haptic="medium" onPress={onPickImage} style={styles.uploadBtn}>
          {uploadingImage ? (
            <ActivityIndicator color={accentColor} />
          ) : (
            <Upload size={18} color={accentColor} />
          )}
          <AppText variant="bodyStrong" color={accentColor}>
            {imageUrl ? 'Choisir une autre image 16:9' : 'Choisir une image 16:9 depuis la galerie'}
          </AppText>
        </AppPressable>

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
              Diffuser {currentPack.days} jours · {formatFCFA(currentPack.price)}
            </AppText>
          )}
        </AppPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing[3] },
  previewCard: { backgroundColor: colors.bg.surface, borderRadius: radii['2xl'], padding: spacing[3], gap: spacing[2], borderWidth: 1, borderColor: colors.border.subtle },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formatPill: { backgroundColor: '#FFF4E6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  formatPillText: { fontSize: 10, fontFamily: typography.families.bold },
  previewBox: { height: 148, borderRadius: radii.xl, overflow: 'hidden', position: 'relative', backgroundColor: '#0F172A' },
  emptyPreviewBg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[4], gap: 6 },
  previewContent: { flex: 1, justifyContent: 'space-between', padding: spacing[3] },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  badgeText: { fontSize: 9, fontFamily: typography.families.extrabold },
  changePicBtn: { backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  changePicText: { fontSize: 10, fontFamily: typography.families.bold },
  previewBottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  previewTitle: { fontSize: 15, fontFamily: typography.families.black },
  ctaPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.full },
  ctaPillText: { fontSize: 10.5, fontFamily: typography.families.extrabold },
  card: { backgroundColor: colors.bg.surface, borderRadius: radii['2xl'], padding: spacing[4], gap: spacing[3], borderWidth: 1, borderColor: colors.border.subtle },
  stepTitle: { fontSize: 13 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: typography.families.semibold },
  listingsScroll: { gap: spacing[2], paddingVertical: 2 },
  listingChip: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: radii.xl, gap: 8, width: 176 },
  chipSelected: { backgroundColor: '#FFF4E6', borderWidth: 2, borderColor: '#FF9800' },
  chipUnselected: { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.DEFAULT },
  chipPhoto: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.bg.subtle },
  chipTexts: { flex: 1 },
  chipTitle: { fontSize: 11, fontFamily: typography.families.semibold },
  chipPrice: { fontSize: 10.5, fontFamily: typography.families.bold },
  packsRow: { flexDirection: 'row', gap: spacing[2] },
  packCard: { padding: spacing[2], borderRadius: radii.xl, gap: 2 },
  packSelected: { backgroundColor: '#FFF4E6', borderWidth: 2, borderColor: '#FF9800' },
  packUnselected: { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.DEFAULT },
  packTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packDays: { fontSize: 11, fontFamily: typography.families.bold },
  radioCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: '#FF9800', borderWidth: 1.5, borderColor: '#FF9800' },
  radioInactive: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.border.strong },
  perDayText: { fontSize: 10 },
  textInput: { height: 44, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.DEFAULT, paddingHorizontal: spacing[3], fontSize: 13, color: colors.text.body, backgroundColor: colors.bg.DEFAULT },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: radii.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: '#FDBA74', backgroundColor: '#FFF4E6' },
  submitBtn: { height: 48, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  flex1: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
