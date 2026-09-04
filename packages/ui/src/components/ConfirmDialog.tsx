import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, LogOut, CheckCircle2, Info } from 'lucide-react-native';
import { colors, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';
import { Haptics } from '@daloa/utils';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TYPE_CONFIG = {
  danger: {
    icon: LogOut,
    iconColor: colors.status.error,
    badgeBg: '#FEF2F2',
    badgeBorder: '#FEE2E2',
    btnBg: colors.status.error,
    btnText: colors.text.inverse,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#D97706',
    badgeBg: '#FFFBEB',
    badgeBorder: '#FEF3C7',
    btnBg: '#D97706',
    btnText: colors.text.inverse,
  },
  success: {
    icon: CheckCircle2,
    iconColor: '#059669',
    badgeBg: '#ECFDF5',
    badgeBorder: '#D1FAE5',
    btnBg: '#059669',
    btnText: colors.text.inverse,
  },
  info: {
    icon: Info,
    iconColor: '#2563EB',
    badgeBg: '#EFF6FF',
    badgeBorder: '#DBEAFE',
    btnBg: '#2563EB',
    btnText: colors.text.inverse,
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.danger;
  const IconComponent = config.icon;

  const handleConfirmPress = () => {
    if (isLoading) return;
    Haptics.mediumImpact();
    void onConfirm();
  };

  const handleCancelPress = () => {
    if (isLoading) return;
    Haptics.lightImpact();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancelPress}
    >
      <TouchableWithoutFeedback onPress={handleCancelPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              {/* Badge d'icône supérieur */}
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: config.badgeBg, borderColor: config.badgeBorder },
                ]}
              >
                <IconComponent size={24} color={config.iconColor} strokeWidth={2.2} />
              </View>

              {/* Textes explicatifs */}
              <AppText variant="title" color={colors.text.DEFAULT} center style={styles.title}>
                {title}
              </AppText>
              <AppText variant="body" color={colors.text.muted} center style={styles.message}>
                {message}
              </AppText>

              {/* Boutons d'actions */}
              <View style={styles.buttonRow}>
                <AppPressable
                  haptic="light"
                  onPress={handleCancelPress}
                  disabled={isLoading}
                  style={styles.cancelBtn}
                  accessibilityLabel={cancelText}
                >
                  <AppText variant="label" color={colors.text.body}>
                    {cancelText}
                  </AppText>
                </AppPressable>

                <AppPressable
                  haptic="medium"
                  onPress={handleConfirmPress}
                  disabled={isLoading}
                  style={[styles.confirmBtn, { backgroundColor: config.btnBg }]}
                  accessibilityLabel={confirmText}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={config.btnText} />
                  ) : (
                    <AppText variant="label" color={config.btnText}>
                      {confirmText}
                    </AppText>
                  )}
                </AppPressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg.DEFAULT,
    borderRadius: radii['2xl'],
    padding: spacing[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grey[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    marginBottom: spacing[2],
  },
  message: {
    lineHeight: 20,
    marginBottom: spacing[5],
    paddingHorizontal: spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.grey[300],
    backgroundColor: colors.bg.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
