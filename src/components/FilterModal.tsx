import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { BottomSheet, Button } from '@daloa/ui';
import { colors, radii, spacing, typography } from '@daloa/ui';
import { DALOA_DISTRICTS, MARKET_CATEGORIES, LISTING_CONDITIONS } from '@daloa/config';
import { ListingFilters } from '@daloa/types';
import { Haptics } from '@daloa/utils';

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ListingFilters;
  onApply: (newFilters: ListingFilters) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(filters.district);
  const [selectedCondition, setSelectedCondition] = useState<string | undefined>(filters.condition);
  const [deliveryOnly, setDeliveryOnly] = useState<boolean>(Boolean(filters.acceptsDeliveryOnly));

  const handleApply = () => {
    Haptics.success();
    onApply({
      ...filters,
      district: selectedDistrict,
      condition: selectedCondition,
      acceptsDeliveryOnly: deliveryOnly || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    Haptics.selection();
    setSelectedDistrict(undefined);
    setSelectedCondition(undefined);
    setDeliveryOnly(false);
    onReset();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filtres de recherche">
      {/* 1. Quartier de Daloa */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quartier à Daloa</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity
            onPress={() => setSelectedDistrict(undefined)}
            style={[styles.chip, !selectedDistrict && styles.chipActive]}
          >
            <Text style={[styles.chipText, !selectedDistrict && styles.chipTextActive]}>
              Tous les quartiers
            </Text>
          </TouchableOpacity>

          {DALOA_DISTRICTS.slice(0, 15).map((district) => {
            const isSelected = selectedDistrict === district;
            return (
              <TouchableOpacity
                key={district}
                onPress={() => setSelectedDistrict(isSelected ? undefined : district)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {district}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. État de l'article */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État du produit</Text>
        <View style={styles.chipsGrid}>
          {LISTING_CONDITIONS.map((cond) => {
            const isSelected = selectedCondition === cond.id;
            return (
              <TouchableOpacity
                key={cond.id}
                onPress={() => setSelectedCondition(isSelected ? undefined : cond.id)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {cond.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Livraison uniquement */}
      <View style={[styles.section, styles.switchRow]}>
        <View>
          <Text style={styles.sectionTitle}>Livraison disponible uniquement</Text>
          <Text style={styles.switchSub}>Ne voir que les articles éligibles à la livraison Daloa</Text>
        </View>
        <Switch
          value={deliveryOnly}
          onValueChange={setDeliveryOnly}
          trackColor={{ false: colors.dark.surfaceRaised, true: colors.market.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionRow}>
        <Button
          title="Réinitialiser"
          variant="secondary"
          onPress={handleReset}
          style={{ flex: 1 }}
        />
        <Button
          title="Appliquer les filtres"
          variant="market"
          onPress={handleApply}
          style={{ flex: 2 }}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2] + 2,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  switchSub: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    maxWidth: 240,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
});
