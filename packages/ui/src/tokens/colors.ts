/**
 * Tokens de couleurs DaloaMarket & DaloaDelivery
 */
export const colors = {
  // Identité DaloaMarket (Marketplace)
  market: {
    primary: '#F97316', // Orange Daloa vif
    primaryDark: '#EA580C',
    primaryLight: '#FFEDD5',
    primaryGlow: 'rgba(249, 115, 22, 0.25)',
    accent: '#10B981', // Émeraude sécurité Escrow
    accentLight: '#D1FAE5',
  },

  // Identité DaloaDelivery (Livreurs & Flotte)
  delivery: {
    primary: '#06B6D4', // Cyan Électrique
    primaryDark: '#0891B2',
    primaryLight: '#CFFAFE',
    primaryGlow: 'rgba(6, 182, 212, 0.25)',
    accent: '#F97316', // Orange d'alerte et de course
    statusOnline: '#10B981',
    statusOffline: '#64748B',
  },

  // Nuances sombres pour le thème premium Dark/Navy
  dark: {
    background: '#0B0F17', // Fond noir profond bleuté
    surface: '#131B2A', // Carte / Surface élevée
    surfaceRaised: '#1E293B', // Modale / Élément flottant
    surfaceHover: '#26334A',
    border: '#1E293B', // Bordure subtile
    borderLight: '#334155',
    text: '#F8FAFC', // Texte principal
    textMuted: '#94A3B8', // Texte secondaire
    textDim: '#64748B', // Texte tertiaire / métadonnées
  },

  // Nuances claires
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceRaised: '#F1F5F9',
    surfaceHover: '#E2E8F0',
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
  },

  // Couleurs fonctionnelles
  status: {
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    error: '#EF4444',
    errorBg: 'rgba(239, 68, 68, 0.12)',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.12)',
    escrow: '#8B5CF6',
    escrowBg: 'rgba(139, 92, 246, 0.12)',
  },

  // Réseaux Mobile Money
  networks: {
    wave: '#1DC4FF',
    orange: '#FF7900',
    mtn: '#FFCC00',
    moov: '#006699',
  },
};
