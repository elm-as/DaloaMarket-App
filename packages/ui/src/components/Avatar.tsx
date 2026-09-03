import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, typography } from '../tokens';
import { Badge } from './Badge';

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  isPro?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 44,
  isPro = false,
  isOnline,
  style,
}) => {
  const getInitials = (n?: string | null) => {
    if (!n) return 'DM';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize: Math.max(11, Math.round(size * 0.38)) },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isPro && (
        <View style={styles.proBadgeContainer}>
          <Badge label="PRO" variant="pro" />
        </View>
      )}

      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            { backgroundColor: isOnline ? colors.status.success : colors.grey[400] },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.primary[700],
    fontFamily: typography.families.bold,
    fontWeight: typography.weights.bold,
  },
  proBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
