export interface LegalNoticeSection {
  id: string;
  title: string;
  items: { label: string; value: string }[];
}

export const LEGAL_NOTICE_DATA: LegalNoticeSection[] = [
  {
    id: 'editor',
    title: 'Éditeur de la plateforme',
    items: [
      { label: 'Plateforme', value: 'DaloaMarket (daloamarket.com)' },
      { label: 'Directeur de la publication', value: 'OULOBO Elmas Tresor (ElmasCore)' },
      { label: 'Forme juridique', value: 'Entreprise individuelle, non immatriculée au RCCM à ce jour' },
      { label: 'Pôle Communication & Opérations', value: 'Armand J. & Diomandé (DNPH)' },
      { label: 'Adresse de l’éditeur', value: 'RueO21,68, Yopougon, Abidjan, Côte d’Ivoire' },
      { label: 'Zone d’activité', value: 'Daloa et sa région, Côte d’Ivoire' },
      { label: 'Contact officiel', value: 'contact@daloamarket.com' },
    ],
  },
  {
    id: 'hosting',
    title: 'Infrastructure Technique & Hébergement',
    items: [
      { label: 'Hébergeur Frontend', value: 'Netlify, Inc. (San Francisco, CA, USA)' },
      { label: 'Base de Données', value: 'Supabase Inc. (PostgreSQL Cloud chiffré)' },
      { label: 'Moteur Paiements & Escrow', value: 'Render Services / Money Fusion API' },
      { label: 'Nom de domaine', value: 'LWS (Ligne Web Services)' },
    ],
  },
  {
    id: 'ip',
    title: 'Propriété Intellectuelle & Marques',
    items: [
      { label: 'Marque DaloaMarket', value: 'Tous droits réservés © 2026 ELMAS' },
      { label: 'Code source & Design', value: 'Propriété exclusive de l’éditeur, architecture ElmasCore' },
      { label: 'Reproduction', value: 'Toute reproduction totale ou partielle sans autorisation écrite est formellement interdite.' },
    ],
  },
];
