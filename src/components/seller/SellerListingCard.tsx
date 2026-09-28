import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Pencil, RotateCcw, CheckCircle2, Trash2, Eye, Zap, ShoppingBag, MapPin } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent, typography } from '@daloa/ui';
import { formatFCFA, resolveListingPhoto } from '@daloa/utils';

interface SellerListingCardProps {
  item: any;
  /** Nombre de ventes livrées de l'annonce (onglet « Vendues »). */
  salesCount?: number;
  onPress: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  /** Absent pour une annonce vendue : on ne booste que ce qui est en vente. */
  onBoost?: () => void;
}

/**
 * Carte d'une annonce dans « Mes annonces ».
 *
 * Refonte du 28/09 : les quatre actions tenaient sur une ligne avec icône et
 * texte côte à côte, si bien que « Marquer vendu » passait sur deux lignes et
 * que la barre paraissait bricolée. Désormais : icône au-dessus d'un libellé
 * court, quatre colonnes égales. La vignette passe par `resolveListingPhoto`
 * (une URI locale d'un envoi raté laissait une image vide).
 */
export const SellerListingCard: React.FC<SellerListingCardProps> = ({
  item,
  salesCount = 0,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
  onBoost,
}) => {
  const accent = useAccent();
  const isSold = item.status === 'sold';
  const isBoosted = !!item.boosted_until && new Date(item.boosted_until) > new Date();
  const photo = resolveListingPhoto(item.photos, '');

  const statusLabel = isSold ? 'Vendu' : isBoosted ? 'Boostée' : 'En vente';
  const statusColors = isSold
    ? { bg: colors.bg.subtle, fg: colors.text.muted }
    : isBoosted
      ? { bg: accent[50], fg: accent[700] }
      : { bg: colors.status.successLight, fg: colors.status.successDark };

  const actions = [
    { key: 'edit', label: 'Modifier', Icon: Pencil, color: colors.text.body, onPress: onEdit },
    isSold
      ? { key: 'restock', label: 'Remettre', Icon: RotateCcw, color: colors.status.infoDark, onPress: onToggleStatus }
      : { key: 'sold', label: 'Vendu', Icon: CheckCircle2, color: colors.status.successDark, onPress: onToggleStatus },
    ...(onBoost && !isSold
      ? [{ key: 'boost', label: isBoosted ? 'Prolonger' : 'Booster', Icon: Zap, color: accent.DEFAULT, onPress: onBoost }]
      : []),
    { key: 'delete', label: 'Supprimer', Icon: Trash2, color: colors.status.errorDark, onPress: onDelete },
  ];

  return (
    <View style={styles.card}>
      <AppPressable onPress={onPress} style={styles.cardTop} accessibilityLabel={`Voir l'annonce ${item.title}`}>
        <View style={styles.thumbnail}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <ShoppingBag size={24} color={colors.text.subtle} />
          )}
        </View>

        <View style={styles.cardInfo}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
            {item.title}
          </AppText>

          <AppText variant="subtitle" color={accent.DEFAULT} style={styles.price}>
            {formatFCFA(item.price)}
          </AppText>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
              <AppText variant="caption" color={statusColors.fg} style={styles.badgeText}>
                {statusLabel}
              </AppText>
            </View>
            {salesCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.status.successLight }]}>
                <AppText variant="caption" color={colors.status.successDark} style={styles.badgeText}>
                  {salesCount} vente{salesCount > 1 ? 's' : ''}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <MapPin size={11} color={colors.text.subtle} />
            <AppText variant="caption" color={colors.text.muted} numberOfLines={1}>
              {item.district || 'Daloa'}
            </AppText>
            <Eye size={11} color={colors.text.subtle} style={styles.eyeIcon} />
            <AppText variant="caption" color={colors.text.muted}>
              {item.view_count || 0}
            </AppText>
          </View>
        </View>
      </AppPressable>

      <View style={styles.cardActions}>
        {actions.map(({ key, label, Icon, color, onPress: handle }) => (
          <AppPressable
            key={key}
            haptic="selection"
            onPress={handle}
            style={styles.actionBtn}
            accessibilityLabel={label}
          >
            <Icon size={17} color={color} />
            <AppText variant="caption" color={color} numberOfLines={1} style={styles.actionLabel}>
              {label}
            </AppText>
          </AppPressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    padding: spacing[3],
    gap: spacing[3],
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
  },
  price: {
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  eyeIcon: {
    marginLeft: spacing[2],
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    fontFamily: typography.families.bold,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing[2] + 2,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: typography.families.semibold,
  },
});
