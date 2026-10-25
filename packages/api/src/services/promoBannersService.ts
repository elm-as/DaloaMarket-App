import { supabase } from '../supabase';
import { PromoBanner, PromoBannerLinkType } from '@daloa/types';

export interface CreateSellerBannerPayload {
  sellerId: string;
  sponsorName: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  badgeText?: string;
  badgeColor?: string;
  linkType: PromoBannerLinkType;
  linkTarget?: string;
  durationDays: number;
  pricePaid: number;
  priority?: number;
}

export const promoBannersService = {
  /**
   * Calcule les dates de début et fin de diffusion
   */
  calculateDates(durationDays: number, startDate: Date = new Date()): { starts_at: string; ends_at: string } {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    return {
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    };
  },

  /**
   * Récupère les bannières actives ordonnées par priorité pour le carrousel
   */
  async getActiveBanners(): Promise<PromoBanner[]> {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      // Filtrage des dates de diffusion actives
      const filtered = data.filter((b: any) => {
        if (b.starts_at && b.starts_at > nowIso) return false;
        if (b.ends_at && b.ends_at < nowIso) return false;
        return true;
      });

      return filtered as unknown as PromoBanner[];
    } catch {
      return [];
    }
  },

  /**
   * Récupère les affiches créées par un vendeur Pro spécifique
   */
  async getSellerBanners(sellerId: string): Promise<PromoBanner[]> {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as unknown as PromoBanner[];
    } catch {
      return [];
    }
  },

  /**
   * Crée une demande d'affiche carrousel pour un vendeur Pro
   */
  async createSellerBanner(payload: CreateSellerBannerPayload): Promise<PromoBanner | null> {
    try {
      const { starts_at, ends_at } = this.calculateDates(payload.durationDays);

      const record = {
        seller_id: payload.sellerId,
        sponsor_name: payload.sponsorName,
        title: payload.title.trim(),
        subtitle: payload.subtitle?.trim() || null,
        image_url: payload.imageUrl.trim(),
        badge_text: payload.badgeText?.trim() || 'VEDETTE PRO',
        badge_color: payload.badgeColor || '#FF9800',
        link_type: payload.linkType,
        link_target: payload.linkTarget?.trim() || null,
        price_paid: 0,
        priority: 0,
        views_count: 0,
        clicks_count: 0,
        starts_at,
        ends_at,
        is_active: false,
      };

      const { data, error } = await supabase
        .from('promo_banners')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PromoBanner;
    } catch {
      return null;
    }
  },

  /**
   * Enregistre un clic sur une bannière promotionnelle
   */
  async trackBannerClick(bannerId: string): Promise<void> {
    try {
      await supabase
        .from('promo_banners')
        .update({
          clicks_count: (supabase as any).raw ? (supabase as any).raw('clicks_count + 1') : undefined,
        } as any)
        .eq('id', bannerId);
    } catch {
      // Ignorer pour analytics
    }
  },
};
