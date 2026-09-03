import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  actionVariant?: 'market' | 'delivery' | 'primary';
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onActionPress,
  actionVariant = 'primary',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant={actionVariant}
          size="md"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: radii['2xl'],
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    color: colors.text.DEFAULT,
    fontSize: typography.sizes.lg,
    fontFamily: typography.families.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.normal,
    lineHeight: typography.lineHeights.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: spacing[5],
    minWidth: 160,
  },
});
