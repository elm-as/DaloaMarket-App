import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import {
  Shirt,
  Smartphone,
  Home,
  Car,
  UtensilsCrossed,
  Dumbbell,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';

export interface CategoryPillProps {
  id: string;
  name: string;
  isSelected: boolean;
  onPress: () => void;
  iconName?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  id,
  name,
  isSelected,
  onPress,
  iconName,
}) => {
  const getIcon = () => {
    const iconProps = {
      size: 15,
      color: isSelected ? '#FFFFFF' : colors.dark.textMuted,
    };

    switch (id) {
      case 'fashion':
        return <Shirt {...iconProps} />;
      case 'electronics':
        return <Smartphone {...iconProps} />;
      case 'home':
        return <Home {...iconProps} />;
      case 'vehicles':
        return <Car {...iconProps} />;
      case 'food':
        return <UtensilsCrossed {...iconProps} />;
      case 'sports':
        return <Dumbbell {...iconProps} />;
      case 'books':
        return <BookOpen {...iconProps} />;
      default:
        return <Sparkles {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        Haptics.selection();
        onPress();
      }}
      style={[styles.pill, isSelected && styles.pillSelected]}
    >
      {getIcon()}
      <Text style={[styles.text, isSelected && styles.textSelected]}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3] + 2,
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: colors.market.primary,
    borderColor: colors.market.primary,
  },
  text: {
    color: colors.dark.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
});
