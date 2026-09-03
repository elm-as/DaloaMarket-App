import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { colors, spacing, typography, radii } from '../tokens';
import { Haptics } from '@daloa/utils';

export interface OfflineBannerProps {
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => {
  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <WifiOff size={16} color="#FFFFFF" style={{ marginRight: spacing[2] }} />
        <Text style={styles.text}>Connexion internet interrompue</Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.lightImpact();
            onRetry();
          }}
          style={styles.retryBtn}
        >
          <RefreshCw size={14} color="#FFFFFF" />
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.semibold,
    fontWeight: typography.weights.semibold,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    gap: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.bold,
    fontWeight: typography.weights.bold,
  },
});
