import React from 'react';
import { View, ScrollView, TextInput, Switch } from 'react-native';
import { ShieldCheck, Lock, AlertTriangle, UserCheck } from 'lucide-react-native';
import { colors, AppText, AppPressable, useAccent } from '@daloa/ui';
import {
  PACKAGE_TYPES,
  expressFormStyles as styles,
  type ExpressFormState,
  type ExpressFormHandlers,
} from './expressForm.types';

interface StepPackageProps {
  state: Pick<
    ExpressFormState,
    'packageType' | 'packageDescription' | 'isSealed' | 'isFragile' | 'isHandDelivery'
  >;
  handlers: Pick<
    ExpressFormHandlers,
    'setPackageType' | 'setPackageDescription' | 'setIsSealed' | 'setIsFragile' | 'setIsHandDelivery'
  >;
}

export const ExpressStepPackage: React.FC<StepPackageProps> = ({ state, handlers }) => {
  const accent = useAccent();

  return (
    <View style={styles.stepContainer}>
      <AppText variant="h2" style={styles.stepHeaderTitle}>
        Que souhaitez-vous envoyer ?
      </AppText>
      <AppText variant="caption" color={colors.text.muted} style={styles.stepHeaderSubtitle}>
        Sélectionnez le format indicatif du colis.
      </AppText>

      <View style={styles.antiTheftBanner}>
        <ShieldCheck size={18} color="#16A34A" />
        <View style={styles.antiTheftTexts}>
          <AppText variant="caption" color="#166534" style={styles.antiTheftTitle}>
            Confidentialité & Sécurité Anti-Vol
          </AppText>
          <AppText variant="caption" color="#15803D" style={styles.antiTheftSub}>
            Le livreur voit uniquement le format et les consignes. Ne mentionnez pas de marque ni de valeur marchande.
          </AppText>
        </View>
      </View>

      <AppText variant="label" style={styles.inputLabel}>
        Format du paquet
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
        {PACKAGE_TYPES.map((pt) => {
          const selected = state.packageType === pt.id;
          const IconComponent = pt.icon;
          return (
            <AppPressable
              key={pt.id}
              haptic="selection"
              onPress={() => handlers.setPackageType(pt.id)}
              style={[
                styles.typePill,
                selected
                  ? { backgroundColor: accent[500], borderColor: accent[600] }
                  : { backgroundColor: colors.bg.surface, borderColor: colors.border.DEFAULT },
              ]}
            >
              <IconComponent size={15} color={selected ? colors.text.inverse : colors.text.body} />
              <AppText variant="label" numberOfLines={1} color={selected ? colors.text.inverse : colors.text.body}>
                {pt.label}
              </AppText>
            </AppPressable>
          );
        })}
      </ScrollView>

      <AppText variant="label" style={styles.inputLabel}>
        Précautions de transport
      </AppText>
      <View style={styles.optionsCard}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Lock size={15} color={accent[700]} />
            <View>
              <AppText variant="bodyStrong">Emballage scellé / fermé</AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Le coursier prend une photo du scellé au ramassage
              </AppText>
            </View>
          </View>
          <Switch
            value={state.isSealed}
            onValueChange={handlers.setIsSealed}
            trackColor={{ false: colors.border.DEFAULT, true: accent[500] }}
          />
        </View>

        <View style={styles.optionDivider} />

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <AlertTriangle size={15} color="#D97706" />
            <View>
              <AppText variant="bodyStrong">Contenu fragile</AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Nécessite une manipulation délicate sur la moto
              </AppText>
            </View>
          </View>
          <Switch
            value={state.isFragile}
            onValueChange={handlers.setIsFragile}
            trackColor={{ false: colors.border.DEFAULT, true: accent[500] }}
          />
        </View>

        <View style={styles.optionDivider} />

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <UserCheck size={15} color="#2563EB" />
            <View>
              <AppText variant="bodyStrong">Remise en main propre</AppText>
              <AppText variant="caption" color={colors.text.muted}>
                Ne pas confier à un voisin ou gardien
              </AppText>
            </View>
          </View>
          <Switch
            value={state.isHandDelivery}
            onValueChange={handlers.setIsHandDelivery}
            trackColor={{ false: colors.border.DEFAULT, true: accent[500] }}
          />
        </View>
      </View>

      <AppText variant="label" style={styles.inputLabel}>
        Consignes pratiques pour le coursier
      </AppText>
      <TextInput
        placeholder="Ex : Appeler 5 min avant, remettre au portail blanc..."
        placeholderTextColor={colors.text.subtle}
        value={state.packageDescription}
        onChangeText={handlers.setPackageDescription}
        style={styles.input}
      />
    </View>
  );
};
