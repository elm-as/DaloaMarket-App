import React from 'react';
import { View, TextInput } from 'react-native';
import { Package, Check, AlertTriangle } from 'lucide-react-native';
import { colors, typography, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import {
  PACKAGE_TYPES,
  expressFormStyles as styles,
  type ExpressFormState,
  type ExpressFormHandlers,
} from './expressForm.types';

interface StepPackageProps {
  state: Pick<
    ExpressFormState,
    'packageType' | 'packageDescription' | 'isSealed' | 'isFragile'
  >;
  handlers: Pick<
    ExpressFormHandlers,
    'setPackageType' | 'setPackageDescription' | 'setIsSealed' | 'setIsFragile'
  >;
}

export const ExpressStepPackage: React.FC<StepPackageProps> = ({ state, handlers }) => {
  const accent = useAccent();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Package size={16} color={accent.DEFAULT} />
        <AppText variant="bodyStrong">2. Type de colis</AppText>
      </View>

      <View style={styles.typesGrid}>
        {PACKAGE_TYPES.map(({ id, label, icon: IconComponent }) => {
          const selected = state.packageType === id;
          return (
            <AppPressable
              key={id}
              haptic="selection"
              onPress={() => handlers.setPackageType(id)}
              style={[
                styles.typeTile,
                selected
                  ? { borderColor: accent.DEFAULT, backgroundColor: accent[50] ?? '#FFF7ED' }
                  : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface },
              ]}
            >
              <IconComponent size={16} color={selected ? accent.DEFAULT : colors.text.muted} />
              <AppText
                variant="caption"
                numberOfLines={1}
                color={selected ? accent[900] ?? colors.text.DEFAULT : colors.text.body}
                style={{ fontFamily: selected ? typography.families.bold : typography.families.medium, flexShrink: 1 }}
              >
                {label}
              </AppText>
            </AppPressable>
          );
        })}
      </View>

      <View style={styles.chipsRow}>
        <AppPressable
          haptic="selection"
          onPress={() => {
            Haptics.selection();
            handlers.setIsSealed(!state.isSealed);
          }}
          style={[
            styles.chip,
            state.isSealed
              ? { borderColor: '#059669', backgroundColor: '#ECFDF5' }
              : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface },
          ]}
        >
          <Check size={14} color={state.isSealed ? '#059669' : colors.text.muted} />
          <AppText variant="caption" color={state.isSealed ? '#065F46' : colors.text.body} style={{ fontFamily: typography.families.semibold }}>
            Colis scellé
          </AppText>
        </AppPressable>

        <AppPressable
          haptic="selection"
          onPress={() => {
            Haptics.selection();
            handlers.setIsFragile(!state.isFragile);
          }}
          style={[
            styles.chip,
            state.isFragile
              ? { borderColor: '#D97706', backgroundColor: '#FFFBEB' }
              : { borderColor: colors.border.DEFAULT, backgroundColor: colors.bg.surface },
          ]}
        >
          <AlertTriangle size={14} color={state.isFragile ? '#D97706' : colors.text.muted} />
          <AppText variant="caption" color={state.isFragile ? '#92400E' : colors.text.body} style={{ fontFamily: typography.families.semibold }}>
            Fragile
          </AppText>
        </AppPressable>
      </View>

      <View>
        <AppText variant="caption" style={styles.fieldLabel}>
          Précision utile (optionnel)
        </AppText>
        <TextInput
          placeholder="Ex : Enveloppe A4, sac repas..."
          placeholderTextColor={colors.text.subtle}
          value={state.packageDescription}
          onChangeText={handlers.setPackageDescription}
          style={styles.input}
        />
        <AppText variant="caption" color={colors.text.subtle} style={{ fontSize: 11, marginTop: 4 }}>
          Par sécurité, ne mentionnez ni marque ni valeur du contenu.
        </AppText>
      </View>
    </View>
  );
};
