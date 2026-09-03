import { supabase } from '../supabase';

export const reviewsService = {
  /**
   * Récupère les avis pour un vendeur, un livreur ou un article
   */
  async getReviewsForTarget(targetType: 'seller' | 'driver' | 'listing', targetId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:reviewer_id(full_name, avatar_url)')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Publie un nouvel avis
   */
  async addReview(params: {
    targetType: 'seller' | 'driver';
    targetId: string;
    reviewerId: string;
    orderId?: string | null;
    rating: number;
    comment: string;
  }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        target_type: params.targetType,
        target_id: params.targetId,
        reviewer_id: params.reviewerId,
        order_id: params.orderId || null,
        rating: params.rating,
        comment: params.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
