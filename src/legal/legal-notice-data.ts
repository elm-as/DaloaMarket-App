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
      { label: 'Fondateur & Lead Dev', value: 'OULOBO Elmas Tresor (ElmasCore)' },
      { label: 'Pôle Communication & Opérations', value: 'Armand J. & Diomandé (DNPH)' },
      { label: 'Siège Opérationnel', value: 'Daloa / Abidjan, République de Côte d’Ivoire' },
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
      { label: 'Code source & Design', value: 'Propriété exclusive de l’éditeur — Architecture ElmasCore' },
      { label: 'Reproduction', value: 'Toute reproduction totale ou partielle sans autorisation écrite est formellement interdite.' },
    ],
  },
];
