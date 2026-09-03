import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  Animated,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, X, Search, Check } from 'lucide-react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { DALOA_DISTRICTS } from '@daloa/config';

interface DistrictPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

export const DistrictPickerSheet: React.FC<DistrictPickerSheetProps> = ({
  visible,
  onClose,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const slideY = useRef(new Animated.Value(600)).current;
  const [districtSearch, setDistrictSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setDistrictSearch('');
      Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: Platform.OS !== 'web' }).start();
    } else {
      Animated.timing(slideY, { toValue: 600, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [visible]);

  const filteredDistricts = districtSearch.trim()
    ? ([...DALOA_DISTRICTS]).filter((d) =>
        d.toLowerCase().includes(districtSearch.toLowerCase())
      )
    : ([...DALOA_DISTRICTS]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <MapPin size={15} color={accent.DEFAULT} />
            <AppText variant="title">Choisir un quartier de Daloa</AppText>
          </View>
          <AppPressable onPress={onClose} rippleBorderless style={styles.closeBtn} accessibilityLabel="Fermer">
            <X size={18} color={colors.text.muted} />
          </AppPressable>
        </View>

        <View style={styles.searchBox}>
          <Search size={14} color={colors.text.muted} />
          <TextInput
            value={districtSearch}
            onChangeText={setDistrictSearch}
            placeholder="Rechercher un quartier (ex: Tazibouo, Orly)…"
            placeholderTextColor={colors.text.subtle}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {districtSearch.length > 0 && (
            <AppPressable rippleBorderless onPress={() => setDistrictSearch('')} style={{ padding: 4 }}>
              <X size={13} color={colors.text.muted} />
            </AppPressable>
          )}
        </View>

        <FlatList
          data={filteredDistricts}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => {
            const isSel = item === selectedDistrict;
            return (
              <AppPressable
                haptic="selection"
                onPress={() => {
                  onSelectDistrict(item);
                  onClose();
                }}
                style={[styles.districtRow, isSel && { backgroundColor: accent[50] }]}
              >
                <View
                  style={[
                    styles.districtDot,
                    { backgroundColor: isSel ? accent.DEFAULT : colors.border.strong },
                  ]}
                />
                <AppText
                  variant={isSel ? 'bodyStrong' : 'body'}
                  color={isSel ? accent[700] : colors.text.body}
                  style={styles.flex1}
                >
                  {item}
                </AppText>
                {isSel && <Check size={15} color={accent.DEFAULT} strokeWidth={2.5} />}
              </AppPressable>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { marginLeft: spacing[4] + 8 + spacing[3] }]} />
          )}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    height: 42,
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.body,
    paddingVertical: 0,
  },
  list: {
    flexGrow: 0,
    maxHeight: 340,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  districtDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  flex1: { flex: 1 },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
});

export default DistrictPickerSheet;
