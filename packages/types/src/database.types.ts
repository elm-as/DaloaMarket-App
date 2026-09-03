export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'buyer' | 'seller' | 'delivery' | 'admin' | string;
          district: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          shop_name: string | null;
          shop_description: string | null;
          shop_logo_url: string | null;
          shop_banner_url: string | null;
          shop_slug: string | null;
          shop_latitude: number | null;
          shop_longitude: number | null;
          cash_on_delivery_enabled: boolean;
          rating: number | null;
          review_count: number;
          pro_until: string | null;
          credits: number;
          is_banned: boolean;
          ban_reason: string | null;
          banned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'buyer' | 'seller' | 'delivery' | 'admin' | string;
          district?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          shop_name?: string | null;
          shop_description?: string | null;
          shop_logo_url?: string | null;
          shop_banner_url?: string | null;
          shop_slug?: string | null;
          shop_latitude?: number | null;
          shop_longitude?: number | null;
          cash_on_delivery_enabled?: boolean;
          rating?: number | null;
          review_count?: number;
          pro_until?: string | null;
          credits?: number;
          is_banned?: boolean;
          ban_reason?: string | null;
          banned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'buyer' | 'seller' | 'delivery' | 'admin' | string;
          district?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          shop_name?: string | null;
          shop_description?: string | null;
          shop_logo_url?: string | null;
          shop_banner_url?: string | null;
          shop_slug?: string | null;
          shop_latitude?: number | null;
          shop_longitude?: number | null;
          cash_on_delivery_enabled?: boolean;
          rating?: number | null;
          review_count?: number;
          pro_until?: string | null;
          credits?: number;
          is_banned?: boolean;
          ban_reason?: string | null;
          banned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          price: number;
          original_price: number | null;
          category: string;
          condition: 'new' | 'like_new' | 'good' | 'used' | string;
          district: string;
          photos: string[];
          stock: number;
          accepts_delivery: boolean;
          delivery_fee_override: number | null;
          status: 'active' | 'sold' | 'archived' | 'pending_moderation' | string;
          boosted_until: string | null;
          views_count: number;
          favorites_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          price: number;
          original_price?: number | null;
          category: string;
          condition?: 'new' | 'like_new' | 'good' | 'used' | string;
          district: string;
          photos?: string[];
          stock?: number;
          accepts_delivery?: boolean;
          delivery_fee_override?: number | null;
          status?: 'active' | 'sold' | 'archived' | 'pending_moderation' | string;
          boosted_until?: string | null;
          views_count?: number;
          favorites_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          price?: number;
          original_price?: number | null;
          category?: string;
          condition?: 'new' | 'like_new' | 'good' | 'used' | string;
          district?: string;
          photos?: string[];
          stock?: number;
          accepts_delivery?: boolean;
          delivery_fee_override?: number | null;
          status?: 'active' | 'sold' | 'archived' | 'pending_moderation' | string;
          boosted_until?: string | null;
          views_count?: number;
          favorites_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      listing_variants: {
        Row: {
          id: string;
          listing_id: string;
          label: string;
          color: string | null;
          color_code: string | null;
          size: string | null;
          price: number | null;
          stock: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          label: string;
          color?: string | null;
          color_code?: string | null;
          size?: string | null;
          price?: number | null;
          stock?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          label?: string;
          color?: string | null;
          color_code?: string | null;
          size?: string | null;
          price?: number | null;
          stock?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          listing_id: string;
          variant_id: string | null;
          variant_label: string | null;
          unit_price: number;
          quantity: number;
          product_amount: number;
          delivery_fee: number;
          buyer_fee: number;
          seller_fee: number;
          total_amount: number;
          status: 'pending_payment' | 'paid' | 'preparing' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'disputed' | 'cancelled' | 'refunded' | string;
          delivery_mode: 'delivery' | 'pickup' | string;
          payment_method: 'wave' | 'orange' | 'mtn' | 'moov' | 'cash_on_delivery' | string;
          delivery_address: string | null;
          delivery_district: string | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          buyer_notes: string | null;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          seller_id: string;
          listing_id: string;
          variant_id?: string | null;
          variant_label?: string | null;
          unit_price: number;
          quantity?: number;
          product_amount: number;
          delivery_fee?: number;
          buyer_fee?: number;
          seller_fee?: number;
          total_amount: number;
          status?: 'pending_payment' | 'paid' | 'preparing' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'disputed' | 'cancelled' | 'refunded' | string;
          delivery_mode?: 'delivery' | 'pickup' | string;
          payment_method?: 'wave' | 'orange' | 'mtn' | 'moov' | 'cash_on_delivery' | string;
          delivery_address?: string | null;
          delivery_district?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          buyer_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          seller_id?: string;
          listing_id?: string;
          variant_id?: string | null;
          variant_label?: string | null;
          unit_price?: number;
          quantity?: number;
          product_amount?: number;
          delivery_fee?: number;
          buyer_fee?: number;
          seller_fee?: number;
          total_amount?: number;
          status?: 'pending_payment' | 'paid' | 'preparing' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'disputed' | 'cancelled' | 'refunded' | string;
          delivery_mode?: 'delivery' | 'pickup' | string;
          payment_method?: 'wave' | 'orange' | 'mtn' | 'moov' | 'cash_on_delivery' | string;
          delivery_address?: string | null;
          delivery_district?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          buyer_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_assignments: {
        Row: {
          id: string;
          order_id: string;
          delivery_person_id: string | null;
          status: 'pending_seller_confirmation' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'auto_released' | 'disputed' | 'cancelled' | string;
          pickup_location: string;
          dropoff_location: string;
          delivery_price: number;
          driver_fee: number;
          is_private: boolean;
          pickup_otp: string;
          delivery_otp: string;
          pickup_otp_attempts: number;
          delivery_otp_attempts: number;
          pickup_confirmed_by_seller: boolean;
          pickup_confirmed_at: string | null;
          accepted_at: string | null;
          delivered_at: string | null;
          buyer_confirmed_at: string | null;
          pickup_photo_url: string | null;
          delivery_photo_url: string | null;
          pickup_gps: Json | null;
          delivery_gps: Json | null;
          pickup_gps_distance_m: number | null;
          delivery_gps_distance_m: number | null;
          disputed_at: string | null;
          dispute_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          delivery_person_id?: string | null;
          status?: 'pending_seller_confirmation' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'auto_released' | 'disputed' | 'cancelled' | string;
          pickup_location: string;
          dropoff_location: string;
          delivery_price: number;
          driver_fee?: number;
          is_private?: boolean;
          pickup_otp?: string;
          delivery_otp?: string;
          pickup_otp_attempts?: number;
          delivery_otp_attempts?: number;
          pickup_confirmed_by_seller?: boolean;
          pickup_confirmed_at?: string | null;
          accepted_at?: string | null;
          delivered_at?: string | null;
          buyer_confirmed_at?: string | null;
          pickup_photo_url?: string | null;
          delivery_photo_url?: string | null;
          pickup_gps?: Json | null;
          delivery_gps?: Json | null;
          pickup_gps_distance_m?: number | null;
          delivery_gps_distance_m?: number | null;
          disputed_at?: string | null;
          dispute_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          delivery_person_id?: string | null;
          status?: 'pending_seller_confirmation' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'auto_released' | 'disputed' | 'cancelled' | string;
          pickup_location?: string;
          dropoff_location?: string;
          delivery_price?: number;
          driver_fee?: number;
          is_private?: boolean;
          pickup_otp?: string;
          delivery_otp?: string;
          pickup_otp_attempts?: number;
          delivery_otp_attempts?: number;
          pickup_confirmed_by_seller?: boolean;
          pickup_confirmed_at?: string | null;
          accepted_at?: string | null;
          delivered_at?: string | null;
          buyer_confirmed_at?: string | null;
          pickup_photo_url?: string | null;
          delivery_photo_url?: string | null;
          pickup_gps?: Json | null;
          delivery_gps?: Json | null;
          pickup_gps_distance_m?: number | null;
          delivery_gps_distance_m?: number | null;
          disputed_at?: string | null;
          dispute_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_persons: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          phone: string;
          photo_url: string | null;
          cni_url: string | null;
          selfie_cni_url: string | null;
          portrait_live_url: string | null;
          is_available: boolean;
          is_verified: boolean;
          verification_status: 'none' | 'pending' | 'approved' | 'rejected';
          verification_rejection_reason: string | null;
          rating: number;
          total_reviews: number;
          vehicle_type: 'moto' | 'velo' | 'voiture' | 'triporteur' | string;
          vehicle_details: string | null;
          coverage_zones: string[];
          pricing_description: string | null;
          description: string | null;
          payout_network: string | null;
          payout_number: string | null;
          current_location: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          phone: string;
          photo_url?: string | null;
          cni_url?: string | null;
          selfie_cni_url?: string | null;
          portrait_live_url?: string | null;
          is_available?: boolean;
          is_verified?: boolean;
          verification_status?: 'none' | 'pending' | 'approved' | 'rejected';
          verification_rejection_reason?: string | null;
          rating?: number;
          total_reviews?: number;
          vehicle_type?: 'moto' | 'velo' | 'voiture' | 'triporteur' | string;
          vehicle_details?: string | null;
          coverage_zones?: string[];
          pricing_description?: string | null;
          description?: string | null;
          payout_network?: string | null;
          payout_number?: string | null;
          current_location?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          phone?: string;
          photo_url?: string | null;
          cni_url?: string | null;
          selfie_cni_url?: string | null;
          portrait_live_url?: string | null;
          is_available?: boolean;
          is_verified?: boolean;
          verification_status?: 'none' | 'pending' | 'approved' | 'rejected';
          verification_rejection_reason?: string | null;
          rating?: number;
          total_reviews?: number;
          vehicle_type?: 'moto' | 'velo' | 'voiture' | 'triporteur' | string;
          vehicle_details?: string | null;
          coverage_zones?: string[];
          pricing_description?: string | null;
          description?: string | null;
          payout_network?: string | null;
          payout_number?: string | null;
          current_location?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      escrow_transactions: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          status: 'held' | 'released' | 'refunded' | 'disputed' | string;
          transaction_ref: string | null;
          payment_network: string | null;
          release_scheduled_at: string | null;
          released_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          status?: 'held' | 'released' | 'refunded' | 'disputed' | string;
          transaction_ref?: string | null;
          payment_network?: string | null;
          release_scheduled_at?: string | null;
          released_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          status?: 'held' | 'released' | 'refunded' | 'disputed' | string;
          transaction_ref?: string | null;
          payment_network?: string | null;
          release_scheduled_at?: string | null;
          released_at?: string | null;
          created_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          user_id: string;
          recipient_type: 'seller' | 'driver' | string;
          amount: number;
          fee: number;
          net_amount: number;
          network: 'wave' | 'orange' | 'mtn' | 'moov' | string;
          phone: string;
          status: 'pending' | 'processing' | 'paid' | 'failed' | string;
          reference: string | null;
          notes: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_type: 'seller' | 'driver' | string;
          amount: number;
          fee?: number;
          net_amount: number;
          network: 'wave' | 'orange' | 'mtn' | 'moov' | string;
          phone: string;
          status?: 'pending' | 'processing' | 'paid' | 'failed' | string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipient_type?: 'seller' | 'driver' | string;
          amount?: number;
          fee?: number;
          net_amount?: number;
          network?: 'wave' | 'orange' | 'mtn' | 'moov' | string;
          phone?: string;
          status?: 'pending' | 'processing' | 'paid' | 'failed' | string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
      };
      payout_settings: {
        Row: {
          id: string;
          user_id: string;
          network: string;
          phone: string;
          account_name: string | null;
          is_active: boolean;
          locked_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          network: string;
          phone: string;
          account_name?: string | null;
          is_active?: boolean;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          network?: string;
          phone?: string;
          account_name?: string | null;
          is_active?: boolean;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      affiliated_deliverers: {
        Row: {
          id: string;
          seller_id: string;
          delivery_person_id: string;
          status: 'pending' | 'accepted' | 'rejected' | string;
          custom_delivery_fee: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          delivery_person_id: string;
          status?: 'pending' | 'accepted' | 'rejected' | string;
          custom_delivery_fee?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          delivery_person_id?: string;
          status?: 'pending' | 'accepted' | 'rejected' | string;
          custom_delivery_fee?: number | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          order_id: string | null;
          listing_id: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          listing_id?: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          listing_id?: string | null;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          is_read?: boolean;
          image_url?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          target_type: 'seller' | 'driver' | 'listing' | string;
          target_id: string;
          reviewer_id: string;
          order_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: 'seller' | 'driver' | 'listing' | string;
          target_id: string;
          reviewer_id: string;
          order_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          target_type?: 'seller' | 'driver' | 'listing' | string;
          target_id?: string;
          reviewer_id?: string;
          order_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          device_os: string | null;
          app_type: 'market' | 'delivery' | string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          device_os?: string | null;
          app_type?: 'market' | 'delivery' | string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          device_os?: string | null;
          app_type?: 'market' | 'delivery' | string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ban_appeals: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          reason: string;
          status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          reason: string;
          status?: 'pending' | 'reviewed' | 'rejected' | 'accepted';
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          reason?: string;
          status?: 'pending' | 'reviewed' | 'rejected' | 'accepted';
          admin_notes?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      verify_pickup_otp_with_gps: {
        Args: {
          p_assignment_id: string;
          p_entered_otp: string;
          p_photo_url: string;
          p_driver_lat: number;
          p_driver_lng: number;
        };
        Returns: {
          success: boolean;
          message?: string;
          status?: string;
        };
      };
      verify_delivery_otp_with_gps: {
        Args: {
          p_assignment_id: string;
          p_entered_otp: string;
          p_photo_url: string;
          p_driver_lat: number;
          p_driver_lng: number;
        };
        Returns: {
          success: boolean;
          message?: string;
          status?: string;
        };
      };
      report_order_dispute: {
        Args: {
          p_order_id: string;
          p_reason: string;
          p_proof_url?: string;
        };
        Returns: {
          success: boolean;
          message?: string;
        };
      };
      cancel_buyer_order: {
        Args: {
          p_order_id: string;
          p_reason: string;
        };
        Returns: {
          success: boolean;
          message?: string;
        };
      };
    };
  };
}
