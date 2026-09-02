import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ListingCard, colors, radii, spacing, AppText, useAccent } from '@daloa/ui';
import { CheckCircle2, AlertCircle, ShieldCheck, Truck, Package, Sparkles } from 'lucide-react-native';

interface StepSummaryPreviewProps {
  photos: string[];
  title: string;
  price: string;
  originalPrice: string;
  district: string;
  stock: number;
  acceptsDelivery: boolean;
}

const FALLBACK_PHOTO =
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=320';

export const StepSummaryPreview: React.FC<StepSummaryPreviewProps> = ({
  photos,
  title,
  price,
  originalPrice,
  district,
  stock,
  acceptsDelivery,
}) => {
  const accent = useAccent();
  const numPrice = parseFloat(price) || 0;
  const numOriginal = originalPrice ? parseFloat(originalPrice) : null;

  const hasPhotos = photos.length > 0;
  const hasTitle = title.trim().length >= 3;
  const hasPrice = numPrice > 0;

  const checkItems = [
    {
      ok: hasPhotos,
      icon: hasPhotos ? CheckCircle2 : AlertCircle,
      color: hasPhotos ? colors.status.successDark : colors.status.warning,
      bg: hasPhotos ? colors.status.successLight : colors.status.warningLight,
      label: hasPhotos ? `${photos.length} photo${photos.length > 1 ? 's' : ''} ajoutée${photos.length > 1 ? 's' : ''}` : "Aucune photo — ajoutez-en à l'étape 1",
    },
    {
      ok: hasTitle,
      icon: hasTitle ? CheckCircle2 : AlertCircle,
      color: hasTitle ? colors.status.successDark : colors.status.warning,
      bg: hasTitle ? colors.status.successLight : colors.status.warningLight,
      label: hasTitle ? `"${title.trim().slice(0, 40)}${title.trim().length > 40 ? '…' : ''}"` : "Titre manquant — requis à l'étape 1",
    },
    {
      ok: true,
      icon: ShieldCheck,
      color: colors.status.successDark,
      bg: colors.status.successLight,
      label: 'Paiement protégé par le séquestre DaloaMarket',
    },
    {
      ok: true,
      icon: acceptsDelivery ? Truck : Package,
      color: acceptsDelivery ? accent[700] : colors.text.muted,
      bg: acceptsDelivery ? accent[50] : colors.bg.subtle,
      label: acceptsDelivery
        ? 'Livraison DaloaDelivery activée'
        : 'Retrait en main propre uniquement',
    },
    {
      ok: stock >= 1,
      icon: Sparkles,
      color: accent[700],
      bg: accent[50],
      label: `${stock} unité${stock > 1 ? 's' : ''} en stock`,
    },
  ];

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">Aperçu de votre annonce</AppText>
      <AppText variant="caption" color={colors.text.muted}>
        Voici comment les acheteurs de Daloa verront votre article.
      </AppText>

      {/* Aperçu live plein-largeur */}
      <View style={styles.previewWrap}>
        <ListingCard
          listing={{
            id: 'preview-id',
            title: title || 'Titre de votre produit',
            price: numPrice,
            originalPrice: numOriginal,
            photos: hasPhotos ? photos : [FALLBACK_PHOTO],
            district: district || 'Daloa',
            createdAt: new Date().toISOString(),
            stock,
          }}
          onPress={() => {}}
        />
      </View>

      {/* Checklist dynamique */}
      <View style={styles.checklistCard}>
        <AppText variant="label" color={colors.text.body}>Récapitulatif</AppText>
        <View style={styles.checkList}>
          {checkItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <View key={i} style={styles.checkItem}>
                <View style={[styles.checkIconBg, { backgroundColor: item.bg }]}>
                  <Icon size={14} color={item.color} strokeWidth={2.2} />
                </View>
                <AppText
                  variant="caption"
                  color={item.ok ? colors.text.body : colors.status.warning}
                  style={styles.checkLabel}
                  numberOfLines={2}
                >
                  {item.label}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      {/* Notice publication */}
      <View style={[styles.noticeCard, { backgroundColor: accent[50], borderColor: accent[100] }]}>
        <AppText variant="caption" color={accent[700]}>
          Après publication, votre annonce sera visible immédiatement dans le catalogue DaloaMarket.
          Vous pourrez la modifier ou la supprimer à tout moment depuis votre profil.
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    gap: spacing[3],
  },
  previewWrap: {
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  checklistCard: {
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.xl,
    padding: spacing[3],
    gap: spacing[2],
  },
  checkList: {
    gap: spacing[2],
    marginTop: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  checkIconBg: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkLabel: {
    flex: 1,
  },
  noticeCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
