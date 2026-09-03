import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, typography, radii } from '../tokens';
import { AppPressable } from './AppPressable';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <AppPressable
          onPress={onBack}
          haptic="light"
          rippleBorderless
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={colors.text.DEFAULT} />
        </AppPressable>
      ) : (
        <View style={{ width: 36 }} />
      )}

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightAction || <View style={{ width: 36 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[2],
  },
  title: {
    color: colors.text.DEFAULT,
    fontSize: typography.sizes.base,
    fontFamily: typography.families.extrabold,
  },
  subtitle: {
    color: colors.grey[500],
    fontSize: 11,
    fontFamily: typography.families.normal,
    marginTop: 1,
  },
  rightContainer: {
    minWidth: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
