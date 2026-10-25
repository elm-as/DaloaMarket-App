import { supabase } from '../supabase';
import { PromoBanner } from '@daloa/types';

export const promoBannersService = {
  /**
   * Récupère les bannières actives ordonnées par priorité
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

      return filtered as PromoBanner[];
    } catch {
      return [];
    }
  },

  /**
   * Enregistre un clic sur une bannière promotionnelle
   */
  async trackBannerClick(bannerId: string): Promise<void> {
    try {
      // Incrémentation silencieuse
      await supabase.from('promo_banners').update({
        clicks_count: (supabase as any).raw ? (supabase as any).raw('clicks_count + 1') : undefined,
      } as any).eq('id', bannerId);
    } catch {
      // Ignorer pour analytics
    }
  },
};
