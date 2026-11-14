import { StyleSheet } from 'react-native';
import { FileText, Package, Boxes, UtensilsCrossed, ShoppingBag } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '@daloa/ui';

export const PACKAGE_TYPES = [
  { id: 'envelope', label: 'Pli scellé / Doc', icon: FileText },
  { id: 'small_parcel', label: 'Petit colis (< 1kg)', icon: Package },
  { id: 'parcel', label: 'Colis standard (< 3kg)', icon: Boxes },
  { id: 'food', label: 'Repas / Alimentaire', icon: UtensilsCrossed },
  { id: 'bulky', label: 'Colis lourd (< 10kg)', icon: ShoppingBag },
];

export interface ExpressFormState {
  packageType: string;
  packageDescription: string;
  isSealed: boolean;
  isFragile: boolean;
  isHandDelivery: boolean;
  pickupDistrict: string;
  pickupAddress: string;
  senderPhone: string;
  dropoffDistrict: string;
  dropoffAddress: string;
  recipientName: string;
  recipientPhone: string;
  payerRole: 'sender' | 'recipient';
  distanceKm: number;
  deliveryFee: number;
  driverNetGain: number;
}

export interface ExpressFormHandlers {
  setPackageType: (type: string) => void;
  setPackageDescription: (desc: string) => void;
  setIsSealed: (v: boolean) => void;
  setIsFragile: (v: boolean) => void;
  setIsHandDelivery: (v: boolean) => void;
  onOpenPickupDistrictPicker: () => void;
  setPickupAddress: (address: string) => void;
  setSenderPhone: (phone: string) => void;
  onOpenDropoffDistrictPicker: () => void;
  setDropoffAddress: (address: string) => void;
  setRecipientName: (name: string) => void;
  setRecipientPhone: (phone: string) => void;
  setPayerRole: (role: 'sender' | 'recipient') => void;
}

export interface ExpressFormFieldsProps {
  currentStep: number;
  state: ExpressFormState;
  handlers: ExpressFormHandlers;
}

export const expressFormStyles = StyleSheet.create({
  stepContainer: { gap: spacing[2] },
  stepHeaderTitle: { fontFamily: typography.families.extrabold, fontSize: 20, lineHeight: 26 },
  stepHeaderSubtitle: { marginBottom: spacing[2] },
  inputLabel: { marginTop: spacing[2], marginBottom: 4 },
  antiTheftBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing[2],
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  antiTheftTexts: { flex: 1, gap: 2 },
  antiTheftTitle: { fontFamily: typography.families.bold, fontSize: 12 },
  antiTheftSub: { fontSize: 11, lineHeight: 15 },
  pillsScroll: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingBottom: spacing[1] },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  optionsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginVertical: spacing[1],
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  optionDivider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.surface,
    color: colors.text.body,
    fontSize: 14,
    marginBottom: spacing[2],
  },
  sectionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing[2] },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bg.subtle,
    marginBottom: spacing[2],
  },
  rowInputs: { flexDirection: 'row', gap: spacing[2] },
  halfInput: { flex: 1 },
  payerRow: { flexDirection: 'row', gap: spacing[2] },
  payerOption: { flex: 1, padding: spacing[3], borderRadius: radii.lg },
  payerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  payerIconCircle: { width: 26, height: 26, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
});
