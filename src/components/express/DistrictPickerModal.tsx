import React from 'react';
import { View, StyleSheet, Modal, FlatList } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, Button, useAccent } from '@daloa/ui';
import { DALOA_DISTRICTS } from '@daloa/config';

export interface DistrictPickerModalProps {
  visible: boolean;
  selectedDistrict: string;
  onSelect: (district: string) => void;
  onClose: () => void;
}

export const DistrictPickerModal: React.FC<DistrictPickerModalProps> = ({
  visible,
  selectedDistrict,
  onSelect,
  onClose,
}) => {
  const accent = useAccent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <AppText variant="title" style={styles.modalTitle}>
            Sélectionnez un quartier
          </AppText>
          <FlatList
            data={DALOA_DISTRICTS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = selectedDistrict === item;
              return (
                <AppPressable
                  onPress={() => onSelect(item)}
                  style={styles.modalItem}
                >
                  <AppText variant="body">{item}</AppText>
                  {isSelected && <Check size={18} color={accent.DEFAULT} />}
                </AppPressable>
              );
            }}
          />
          <Button
            variant="outline"
            size="md"
            title="Fermer"
            onPress={onClose}
            style={styles.modalCloseBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    padding: spacing[4],
    maxHeight: '75%',
  },
  modalTitle: {
    marginBottom: spacing[3],
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalCloseBtn: {
    marginTop: spacing[3],
  },
});
