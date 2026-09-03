import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useAffiliatedDeliverers, affiliationsService } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  typography,
  Avatar,
  EmptyState,
  AppText,
  AppPressable,
  Button,
  useAccent,
} from '@daloa/ui';
import { Bike, ArrowLeft, UserPlus, X, Clock, CheckCircle, Sparkles, Truck, Smartphone } from 'lucide-react-native';
import { Haptics } from '@daloa/utils';
import { safeBack } from '../../src/utils/navigation';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';

// Phase 1 active : les vendeurs non-Pro voient le portail ProGate
const PHASE_ZERO = false;

function ProGate({ accent }: { accent: any }) {
  const router = useRouter();
  return (
    <View style={styles.proGateWrap}>
      <View style={[styles.proGateIcon, { backgroundColor: accent[50] }]}>
        <Sparkles size={30} color={accent.DEFAULT} />
      </View>
      <AppText variant="h2" center>
        Fonctionnalité Pro
      </AppText>
      <AppText variant="body" color={colors.text.muted} center style={styles.proGateDesc}>
        Gérez vos livreurs de confiance, activez la livraison à domicile et le
        paiement à la livraison avec le Pass Vendeur Pro.
      </AppText>
      <Button
        title="Passer au Pro — 2 500 FCFA/mois"
        variant="market"
        size="lg"
        onPress={() => router.push('/pro/become-pro' as any)}
        leftIcon={<Sparkles size={16} color={colors.text.inverse} />}
        fullWidth
        style={styles.proGateBtn}
      />
    </View>
  );
}

