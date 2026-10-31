import React from 'react';
import { View, TextInput } from 'react-native';
import {
  colors,
  Button,
  AppText,
  AppPressable,
  useAccent,
  showAlert,
} from '@daloa/ui';
import {
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
} from 'lucide-react-native';
import { formatFCFA, isPickupMode } from '@daloa/utils';
import { orderTrackingStyles as styles } from './orderTrackingStyles';

interface OrderSellerActionCardsProps {
  order: any;
  isSellerActing: boolean;
  enteredPickupOtp: string;
  onPickupOtpChange: (val: string) => void;
  onConfirmAvailability: () => void;
  onCancelUnavailable: () => void;
  onDispatchCod: () => void;
  onConfirmCodHandover: () => void;
  onCompletePickup: (withOtp: boolean) => void;
}

export function OrderSellerActionCards({
  order,
  isSellerActing,
  enteredPickupOtp,
  onPickupOtpChange,
  onConfirmAvailability,
  onCancelUnavailable,
  onDispatchCod,
  onConfirmCodHandover,
  onCompletePickup,
}: OrderSellerActionCardsProps) {
  const accent = useAccent();
  const assignment = order.delivery_assignment;
  const isPickup = isPickupMode(order.delivery_mode);
  const isCod = order.payment_method === 'cod';

  return (
    <>
      {/* ── Actions vendeur : confirmation de disponibilité ── */}
      {!isPickup &&
        !isCod &&
        (assignment?.status === 'pending_seller_confirmation' ||
          assignment?.status === 'pending') && (
          <View style={styles.sellerActionCard}>
            <View style={styles.sellerActionHeader}>
              <Package size={18} color={accent[600]} />
              <AppText variant="bodyStrong" color={accent[700]}>
                Confirmez que vous avez l’article
              </AppText>
            </View>
            <AppText variant="caption" color={colors.text.muted}>
              Aucun livreur ne peut prendre cette course avant votre confirmation.
              Cela évite qu’un livreur se déplace pour un article indisponible.
            </AppText>
            <Button
              title="J’ai l’article : Confirmer"
              variant="market"
              size="md"
              loading={isSellerActing}
              onPress={onConfirmAvailability}
              leftIcon={<CheckCircle2 size={16} color={colors.text.inverse} />}
              fullWidth
              style={styles.verifyBtn}
            />
            <Button
              title="Je n'ai plus le produit : annuler"
              variant="ghost"
              size="sm"
              disabled={isSellerActing}
              onPress={onCancelUnavailable}
              fullWidth
            />
          </View>
        )}

      {/* ── Actions vendeur : paiement à la livraison (aucun séquestre, aucun coursier) ── */}
      {!isPickup &&
        isCod &&
        ['pending', 'paid', 'in_transit'].includes(order.status) && (
          <View style={styles.sellerActionCard}>
            <View style={styles.sellerActionHeader}>
              <Truck size={18} color={accent[600]} />
              <AppText variant="bodyStrong" color={accent[700]}>
                Paiement à la livraison
              </AppText>
            </View>
            <AppText variant="caption" color={colors.text.muted}>
              Préparez le colis pour {order.delivery_address || 'Daloa'} et encaissez{' '}
              {formatFCFA(order.total_amount)} au moment de la remise.
            </AppText>
            {order.status === 'in_transit' ? (
              <Button
                title="Confirmer la remise & l'encaissement"
                variant="success"
                size="md"
                loading={isSellerActing}
                onPress={onConfirmCodHandover}
                leftIcon={<CheckCircle2 size={16} color={colors.text.inverse} />}
                fullWidth
                style={styles.verifyBtn}
              />
            ) : (
              <Button
                title="Marquer le colis comme expédié"
                variant="market"
                size="md"
                loading={isSellerActing}
                onPress={onDispatchCod}
                leftIcon={<Package size={16} color={colors.text.inverse} />}
                fullWidth
                style={styles.verifyBtn}
              />
            )}
            <Button
              title="Je n'ai plus le produit : annuler"
              variant="ghost"
              size="sm"
              disabled={isSellerActing}
              onPress={onCancelUnavailable}
              fullWidth
            />
          </View>
        )}

      {/* ── Actions vendeur : validation du retrait en boutique ── */}
      {isPickup &&
        order.status !== 'delivered' &&
        order.status !== 'cancelled' && (
          <View style={styles.sellerActionCard}>
            <View style={styles.sellerActionHeader}>
              <ShieldCheck size={18} color={accent[600]} />
              <AppText variant="bodyStrong" color={accent[700]}>
                Valider le retrait en boutique
              </AppText>
            </View>
            <AppText variant="caption" color={colors.text.muted}>
              Demandez son code à l’acheteur et saisissez-le ici. Le code est
              vérifié par le serveur : 5 tentatives maximum.
            </AppText>
            <TextInput
              style={styles.otpField}
              keyboardType="number-pad"
              placeholder="Code de l’acheteur"
              placeholderTextColor={colors.text.subtle}
              value={enteredPickupOtp}
              onChangeText={(t) => onPickupOtpChange(t.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            <Button
              title="Vérifier le code et remettre l’article"
              variant="market"
              size="md"
              loading={isSellerActing}
              onPress={() => onCompletePickup(true)}
              leftIcon={<CheckCircle2 size={16} color={colors.text.inverse} />}
              fullWidth
              style={styles.verifyBtn}
            />
            {/* Sans code, le serveur refuse de libérer un séquestre au
                profit du vendeur : l'option ne vaut que pour le paiement en
                boutique, où aucun argent ne transite par DaloaMarket. */}
            {order.payment_method !== 'online' && (
              <AppPressable
                onPress={() =>
                  showAlert(
                    'Remise sans code',
                    "À n'utiliser que si l'acheteur n'a pas son code. La remise sera enregistrée sans vérification.",
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Confirmer la remise', onPress: () => onCompletePickup(false) },
                    ]
                  )
                }
                style={styles.linkBtn}
              >
                <AppText variant="caption" color={colors.text.muted}>
                  L’acheteur n’a pas son code
                </AppText>
              </AppPressable>
            )}
            {['pending', 'paid', 'confirmed'].includes(order.status) && (
              <Button
                title="Je n'ai plus le produit : annuler"
                variant="ghost"
                size="sm"
                disabled={isSellerActing}
                onPress={onCancelUnavailable}
                fullWidth
              />
            )}
          </View>
        )}
    </>
  );
}

