import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { colors, radii, spacing, Button, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Truck, Store, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { formatFCFA, Haptics } from '@daloa/utils';

interface CheckoutStepReceptionProps {
  photoUrl: string;
  title: string;
  variantLabel?: string | null;
  activePrice: number;
  quantity: number;
  deliveryMode: 'delivery' | 'pickup';
  onDeliveryModeChange: (mode: 'delivery' | 'pickup') => void;
  onNext: () => void;
}

export function CheckoutStepReception({
  photoUrl,
  title,
  variantLabel,
  activePrice,
  quantity,
  deliveryMode,
  onDeliveryModeChange,
  onNext,
}: CheckoutStepReceptionProps) {
  const accent = useAccent();

  const handleSelectMode = (mode: 'delivery' | 'pickup') => {
    Haptics.selection();
    onDeliveryModeChange(mode);
  };

  return (
    <View style={styles.container}>
      {/* 1. Carte détaillée de l'article commandé */}
      <View style={styles.articleCard}>
        <Image source={{ uri: photoUrl }} style={styles.articleThumb} resizeMode="cover" />
        <View style={styles.articleInfo}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.articleTitle}>
            {title}
          </AppText>
          {variantLabel ? (
            <View style={styles.variantBadge}>
              <AppText variant="caption" color={accent[700]}>
                Variante : {variantLabel}
              </AppText>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <AppText variant="body" color={colors.text.muted}>
              {formatFCFA(activePrice)} × {quantity}
            </AppText>
            <AppText variant="title" color={accent[600]} style={styles.totalPrice}>
              {formatFCFA(activePrice * quantity)}
            </AppText>
          </View>
        </View>
      </View>

      {/* 2. Choix du mode de réception */}
      <View style={styles.sectionBox}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          Choisissez votre mode de réception
        </AppText>

        <View style={styles.modesList}>
          <AppPressable
            haptic="selection"
            onPress={() => handleSelectMode('delivery')}
            style={[
              styles.modeCard,
              deliveryMode === 'delivery' && {
                borderColor: accent.DEFAULT,
                backgroundColor: accent[50],
              },
            ]}
          >
            <View style={[styles.modeIconBox, { backgroundColor: accent[100] }]}>
              <Truck size={22} color={accent.DEFAULT} />
            </View>
            <View style={styles.flex1}>
              <View style={styles.modeTitleRow}>
                <AppText variant="bodyStrong" color={deliveryMode === 'delivery' ? accent[700] : colors.text.DEFAULT}>
                  Livraison à domicile
                </AppText>
                <View style={styles.recomBadge}>
                  <AppText variant="overline" color={accent[700]}>EXPÉDITION EXPRESS</AppText>
                </View>
              </View>
              <AppText variant="caption" color={colors.text.muted} style={styles.modeDesc}>
                Prise en charge par un coursier DaloaDelivery et remis à votre porte
              </AppText>
            </View>
            <View style={[styles.radioCircle, deliveryMode === 'delivery' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
              {deliveryMode === 'delivery' && <View style={styles.radioDot} />}
            </View>
          </AppPressable>

          <AppPressable
            haptic="selection"
            onPress={() => handleSelectMode('pickup')}
            style={[
              styles.modeCard,
              deliveryMode === 'pickup' && {
                borderColor: accent.DEFAULT,
                backgroundColor: accent[50],
              },
            ]}
          >
            <View style={[styles.modeIconBox, { backgroundColor: colors.status.successLight }]}>
              <Store size={22} color={colors.status.successDark} />
            </View>
            <View style={styles.flex1}>
              <View style={styles.modeTitleRow}>
                <AppText variant="bodyStrong" color={deliveryMode === 'pickup' ? accent[700] : colors.text.DEFAULT}>
                  Retrait en boutique
                </AppText>
                <View style={styles.freeBadge}>
                  <AppText variant="overline" color={colors.status.successDark}>GRATUIT</AppText>
                </View>
              </View>
              <AppText variant="caption" color={colors.text.muted} style={styles.modeDesc}>
                Click & Collect directement au magasin du commerçant à Daloa (0 FCFA)
              </AppText>
            </View>
            <View style={[styles.radioCircle, deliveryMode === 'pickup' && { borderColor: accent.DEFAULT, backgroundColor: accent.DEFAULT }]}>
              {deliveryMode === 'pickup' && <View style={styles.radioDot} />}
            </View>
          </AppPressable>
        </View>
      </View>

      {/* Garantie acheteur */}
      <View style={styles.guaranteeBox}>
        <ShieldCheck size={16} color={colors.status.successDark} />
        <AppText variant="caption" color={colors.text.body} style={styles.flex1}>
          Toutes les commandes bénéficient de la protection DaloaMarket contre les litiges.
        </AppText>
      </View>

      {/* Bouton vers étape 2 */}
      <Button
        title={deliveryMode === 'delivery' ? 'Continuer vers la livraison' : 'Continuer vers le retrait'}
        variant="primary"
        size="lg"
        rightIcon={<ArrowRight size={18} color={colors.text.inverse} />}
        onPress={() => {
          Haptics.lightImpact();
          onNext();
        }}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: spacing[3],
    alignItems: 'center',
  },
  articleThumb: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
  },
  articleInfo: {
    flex: 1,
    gap: 4,
  },
  articleTitle: {
    lineHeight: 19,
  },
  variantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 2,
  },
  totalPrice: {
    fontWeight: '700',
  },
  sectionBox: {
    gap: spacing[2],
  },
  sectionTitle: {
    marginBottom: 4,
  },
  modesList: {
    gap: spacing[2],
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    gap: spacing[3],
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  recomBadge: {
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  freeBadge: {
    backgroundColor: colors.status.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  modeDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: '#FFF',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing[3],
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  flex1: {
    flex: 1,
  },
});
