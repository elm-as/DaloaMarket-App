import { supabase } from '../supabase';

/*
 * Avis vendeurs et articles.
 *
 * Ce service filtrait sur `target_type` / `target_id`, colonnes qui n'existent
 * pas : la requête échouait et la fiche article n'affichait jamais d'avis. La
 * table `reviews` porte `reviewed_id` (le vendeur noté) et `listing_id`, comme
 * côté web (ReviewForm, ProfileReviewsTab). Les avis livreurs vivent dans
 * `delivery_person_reviews` (voir driverReviewsService).
 */
/** Forme commune affichée par les écrans, quel que soit le type d'avis. */
export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { full_name: string; avatar_url: string | null };
}

export const reviewsService = {
  /**
   * Récupère les avis pour un vendeur, un livreur ou un article
   */
  async getReviewsForTarget(targetType: 'seller' | 'driver' | 'listing', targetId: string): Promise<ReviewItem[]> {
    if (targetType === 'driver') {
      const { data, error } = await supabase
        .from('delivery_person_reviews')
        .select('*')
        .eq('delivery_person_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id,
        rating: r.rating ?? 0,
        comment: r.comment,
        created_at: r.created_at ?? '',
        reviewer: { full_name: r.reviewer_name || 'Utilisateur', avatar_url: null },
      }));
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:users!reviews_reviewer_id_fkey(full_name, avatar_url)')
      .eq(targetType === 'seller' ? 'reviewed_id' : 'listing_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Auteur supprimé : l'écran lit `reviewer.full_name` sans garde.
    return (data || []).map((r: any) => ({
      id: r.id,
      rating: r.rating ?? 0,
      comment: r.comment ?? null,
      created_at: r.created_at ?? '',
      reviewer: {
        full_name: r.reviewer?.full_name || 'Utilisateur',
        avatar_url: r.reviewer?.avatar_url ?? null,
      },
    }));
  },
  /**
   * Publie un avis sur un vendeur, rattaché à l'article acheté.
   */
  async addReview(params: {
    sellerId: string;
    listingId: string;
    reviewerId: string;
    rating: number;
    comment: string;
  }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: params.reviewerId,
        reviewed_id: params.sellerId,
        listing_id: params.listingId,
        rating: params.rating,
        comment: params.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
