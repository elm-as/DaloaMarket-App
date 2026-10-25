import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { colors, radii, spacing, Button, BottomSheet, AppText, AppPressable, typography } from '@daloa/ui';
import { COD_REFUSAL_REASONS } from '@daloa/api';
import { CodRefusalReason } from '@daloa/types';
import { AlertTriangle, PhoneOff, Banknote, XCircle, MapPinOff } from 'lucide-react-native';

interface CodRefusalSellerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: CodRefusalReason, notes?: string) => Promise<void>;
  loading: boolean;
}

export function CodRefusalSellerModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: CodRefusalSellerModalProps) {
  const [selectedReason, setSelectedReason] = useState<CodRefusalReason>('buyer_unreachable');
  const [notes, setNotes] = useState('');

  const handleFormSubmit = async () => {
    await onSubmit(selectedReason, notes.trim() || undefined);
    setNotes('');
  };

  const getIcon = (id: CodRefusalReason) => {
    switch (id) {
      case 'buyer_unreachable':
        return <PhoneOff size={16} color={colors.status.errorDark} />;
      case 'buyer_refused_no_money':
        return <Banknote size={16} color="#B45309" />;
      case 'buyer_refused_changed_mind':
        return <XCircle size={16} color={colors.status.errorDark} />;
      case 'buyer_fake_location':
        return <MapPinOff size={16} color="#B45309" />;
      default:
        return <AlertTriangle size={16} color={colors.text.muted} />;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Signaler un refus acheteur (Anti-Lapin)">
      <View style={styles.container}>
        <View style={styles.warningBanner}>
          <AlertTriangle size={16} color="#B45309" />
          <AppText variant="caption" color="#92400E" style={styles.instructions}>
            Cette action annule la commande, libère votre stock et met à jour l'Indice Anti-Lapin de l'acheteur pour protéger les commerçants de Daloa.
          </AppText>
        </View>

        <AppText variant="bodyStrong">Motif de non-remise :</AppText>

        <View style={styles.reasonsList}>
          {COD_REFUSAL_REASONS.map((r) => {
            const isSelected = selectedReason === r.id;
            return (
              <AppPressable
                key={r.id}
                haptic="selection"
                onPress={() => setSelectedReason(r.id)}
                style={[styles.reasonCard, isSelected && styles.reasonCardSelected]}
              >
                <View style={styles.reasonHeader}>
                  {getIcon(r.id)}
                  <AppText
                    variant="body"
                    color={isSelected ? colors.status.errorDark : colors.text.body}
                    style={[styles.flex1, isSelected && styles.boldText]}
                  >
                    {r.label}
                  </AppText>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </AppPressable>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          multiline
          numberOfLines={2}
          placeholder="Explications complémentaires (optionnel)..."
          placeholderTextColor={colors.text.subtle}
          value={notes}
          onChangeText={setNotes}
        />

        <View style={{ marginTop: spacing[3] }}>
          <Button
            title="Confirmer le refus et libérer le stock"
            variant="danger"
            size="lg"
            onPress={handleFormSubmit}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    gap: spacing[2],
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[1],
  },
  instructions: {
    flex: 1,
    lineHeight: 17,
    fontFamily: typography.families.medium,
  },
  reasonsList: {
    gap: 6,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
  },
  reasonCardSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.status.errorDark,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  boldText: {
    fontFamily: typography.families.bold,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.status.errorDark,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.status.errorDark,
  },
  input: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: 12,
    fontSize: 13,
    color: colors.text.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
});
