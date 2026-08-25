import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../tokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radii.lg,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.dark.surfaceRaised,
    opacity: 0.6,
  },
});
