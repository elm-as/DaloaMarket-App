import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Switch } from 'react-native';
import { Plus, Trash2, Layers } from 'lucide-react-native';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { formatFCFA, Haptics } from '@daloa/utils';

export interface DraftVariant {
  title: string;
  price?: number | null;
  stock: number;
}

interface StepVariantsSectionProps {
  basePrice: string;
  variants: DraftVariant[];
  onVariantsChange: (variants: DraftVariant[]) => void;
}

export const StepVariantsSection: React.FC<StepVariantsSectionProps> = ({
  basePrice,
  variants,
  onVariantsChange,
}) => {
  const accent = useAccent();
  const [isEnabled, setIsEnabled] = useState(variants.length > 0);
  const [variantTitle, setVariantTitle] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('1');

  const handleToggle = (val: boolean) => {
    Haptics.selection();
    setIsEnabled(val);
    if (!val) {
      onVariantsChange([]);
    }
  };

  const handleAddVariant = () => {
    if (!variantTitle.trim()) return;
    Haptics.success();

    const priceNum = variantPrice.trim() ? parseFloat(variantPrice) : (parseFloat(basePrice) || null);
    const stockNum = Math.max(1, parseInt(variantStock, 10) || 1);

    const newVariant: DraftVariant = {
      title: variantTitle.trim(),
      price: priceNum,
      stock: stockNum,
    };

    onVariantsChange([...variants, newVariant]);
    setVariantTitle('');
    setVariantPrice('');
    setVariantStock('1');
  };

  const handleRemoveVariant = (index: number) => {
    Haptics.lightImpact();
    const updated = variants.filter((_, i) => i !== index);
    onVariantsChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* En-tête dépliable */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <View style={styles.titleWithIcon}>
            <Layers size={18} color={accent.DEFAULT} strokeWidth={2.2} />
            <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
              Options / Variantes
            </AppText>
          </View>
          <AppText variant="caption" color={colors.text.muted}>
            Tailles, couleurs, capacités avec prix ou stock distincts
          </AppText>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.grey[200], true: accent[300] }}
          thumbColor={isEnabled ? accent.DEFAULT : colors.grey[400]}
        />
      </View>

      {/* Contenu affiché si activé */}
      {isEnabled && (
        <View style={styles.contentBox}>
          {/* Liste des variantes déjà ajoutées */}
          {variants.length > 0 && (
            <View style={styles.variantsList}>
              {variants.map((v, idx) => (
                <View key={idx} style={styles.variantItem}>
                  <View style={styles.variantInfo}>
                    <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
                      {v.title}
                    </AppText>
                    <AppText variant="caption" color={colors.text.muted}>
                      {v.price ? formatFCFA(v.price) : `${basePrice || '0'} FCFA (base)`} · Stock: {v.stock}
                    </AppText>
                  </View>
                  <AppPressable
                    haptic="light"
                    onPress={() => handleRemoveVariant(idx)}
                    style={styles.deleteBtn}
                    accessibilityLabel={`Supprimer ${v.title}`}
                  >
                    <Trash2 size={16} color={colors.status.errorDark} />
                  </AppPressable>
                </View>
              ))}
            </View>
          )}

          {/* Formulaire d'ajout d'une option */}
          <View style={styles.addForm}>
            <AppText variant="overline" color={colors.text.muted}>
              Ajouter une option
            </AppText>

            <TextInput
              value={variantTitle}
              onChangeText={setVariantTitle}
              placeholder="Ex: Taille XL, Noir 128 Go..."
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
            />

            <View style={styles.rowInputs}>
              <View style={styles.inputHalf}>
                <TextInput
                  value={variantPrice}
                  onChangeText={setVariantPrice}
                  keyboardType="numeric"
                  placeholder={`Prix (défaut ${basePrice || 'base'})`}
                  placeholderTextColor={colors.text.subtle}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputHalf}>
                <TextInput
                  value={variantStock}
                  onChangeText={setVariantStock}
                  keyboardType="numeric"
                  placeholder="Stock (ex: 5)"
                  placeholderTextColor={colors.text.subtle}
                  style={styles.input}
                />
              </View>
            </View>

            <AppPressable
              haptic="selection"
              onPress={handleAddVariant}
              disabled={!variantTitle.trim()}
              style={[
                styles.addBtn,
                { backgroundColor: variantTitle.trim() ? accent.DEFAULT : colors.grey[200] },
              ]}
            >
              <Plus size={16} color={colors.text.inverse} strokeWidth={2.5} />
              <AppText variant="label" color={colors.text.inverse}>
                Ajouter cette option
              </AppText>
            </AppPressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[3],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  toggleTextGroup: {
    flex: 1,
    paddingRight: spacing[3],
    gap: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentBox: {
    marginTop: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.grey[50],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: spacing[3],
  },
  variantsList: {
    gap: spacing[2],
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.surface,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  variantInfo: {
    flex: 1,
    gap: 2,
  },
  deleteBtn: {
    padding: spacing[1],
  },
  addForm: {
    gap: spacing[2],
  },
  input: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    height: 44,
    fontSize: typography.sizes.sm,
    color: colors.text.DEFAULT,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  inputHalf: {
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: radii.lg,
    gap: 6,
    marginTop: 2,
  },
});
