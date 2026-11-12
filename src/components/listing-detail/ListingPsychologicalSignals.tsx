import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography, AppText } from '@daloa/ui';
import { formatFCFA } from '@daloa/utils';
import { Flame, Eye, Heart, ShieldCheck, Truck, Sparkles } from 'lucide-react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_PAYMENT_API_URL || 'https://api.daloamarket.com';

interface EngagementSignals {
  recentViewers7d: number;
  favoritesCount: number;
  stock: number;
  priceDropAmount: number;
}

interface ListingPsychologicalSignalsProps {
  listingId: string;
  stock: number;
  currentPrice: number;
  originalPrice?: number | null;
}

/**
 * Bloc de signaux psychologiques sur la fiche produit mobile :
 * - FOMO (stock limité, visiteurs réels 7j, favoris, économie immédiate)
 * - Confiance (Garantie Satisfait ou Remboursé avec séquestre par code OTP)
 * - Gratification immédiate (Livraison express le jour même à Daloa)
 */
export const ListingPsychologicalSignals: React.FC<ListingPsychologicalSignalsProps> = ({
  listingId,
  stock,
  currentPrice,
  originalPrice,
}) => {
  const [signals, setSignals] = useState<EngagementSignals | null>(null);

  useEffect(() => {
    if (!listingId) return;
    let mounted = true;
    fetch(`${API_BASE_URL}/api/engagement/listing/${encodeURIComponent(listingId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) {
          setSignals({
            recentViewers7d: Number(data.recentViewers7d || 0),
            favoritesCount: Number(data.favoritesCount || 0),
            stock: Number(data.stock ?? 1),
            priceDropAmount: Number(data.priceDropAmount || 0),
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [listingId]);

  const effectiveStock = Math.max(0, stock);
  const isLowStock = effectiveStock > 0 && effectiveStock <= 3;
  const savingsAmount =
    originalPrice != null && originalPrice > currentPrice
      ? originalPrice - currentPrice
      : signals?.priceDropAmount || 0;
  const recentViewers = signals?.recentViewers7d || 0;
  const favoritesCount = signals?.favoritesCount || 0;

  return (
    <View style={styles.container}>
      {/* ── Signaux FOMO dynamiques (100% basés sur les vraies données) ── */}
      {(isLowStock || savingsAmount > 0 || recentViewers >= 2 || favoritesCount >= 1) && (
        <View style={styles.fomoWrap}>
          {isLowStock && (
            <View style={[styles.chip, styles.chipRed]}>
              <Flame size={13} color="#DC2626" />
              <AppText variant="caption" color="#B91C1C" style={styles.chipText}>
                Plus que {effectiveStock} en stock à ce prix !
              </AppText>
            </View>
          )}

          {savingsAmount > 0 && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Sparkles size={13} color="#059669" />
              <AppText variant="caption" color="#065F46" style={styles.chipText}>
                Vous économisez {formatFCFA(savingsAmount)}
              </AppText>
            </View>
          )}

          {recentViewers >= 2 && (
            <View style={[styles.chip, styles.chipOrange]}>
              <Eye size={13} color="#EA580C" />
              <AppText variant="caption" color="#9A3412" style={styles.chipText}>
                {recentViewers} personnes ont regardé cet article cette semaine
              </AppText>
            </View>
          )}

          {favoritesCount >= 1 && (
            <View style={[styles.chip, styles.chipRose]}>
              <Heart size={13} color="#E11D48" />
              <AppText variant="caption" color="#9F1239" style={styles.chipText}>
                Dans les favoris de {favoritesCount} acheteur{favoritesCount > 1 ? 's' : ''}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* ── Confiance (Satisfait ou Remboursé) & Gratification immédiate ── */}
      <View style={styles.trustGrid}>
        <View style={[styles.trustCard, styles.trustCardGreen]}>
          <View style={[styles.trustIcon, { backgroundColor: '#059669' }]}>
            <ShieldCheck size={15} color={colors.text.inverse} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color="#064E3B">
              Satisfait ou remboursé
            </AppText>
            <AppText variant="caption" color="#065F46" style={styles.trustSub}>
              Argent protégé par code secret (OTP) jusqu'à la remise. Remboursé si non livré ou non conforme.
            </AppText>
          </View>
        </View>

        <View style={[styles.trustCard, styles.trustCardAmber]}>
          <View style={[styles.trustIcon, { backgroundColor: '#EA580C' }]}>
            <Truck size={15} color={colors.text.inverse} />
          </View>
          <View style={styles.flex1}>
            <AppText variant="bodyStrong" color={colors.text.DEFAULT}>
              Livraison express à Daloa
            </AppText>
            <AppText variant="caption" color={colors.text.muted} style={styles.trustSub}>
              Un coursier DaloaDelivery récupère votre colis et vous livre chez vous le jour même.
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  fomoWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  chipRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  chipGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  chipOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  chipRose: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  chipText: {
    fontFamily: typography.families.bold,
    fontVariant: ['tabular-nums'],
  },
  trustGrid: {
    gap: spacing[2],
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2] + 2,
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  trustCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  trustCardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  trustIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  trustSub: {
    marginTop: 2,
    lineHeight: 16,
  },
  flex1: {
    flex: 1,
  },
});

