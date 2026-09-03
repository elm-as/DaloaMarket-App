/**
 * Tokens de couleurs DaloaMarket & DaloaDelivery
 * Exactement synchronisés avec DaloaMarket-v2 et DaloaDelivery web
 */
export const colors = {
  // Couleurs Primaires (Orange Daloa)
  primary: {
    DEFAULT: '#FF7F00',
    50: '#FFF4E6',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF7F00',
    600: '#F57C00',
    700: '#E65100',
    800: '#BF360C',
    900: '#7B1900',
  },

  // Couleurs Secondaires (Bleu Institutionnel)
  secondary: {
    DEFAULT: '#0066CC',
    50: '#E5F0FF',
    100: '#CCE0FF',
    200: '#99C2FF',
    300: '#66A3FF',
    400: '#3385FF',
    500: '#0066CC',
    600: '#0052A3',
    700: '#003D7A',
    800: '#002952',
    900: '#001429',
  },

  // Neutres & Surfaces (Thème Web Réel : Clair, épuré, cartes blanches)
  neutrals: {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
    background: '#F8F9FA',
    onSurface: '#1F2937',
    onSurfaceVariant: '#6B7280',
    outline: '#E5E7EB',
    outlineVariant: '#D1D5DB',
  },

  /**
   * Alias sémantiques — À UTILISER DANS LES ÉCRANS à la place des hex bruts.
   * Noms courts et intentionnels : colors.text.DEFAULT, colors.border.DEFAULT, colors.bg.surface…
   * (mappés sur grey/neutrals ci-dessus ; un seul endroit à changer pour re-thémer).
   */
  text: {
    DEFAULT: '#111827', // Titres & texte fort  (= grey.900)
    body: '#374151', //    Corps de texte      (= grey.700)
    muted: '#6B7280', //   Secondaire / légende (= grey.500)
    subtle: '#9CA3AF', //  Placeholder / hint   (= grey.400)
    inverse: '#FFFFFF', // Texte sur fond coloré
  },
  border: {
    DEFAULT: '#E5E7EB', // Bordures de cartes/inputs (= grey.200)
    strong: '#D1D5DB', //  Bordure marquée           (= grey.300)
    subtle: '#F3F4F6', //  Séparateurs légers        (= grey.100)
  },
  bg: {
    DEFAULT: '#F8F9FA', // Fond d'écran
    surface: '#FFFFFF', // Cartes & feuilles
    subtle: '#F3F4F6', //  Champs, chips, pastilles
    inverse: '#111827', //Fond sombre ponctuel
  },

  // Nuances de Gris
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Statuts & Sémantique
  status: {
    success: '#10B981',
    successLight: '#ECFDF5',
    successBorder: '#A7F3D0',
    successDark: '#047857',

    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    warningBorder: '#FDE68A',
    warningDark: '#B45309',

    error: '#EF4444',
    errorLight: '#FEF2F2',
    errorBorder: '#FECACA',
    errorDark: '#DC2626',

    info: '#3B82F6',
    infoLight: '#EFF6FF',
    infoBorder: '#BFDBFE',
    infoDark: '#1D4ED8',

    escrow: '#F59E0B',
    escrowLight: '#FFFBEB',
  },

  // Communication & Réseaux Partenaires
  whatsapp: '#25D366',
  whatsappDark: '#128C7E',

  // Réseaux Mobile Money
  networks: {
    wave: '#1DC4FF',
    orange: '#FF7900',
    mtn: '#FFCC00',
    moov: '#006699',
  },

  // Catégories Produits (Codes couleur officiels du web)
  categories: {
    fashion: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
    electronics: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
    home: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    vehicles: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    sports: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    books: { bg: '#ECFEFF', text: '#0891B2', border: '#A5F3FC' },
    food: { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' },
  },

  // Compatibilité rétroactive
  market: {
    primary: '#FF7F00',
    primaryDark: '#E65100',
    primaryLight: '#FFF4E6',
    primaryGlow: 'rgba(255, 127, 0, 0.25)',
    accent: '#10B981',
    accentLight: '#ECFDF5',
  },

  delivery: {
    primary: '#FF7F00',
    primaryDark: '#E65100',
    primaryLight: '#FFF4E6',
    secondary: '#0066CC',
    secondaryLight: '#E5F0FF',
    statusOnline: '#10B981',
    statusOffline: '#6B7280',
  },
};