export default function AffiliationsScreen() {
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const { data: affiliations, refetch } = useAffiliatedDeliverers(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isPro = profile?.isPro ?? false;
  const isGated = !isPro && !PHASE_ZERO;

  const list = affiliations || [];
  const pending = list.filter((a) => a.status === 'pending');
  const active = list.filter((a) => a.status === 'active' || a.status === 'accepted');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleInvite = async () => {
    const phone = invitePhone.trim();
    if (!phone || !user?.id) return;
    if (phone.replace(/\D/g, '').length < 9) {
      Alert.alert('Numéro invalide', 'Entrez un numéro ivoirien valide (ex: 0708091011).');
      return;
    }

    Haptics.lightImpact();
    setIsInviting(true);
    try {
      const result = await affiliationsService.inviteByPhone(user.id, phone);
      if (result.success) {
        Haptics.success();
        setInvitePhone('');
        refetch();
        Alert.alert('Invitation envoyée !', result.message);
      } else {
        Alert.alert('Impossible d\'inviter', result.message);
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = (affiliationId: string, name?: string) => {
    Alert.alert(
      'Retirer ce livreur ?',
      `${name || 'Ce livreur'} ne sera plus affilié à votre boutique.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            Haptics.lightImpact();
            setRemovingId(affiliationId);
            try {
              await affiliationsService.removeAffiliation(affiliationId);
              refetch();
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de retirer ce livreur.');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <AuthGuardView
        title="Livreurs Affiliés"
        description="Connectez-vous pour inviter et gérer vos coursiers de confiance à Daloa."
        fallbackRoute="/(tabs)/profile"
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <AppPressable
            onPress={() => safeBack(router, '/(tabs)/profile')}
            rippleBorderless
            style={styles.backBtn}
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color={colors.text.inverse} />
          </AppPressable>
          <View style={styles.heroTitles}>
            <AppText variant="overline" color={accent[100]}>
              Réseau de livraison
            </AppText>
            <AppText variant="title" color={colors.text.inverse}>
              Livreurs affiliés
            </AppText>
          </View>
          {list.length > 0 ? (
            <View style={styles.countBadge}>
              <AppText variant="caption" color={colors.text.inverse}>
                {active.length}
              </AppText>
            </View>
          ) : (
            <View style={styles.iconCircle}>
              <Bike size={18} color={accent[200]} />
            </View>
          )}
        </View>
      </LinearGradient>

      {isGated ? (
        <ProGate accent={accent} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent.DEFAULT} />
          }
        >
          {/* Info box */}
          <View style={styles.infoBox}>
            <Bike size={22} color={accent.DEFAULT} />
            <View style={styles.flex1}>
              <AppText variant="bodyStrong">Livreurs de confiance</AppText>
              <AppText variant="caption" color={colors.text.muted} style={styles.infoSub}>
                Invitez vos coursiers habituels pour qu'ils soient notifiés en priorité lors de vos ventes.
              </AppText>
            </View>
          </View>

          {/* Invite card */}
          <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <UserPlus size={16} color={accent[700]} />
              <AppText variant="bodyStrong" color={accent[700]}>
                Inviter un livreur par numéro
              </AppText>
            </View>
            <View style={styles.inviteRow}>
              <View style={styles.phoneInputWrap}>
                <Smartphone size={15} color={colors.text.subtle} style={styles.phoneIcon} />
                <TextInput
                  value={invitePhone}
                  onChangeText={setInvitePhone}
                  placeholder="0708091011"
                  placeholderTextColor={colors.text.subtle}
                  keyboardType="phone-pad"
                  maxLength={15}
                  style={styles.phoneInput}
                  returnKeyType="send"
                  onSubmitEditing={handleInvite}
                />
              </View>
              <Button
                title="Inviter"
                variant="market"
                size="md"
                onPress={handleInvite}
                loading={isInviting}
                disabled={!invitePhone.trim() || isInviting}
                leftIcon={<UserPlus size={15} color={colors.text.inverse} />}
              />
            </View>
            <AppText variant="caption" color={colors.text.muted}>
              Le livreur doit être inscrit sur DaloaDelivery.
            </AppText>
          </View>

          {/* Pending section */}
          {pending.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Clock size={14} color={colors.status.warningDark} />
                <AppText variant="caption" color={colors.status.warningDark} style={styles.sectionLabel}>
                  EN ATTENTE ({pending.length})
                </AppText>
              </View>
              {pending.map((aff) => {
                const driver = aff.delivery_persons;
                return (
                  <View key={aff.id} style={[styles.driverCard, styles.pendingCard]}>
                    <Avatar uri={driver?.photo_url} name={driver?.name || '?'} size={44} />
                    <View style={styles.driverInfo}>
                      <AppText variant="bodyStrong">{driver?.name || 'Livreur'}</AppText>
                      <AppText variant="caption" color={colors.text.muted}>
                        {driver?.phone}
                      </AppText>
                      {driver?.vehicle_type && (
                        <AppText variant="caption" color={colors.status.warningDark}>
                          {driver.vehicle_type.toUpperCase()}
                        </AppText>
                      )}
                    </View>
                    <View style={styles.pendingBadge}>
                      <AppText variant="overline" color={colors.status.warningDark}>
                        En attente
                      </AppText>
                    </View>
                    <AppPressable
                      onPress={() => handleRemove(aff.id, driver?.name)}
                      style={styles.removeBtn}
                      disabled={removingId === aff.id}
                      accessibilityLabel="Annuler l'invitation"
                      haptic="selection"
                    >
                      <X size={14} color={colors.text.muted} />
                    </AppPressable>
                  </View>
                );
              })}
            </>
          )}

          {/* Active section */}
          <View style={styles.sectionHeader}>
            <CheckCircle size={14} color={colors.status.successDark} />
            <AppText variant="caption" color={colors.status.successDark} style={styles.sectionLabel}>
              ACTIFS ({active.length})
            </AppText>
          </View>

          {active.length === 0 ? (
            <EmptyState
              icon={<Truck size={28} color={accent.DEFAULT} />}
              title="Aucun livreur actif"
              description="Invitez vos coursiers habituels via leur numéro de téléphone."
            />
          ) : (
            active.map((aff) => {
              const driver = aff.delivery_persons;
              return (
                <View key={aff.id} style={styles.driverCard}>
                  <Avatar uri={driver?.photo_url} name={driver?.name || '?'} size={44} />
                  <View style={styles.driverInfo}>
                    <AppText variant="bodyStrong">{driver?.name || 'Livreur Partenaire'}</AppText>
                    <AppText variant="caption" color={colors.text.muted}>
                      {driver?.phone}
                    </AppText>
                    {driver?.vehicle_type && (
                      <AppText variant="caption" color={accent[700]}>
                        {driver.vehicle_type.toUpperCase()}
                      </AppText>
                    )}
                  </View>
                  <View style={[styles.activeBadge, { backgroundColor: colors.status.successLight }]}>
                    <CheckCircle size={11} color={colors.status.successDark} />
                    <AppText variant="overline" color={colors.status.successDark}>
                      Actif
                    </AppText>
                  </View>
                  <AppPressable
                    onPress={() => handleRemove(aff.id, driver?.name)}
                    style={styles.removeBtn}
                    disabled={removingId === aff.id}
                    accessibilityLabel="Retirer ce livreur"
                    haptic="selection"
                  >
                    <X size={14} color={colors.text.muted} />
                  </AppPressable>
                </View>
              );
            })
          )}

          <View style={{ height: insets.bottom + spacing[6] }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  // ─── Pro gate ───
  proGateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
  },
  proGateIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  proGateDesc: {
    maxWidth: 300,
  },
  proGateBtn: {
    marginTop: spacing[2],
  },
  // ─── Scroll ───
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    gap: spacing[3],
  },
  infoSub: {
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
  // ─── Invite card ───
  inviteCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    gap: spacing[2],
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 2,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  phoneInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing[3],
    height: 44,
    gap: spacing[2],
  },
  phoneIcon: {
    flexShrink: 0,
  },
  phoneInput: {
    flex: 1,
    color: colors.text.DEFAULT,
    fontSize: typography.sizes.base,
    fontFamily: typography.families.normal,
  },
  // ─── Section headers ───
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // ─── Driver cards ───
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    gap: spacing[3],
  },
  pendingCard: {
    borderColor: colors.status.warningBorder,
    backgroundColor: colors.status.warningLight,
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  pendingBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.md,
    backgroundColor: colors.status.warningLight,
    borderWidth: 1,
    borderColor: colors.status.warningBorder,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
