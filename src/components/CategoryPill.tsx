import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, radii, spacing, AppText, AppPressable, useAccent } from '@daloa/ui';
import { Shirt, Smartphone, Home, Car, UtensilsCrossed, Dumbbell, BookOpen, Sparkles } from 'lucide-react-native';

export interface CategoryPillProps {
  id: string;
  name: string;
  isSelected: boolean;
  onPress: () => void;
  iconName?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ id, name, isSelected, onPress }) => {
  const accent = useAccent();

  const getIcon = () => {
    const iconProps = { size: 15, color: isSelected ? colors.text.inverse : accent.DEFAULT };
    switch (id) {
      case 'fashion':
      case 'mode':
        return <Shirt {...iconProps} />;
      case 'electronics':
      case 'electronique':
        return <Smartphone {...iconProps} />;
      case 'home':
      case 'maison':
        return <Home {...iconProps} />;
      case 'vehicles':
      case 'vehicules':
        return <Car {...iconProps} />;
      case 'food':
      case 'alimentation':
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
    <AppPressable
      haptic="selection"
      onPress={onPress}
      style={[styles.pill, isSelected && { backgroundColor: accent.DEFAULT, borderColor: accent.DEFAULT }]}
    >
      {getIcon()}
      <AppText variant="caption" color={isSelected ? colors.text.inverse : colors.grey[700]}>
        {name}
      </AppText>
    </AppPressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.full,
    paddingVertical: 7,
    paddingHorizontal: spacing[3],
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: 6,
    overflow: 'hidden',
  },
});
