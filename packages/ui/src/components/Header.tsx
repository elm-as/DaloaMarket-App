import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, typography, radii } from '../tokens';
import { Haptics } from '@daloa/utils';

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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.lightImpact();
            onBack();
          }}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={colors.dark.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
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
        {rightAction || <View style={{ width: 40 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    backgroundColor: colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.dark.surfaceRaised,
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
    color: colors.dark.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.dark.textDim,
    fontSize: typography.sizes.xs,
    marginTop: 1,
  },
  rightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
