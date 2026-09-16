import { supabase } from '../supabase';

/**
 * Avis sur les livreurs — table `delivery_person_reviews`.
 *
 * À ne pas confondre avec `reviewsService`, qui cible la table `reviews`
 * (avis marketplace). Les avis livreurs ont leur propre table, avec le nom du
 * signataire dénormalisé (`reviewer_name`), et la moyenne est recopiée sur
 * `delivery_persons.rating` / `.total_reviews` après chaque dépôt.
 *
 * Ce service reprend exactement le contrat du web (`reviewService.ts`).
 */

export interface DriverReview {
  id: string;
  delivery_person_id: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const driverReviewsService = {
  /** Avis d'un livreur, du plus récent au plus ancien. */
  async getReviews(
    deliveryPersonId: string,
    page = 1,
    limit = 10,
  ): Promise<{ reviews: DriverReview[]; total: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('delivery_person_reviews')
      .select('*', { count: 'exact' })
      .eq('delivery_person_id', deliveryPersonId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return { reviews: (data || []) as DriverReview[], total: count || 0 };
  },

  /**
   * Dépose un avis puis recalcule la note moyenne du livreur.
   * Le recalcul est fait ici, comme sur le web, faute de trigger en base.
   */
  async addReview(params: {
    deliveryPersonId: string;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    comment?: string;
  }): Promise<DriverReview> {
    const { data: review, error } = await supabase
      .from('delivery_person_reviews')
      .insert({
        delivery_person_id: params.deliveryPersonId,
        reviewer_id: params.reviewerId,
        reviewer_name: params.reviewerName,
        rating: params.rating,
        comment: params.comment || null,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: all } = await supabase
      .from('delivery_person_reviews')
      .select('rating')
      .eq('delivery_person_id', params.deliveryPersonId);

    const total = all?.length || 0;
    const avg = total > 0 ? all!.reduce((s, r: any) => s + r.rating, 0) / total : 0;

    await supabase
      .from('delivery_persons')
      .update({ rating: Math.round(avg * 10) / 10, total_reviews: total })
      .eq('id', params.deliveryPersonId);

    return review as DriverReview;
  },
};
