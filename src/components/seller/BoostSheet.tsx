import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { BOOST_CREDIT_OPTIONS } from '@daloa/config';
import { colors, radii, spacing, AppText, AppPressable, BottomSheet, Button } from '@daloa/ui';

/**
 * Boost d'une annonce payé en crédits (RPC `buy_boost_with_credits`), comme sur
 * le web. L'app n'offrait jusqu'ici aucun boost : l'écran « Packs » affichait
 * un « Boost 500 F » factice, sans paiement ni effet.
 */

type BoostDays = (typeof BOOST_CREDIT_OPTIONS)[number]['days'];

interface BoostSheetProps {
  visible: boolean;
  listingTitle?: string;
  /** Solde de crédits du vendeur, `null` tant qu'il n'est pas chargé. */
  credits: number | null;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: (days: BoostDays) => void;
  onBuyCredits: () => void;
}

export const BoostSheet: React.FC<BoostSheetProps> = ({
  visible,
  listingTitle,
  credits,
  isLoading = false,
  onCancel,
  onConfirm,
  onBuyCredits,
}) => {
  const [selectedDays, setSelectedDays] = React.useState<BoostDays>(7);

  React.useEffect(() => {
    if (visible) setSelectedDays(7);
  }, [visible]);

  const selected = BOOST_CREDIT_OPTIONS.find((o) => o.days === selectedDays)!;
  const balance = credits ?? 0;
  const canAfford = credits !== null && balance >= selected.credits;

  return (
    <BottomSheet visible={visible} onClose={onCancel} title="Booster l’annonce">
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Zap size={18} color={colors.primary[700]} />
        </View>
        <View style={styles.introText}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {listingTitle || 'Cette annonce'}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Affichée en priorité sur l’accueil et dans les recherches.
          </AppText>
        </View>
      </View>

      <View style={styles.options}>
        {BOOST_CREDIT_OPTIONS.map((option) => {
          const isSelected = option.days === selectedDays;
          return (
            <AppPressable
              key={option.days}
              haptic="selection"
              onPress={() => setSelectedDays(option.days)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <AppText variant="bodyStrong" color={isSelected ? colors.primary[700] : colors.text.DEFAULT}>
                {option.label}
              </AppText>
              <AppText variant="caption" color={colors.text.muted}>
                {option.credits} crédit{option.credits > 1 ? 's' : ''}
              </AppText>
            </AppPressable>
          );
        })}
      </View>

      <AppText variant="caption" color={canAfford ? colors.text.muted : colors.status.errorDark} style={styles.balance}>
        {credits === null
          ? 'Chargement de votre solde…'
          : `Solde : ${balance} crédit${balance > 1 ? 's' : ''}${canAfford ? '' : ' — insuffisant pour cette durée'}`}
      </AppText>

      <View style={styles.actions}>
        <Button title="Annuler" variant="secondary" onPress={onCancel} style={styles.actionBtn} />
        {canAfford || credits === null ? (
          <Button
            title={`Booster (${selected.credits} crédit${selected.credits > 1 ? 's' : ''})`}
            variant="primary"
            disabled={!canAfford}
            loading={isLoading}
            onPress={() => onConfirm(selectedDays)}
            style={styles.actionBtn}
          />
        ) : (
          <Button title="Acheter des crédits" variant="primary" onPress={onBuyCredits} style={styles.actionBtn} />
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  introIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  introText: { flex: 1, gap: 2 },
  options: { flexDirection: 'row', gap: spacing[2] },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
  },
  optionSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary[50],
  },
  balance: { marginTop: spacing[3], textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[4] },
  actionBtn: { flex: 1 },
});
