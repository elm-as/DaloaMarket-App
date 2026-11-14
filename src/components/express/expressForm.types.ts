import { StyleSheet } from 'react-native';
import { FileText, Package, UtensilsCrossed, KeyRound } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '@daloa/ui';

export const PACKAGE_TYPES = [
  { id: 'parcel', label: 'Colis standard', icon: Package },
  { id: 'envelope', label: 'Pli / Document', icon: FileText },
  { id: 'food', label: 'Repas', icon: UtensilsCrossed },
  { id: 'keys_urgent', label: 'Clés / Urgent', icon: KeyRound },
] as const;

export interface ExpressFormState {
  packageType: string;
  packageDescription: string;
  isSealed: boolean;
  isFragile: boolean;
  pickupDistrict: string;
  pickupAddress: string;
  senderPhone: string;
  dropoffDistrict: string;
  dropoffAddress: string;
  recipientName: string;
  recipientPhone: string;
  payerRole: 'sender' | 'recipient';
}

export interface ExpressFormHandlers {
  setPackageType: (type: string) => void;
  setPackageDescription: (desc: string) => void;
  setIsSealed: (v: boolean) => void;
  setIsFragile: (v: boolean) => void;
  onOpenPickupDistrictPicker: () => void;
  setPickupAddress: (address: string) => void;
  setSenderPhone: (phone: string) => void;
  onOpenDropoffDistrictPicker: () => void;
  setDropoffAddress: (address: string) => void;
  setRecipientName: (name: string) => void;
  setRecipientPhone: (phone: string) => void;
  setPayerRole: (role: 'sender' | 'recipient') => void;
}

export const expressFormStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    gap: spacing[2] + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subBlock: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.grey[50],
    borderRadius: radii.lg,
    padding: spacing[2] + 4,
    gap: spacing[2],
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: typography.families.semibold,
    color: colors.text.body,
    marginBottom: 4,
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg.surface,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg.surface,
    color: colors.text.DEFAULT,
    fontSize: 14,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  typeTile: {
    width: '48%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing[2] + 4,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  payerRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  payerOption: {
    flex: 1,
    minHeight: 54,
    padding: spacing[2] + 4,
    borderRadius: radii.lg,
    gap: 2,
  },
  payerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  securityNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
