import React from 'react';
import { Text, TextStyle } from 'react-native';
import { formatFCFA } from '@daloa/utils';
import { colors, typography } from '../tokens';

export interface CurrencyTextProps {
  amount: number | null | undefined;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: string;
  style?: TextStyle;
}

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  amount,
  size = 'base',
  weight = 'bold',
  color = colors.market.primary,
  style,
}) => {
  return (
    <Text
      style={[
        {
          color,
          fontSize: typography.sizes[size],
          fontWeight: typography.weights[weight],
          fontVariant: ['tabular-nums'],
          letterSpacing: 0.3,
        },
        style,
      ]}
    >
      {formatFCFA(amount)}
    </Text>
  );
};
