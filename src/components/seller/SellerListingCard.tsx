import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Edit3, RotateCcw, CheckCircle2, Trash2, Eye } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';

interface SellerListingCardProps {
  item: any;
  onPress: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

/**
 * Carte d'une annonce dans l'écran "Mes annonces" du vendeur.
 * Comprend les informations clés (statut, prix, vues) et la barre d'actions rapides.
 */
export const SellerListingCard: React.FC<SellerListingCardProps> = ({
  item,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const accent = useAccent();
  const isSold = item.status === 'sold';
  const photo = item.photos?.[0];

  return (
    <View style={styles.card}>
      <AppPressable onPress={onPress} style={styles.cardTop}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <AppText variant="caption" color={colors.text.subtle}>Sans photo</AppText>
          </View>
        )}

        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
              {item.title}
            </AppText>
            <View style={[styles.badge, { backgroundColor: isSold ? colors.status.warningLight : colors.status.successLight }]}>
              <AppText variant="overline" color={isSold ? colors.status.warningDark : colors.status.successDark}>
                {isSold ? 'Vendu' : 'En vente'}
              </AppText>
            </View>
          </View>

          <AppText variant="subtitle" color={accent.DEFAULT} style={styles.price}>
            {formatFCFA(item.price)}
          </AppText>

          <View style={styles.metaRow}>
            <AppText variant="caption" color={colors.text.muted}>
              {item.district || 'Daloa'}
            </AppText>
            <AppText variant="caption" color={colors.text.subtle}>·</AppText>
            <View style={styles.viewsWrap}>
              <Eye size={11} color={colors.text.subtle} />
              <AppText variant="caption" color={colors.text.muted}>
                {item.view_count || 0} vues
              </AppText>
            </View>
          </View>
        </View>
      </AppPressable>

      {/* Barre des 3 boutons d'actions vendeur */}
      <View style={styles.cardActions}>
        <AppPressable haptic="light" onPress={onEdit} style={styles.actionBtn}>
          <Edit3 size={14} color={colors.text.body} />
          <AppText variant="caption" color={colors.text.body}>Modifier</AppText>
        </AppPressable>

        <View style={styles.btnDivider} />

        {isSold ? (
          <AppPressable haptic="selection" onPress={onToggleStatus} style={styles.actionBtn}>
            <RotateCcw size={14} color={colors.status.infoDark} />
            <AppText variant="caption" color={colors.status.infoDark}>Remettre en vente</AppText>
          </AppPressable>
        ) : (
          <AppPressable haptic="selection" onPress={onToggleStatus} style={styles.actionBtn}>
            <CheckCircle2 size={14} color={colors.status.warningDark} />
            <AppText variant="caption" color={colors.status.warningDark}>Marquer vendu</AppText>
          </AppPressable>
        )}

        <View style={styles.btnDivider} />

        <AppPressable haptic="selection" onPress={onDelete} style={styles.actionBtn}>
          <Trash2 size={14} color={colors.status.errorDark} />
          <AppText variant="caption" color={colors.status.errorDark}>Supprimer</AppText>
        </AppPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  cardTop: {
    flexDirection: 'row',
    padding: spacing[3],
    gap: spacing[3],
  },
  thumbnail: {
    width: 78,
    height: 78,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.subtle,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  price: {
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.subtle,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[2] + 2,
  },
  btnDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.subtle,
  },
});
