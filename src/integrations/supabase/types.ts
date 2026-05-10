export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athletes: {
        Row: {
          birth_date: string
          city: string
          club: string | null
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          is_self: boolean
          owner_id: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          city: string
          club?: string | null
          created_at?: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_self?: boolean
          owner_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          city?: string
          club?: string | null
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_self?: boolean
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athletes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          distances: string | null
          event_date: string
          id: string
          location: string | null
          notes: string | null
          organizer_name: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          distances?: string | null
          event_date: string
          id?: string
          location?: string | null
          notes?: string | null
          organizer_name?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          distances?: string | null
          event_date?: string
          id?: string
          location?: string | null
          notes?: string | null
          organizer_name?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      clubs: {
        Row: {
          activity_types: Database["public"]["Enums"]["club_activity_type"][]
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          members_count: number | null
          name: string
          owner_id: string
          slug: string | null
          strava_url: string | null
          telegram_url: string | null
          training_location: string | null
          training_schedule: string | null
          updated_at: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          activity_types?: Database["public"]["Enums"]["club_activity_type"][]
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          members_count?: number | null
          name: string
          owner_id: string
          slug?: string | null
          strava_url?: string | null
          telegram_url?: string | null
          training_location?: string | null
          training_schedule?: string | null
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          activity_types?: Database["public"]["Enums"]["club_activity_type"][]
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          members_count?: number | null
          name?: string
          owner_id?: string
          slug?: string | null
          strava_url?: string | null
          telegram_url?: string | null
          training_location?: string | null
          training_schedule?: string | null
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      distances: {
        Row: {
          bib_start: number | null
          created_at: string
          delivery_enabled: boolean
          distance_km: number
          distance_tolerance_percent: number
          event_id: string
          id: string
          is_active: boolean
          is_relay: boolean
          is_virtual: boolean
          max_participants: number | null
          name: string | null
          price: number
          relay_categories: string[]
          relay_legs: Json | null
          relay_legs_count: number | null
          virtual_end_date: string | null
          virtual_end_time: string | null
          virtual_start_date: string | null
          virtual_start_time: string | null
        }
        Insert: {
          bib_start?: number | null
          created_at?: string
          delivery_enabled?: boolean
          distance_km: number
          distance_tolerance_percent?: number
          event_id: string
          id?: string
          is_active?: boolean
          is_relay?: boolean
          is_virtual?: boolean
          max_participants?: number | null
          name?: string | null
          price?: number
          relay_categories?: string[]
          relay_legs?: Json | null
          relay_legs_count?: number | null
          virtual_end_date?: string | null
          virtual_end_time?: string | null
          virtual_start_date?: string | null
          virtual_start_time?: string | null
        }
        Update: {
          bib_start?: number | null
          created_at?: string
          delivery_enabled?: boolean
          distance_km?: number
          distance_tolerance_percent?: number
          event_id?: string
          id?: string
          is_active?: boolean
          is_relay?: boolean
          is_virtual?: boolean
          max_participants?: number | null
          name?: string | null
          price?: number
          relay_categories?: string[]
          relay_legs?: Json | null
          relay_legs_count?: number | null
          virtual_end_date?: string | null
          virtual_end_time?: string | null
          virtual_start_date?: string | null
          virtual_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_chat_messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          event_id: string
          id: string
          is_pinned: boolean
          pinned_at: string | null
          pinned_by: string | null
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          event_id: string
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          event_id?: string
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chat_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "event_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_chat_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "event_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_chat_reads: {
        Row: {
          created_at: string
          event_id: string
          id: string
          last_read_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          last_read_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          last_read_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_co_organizers: {
        Row: {
          added_by: string | null
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_gpx_tracks: {
        Row: {
          created_at: string
          distance_id: string | null
          event_id: string
          file_size: number | null
          file_url: string
          id: string
          name: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          distance_id?: string | null
          event_id: string
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          distance_id?: string | null
          event_id?: string
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_gpx_tracks_distance_id_fkey"
            columns: ["distance_id"]
            isOneToOne: false
            referencedRelation: "distances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_gpx_tracks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_np_sender_settings: {
        Row: {
          cargo_description: string
          cargo_type: string
          cost: number
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          payer_type: string
          payment_method: string
          seats_amount: number
          sender_address_name: string | null
          sender_address_ref: string
          sender_city_name: string | null
          sender_city_ref: string
          sender_contact_ref: string
          sender_phone: string
          sender_ref: string
          service_type: string
          updated_at: string
          volume_height: number
          volume_length: number
          volume_width: number
          weight: number
        }
        Insert: {
          cargo_description?: string
          cargo_type?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          payer_type?: string
          payment_method?: string
          seats_amount?: number
          sender_address_name?: string | null
          sender_address_ref: string
          sender_city_name?: string | null
          sender_city_ref: string
          sender_contact_ref: string
          sender_phone: string
          sender_ref: string
          service_type?: string
          updated_at?: string
          volume_height?: number
          volume_length?: number
          volume_width?: number
          weight?: number
        }
        Update: {
          cargo_description?: string
          cargo_type?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          payer_type?: string
          payment_method?: string
          seats_amount?: number
          sender_address_name?: string | null
          sender_address_ref?: string
          sender_city_name?: string | null
          sender_city_ref?: string
          sender_contact_ref?: string
          sender_phone?: string
          sender_ref?: string
          service_type?: string
          updated_at?: string
          volume_height?: number
          volume_length?: number
          volume_width?: number
          weight?: number
        }
        Relationships: []
      }
      event_payment_settings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          liqpay_private_key: string | null
          liqpay_public_key: string | null
          provider: string
          updated_at: string
          wayforpay_merchant_domain: string | null
          wayforpay_merchant_login: string | null
          wayforpay_secret_key: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          liqpay_private_key?: string | null
          liqpay_public_key?: string | null
          provider?: string
          updated_at?: string
          wayforpay_merchant_domain?: string | null
          wayforpay_merchant_login?: string | null
          wayforpay_secret_key?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          liqpay_private_key?: string | null
          liqpay_public_key?: string | null
          provider?: string
          updated_at?: string
          wayforpay_merchant_domain?: string | null
          wayforpay_merchant_login?: string | null
          wayforpay_secret_key?: string | null
        }
        Relationships: []
      }
      event_results: {
        Row: {
          activity_start_date: string | null
          created_at: string
          distance_id: string
          distance_meters: number | null
          event_id: string
          id: string
          moving_time_seconds: number | null
          notes: string | null
          registration_id: string
          source: string
          strava_activity_id: number | null
          time_seconds: number
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          activity_start_date?: string | null
          created_at?: string
          distance_id: string
          distance_meters?: number | null
          event_id: string
          id?: string
          moving_time_seconds?: number | null
          notes?: string | null
          registration_id: string
          source?: string
          strava_activity_id?: number | null
          time_seconds: number
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          activity_start_date?: string | null
          created_at?: string
          distance_id?: string
          distance_meters?: number | null
          event_id?: string
          id?: string
          moving_time_seconds?: number | null
          notes?: string | null
          registration_id?: string
          source?: string
          strava_activity_id?: number | null
          time_seconds?: number
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          changes_deadline_days: number
          created_at: string
          description: string | null
          description_image_url: string | null
          event_date: string
          event_time: string
          format: Database["public"]["Enums"]["event_format"]
          id: string
          image_url: string | null
          is_paid: boolean
          location: string | null
          organizer_id: string
          organizer_name: string
          payment_url: string | null
          photos_url: string | null
          registration_closed: boolean
          regulations_pdf_url: string | null
          results_pdf_url: string | null
          results_url: string | null
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["event_category"]
          changes_deadline_days?: number
          created_at?: string
          description?: string | null
          description_image_url?: string | null
          event_date: string
          event_time: string
          format?: Database["public"]["Enums"]["event_format"]
          id?: string
          image_url?: string | null
          is_paid?: boolean
          location?: string | null
          organizer_id: string
          organizer_name: string
          payment_url?: string | null
          photos_url?: string | null
          registration_closed?: boolean
          regulations_pdf_url?: string | null
          results_pdf_url?: string | null
          results_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          changes_deadline_days?: number
          created_at?: string
          description?: string | null
          description_image_url?: string | null
          event_date?: string
          event_time?: string
          format?: Database["public"]["Enums"]["event_format"]
          id?: string
          image_url?: string | null
          is_paid?: boolean
          location?: string | null
          organizer_id?: string
          organizer_name?: string
          payment_url?: string | null
          photos_url?: string | null
          registration_closed?: boolean
          regulations_pdf_url?: string | null
          results_pdf_url?: string | null
          results_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_carousel_slides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean
          position: number
          storage_path: string | null
          title_en: string | null
          title_uk: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          position?: number
          storage_path?: string | null
          title_en?: string | null
          title_uk?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          position?: number
          storage_path?: string | null
          title_en?: string | null
          title_uk?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      liqpay_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_reference: string
          raw_callback: Json | null
          registration_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_reference: string
          raw_callback?: Json | null
          registration_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_reference?: string
          raw_callback?: Json | null
          registration_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          audience_filter: Json
          created_at: string
          created_by: string
          event_ids: string[]
          failed_count: number
          id: string
          intro_text: string | null
          recipient_count: number
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          created_at?: string
          created_by: string
          event_ids?: string[]
          failed_count?: number
          id?: string
          intro_text?: string | null
          recipient_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          created_at?: string
          created_by?: string
          event_ids?: string[]
          failed_count?: number
          id?: string
          intro_text?: string | null
          recipient_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          provider: Database["public"]["Enums"]["payment_provider_type"]
          provider_order_id: string | null
          provider_payment_id: string | null
          registration_id: string
          status: Database["public"]["Enums"]["payment_status_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider_type"]
          provider_order_id?: string | null
          provider_payment_id?: string | null
          registration_id: string
          status?: Database["public"]["Enums"]["payment_status_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider_type"]
          provider_order_id?: string | null
          provider_payment_id?: string | null
          registration_id?: string
          status?: Database["public"]["Enums"]["payment_status_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          club: string | null
          created_at: string
          email: string
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          marketing_consent: boolean
          marketing_consent_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          club?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          club?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          created_at: string
          discount_amount: number
          event_id: string
          id: string
          promo_code_id: string
          registration_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount: number
          event_id: string
          id?: string
          promo_code_id: string
          registration_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          event_id?: string
          id?: string
          promo_code_id?: string
          registration_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          distance_ids: string[]
          event_id: string
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          uses_count: number
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          distance_ids?: string[]
          event_id: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value?: number
          distance_ids?: string[]
          event_id?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      registration_cancellation_requests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reason: string | null
          registration_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reason?: string | null
          registration_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reason?: string | null
          registration_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_history: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          event_id: string
          id: string
          payload: Json
          registration_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          payload?: Json
          registration_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          payload?: Json
          registration_id?: string | null
        }
        Relationships: []
      }
      registration_transfers: {
        Row: {
          accepted_at: string | null
          code: string
          created_at: string
          event_id: string
          expires_at: string
          from_user_id: string
          id: string
          registration_id: string
          status: string
          to_user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          code: string
          created_at?: string
          event_id: string
          expires_at?: string
          from_user_id: string
          id?: string
          registration_id: string
          status?: string
          to_user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          code?: string
          created_at?: string
          event_id?: string
          expires_at?: string
          from_user_id?: string
          id?: string
          registration_id?: string
          status?: string
          to_user_id?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          athlete_id: string | null
          bib_number: number | null
          created_at: string
          delivery_city_name: string | null
          delivery_city_ref: string | null
          delivery_enabled: boolean
          delivery_phone: string | null
          delivery_recipient_name: string | null
          delivery_warehouse_name: string | null
          delivery_warehouse_ref: string | null
          delivery_warehouse_type: string | null
          distance_id: string
          event_id: string
          id: string
          np_ttn_cost: number | null
          np_ttn_created_at: string | null
          np_ttn_created_by: string | null
          np_ttn_estimated_delivery_date: string | null
          np_ttn_number: string | null
          np_ttn_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data: string | null
          receipt_confirmed_at: string | null
          receipt_revoked_reason: string | null
          receipt_uploaded_at: string | null
          receipt_url: string | null
          relay_members: Json | null
          team_category: string | null
          team_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          athlete_id?: string | null
          bib_number?: number | null
          created_at?: string
          delivery_city_name?: string | null
          delivery_city_ref?: string | null
          delivery_enabled?: boolean
          delivery_phone?: string | null
          delivery_recipient_name?: string | null
          delivery_warehouse_name?: string | null
          delivery_warehouse_ref?: string | null
          delivery_warehouse_type?: string | null
          distance_id: string
          event_id: string
          id?: string
          np_ttn_cost?: number | null
          np_ttn_created_at?: string | null
          np_ttn_created_by?: string | null
          np_ttn_estimated_delivery_date?: string | null
          np_ttn_number?: string | null
          np_ttn_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data?: string | null
          receipt_confirmed_at?: string | null
          receipt_revoked_reason?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          relay_members?: Json | null
          team_category?: string | null
          team_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          athlete_id?: string | null
          bib_number?: number | null
          created_at?: string
          delivery_city_name?: string | null
          delivery_city_ref?: string | null
          delivery_enabled?: boolean
          delivery_phone?: string | null
          delivery_recipient_name?: string | null
          delivery_warehouse_name?: string | null
          delivery_warehouse_ref?: string | null
          delivery_warehouse_type?: string | null
          distance_id?: string
          event_id?: string
          id?: string
          np_ttn_cost?: number | null
          np_ttn_created_at?: string | null
          np_ttn_created_by?: string | null
          np_ttn_estimated_delivery_date?: string | null
          np_ttn_number?: string | null
          np_ttn_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data?: string | null
          receipt_confirmed_at?: string | null
          receipt_revoked_reason?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          relay_members?: Json | null
          team_category?: string | null
          team_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_distance_id_fkey"
            columns: ["distance_id"]
            isOneToOne: false
            referencedRelation: "distances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_overrides: {
        Row: {
          created_at: string
          description: string | null
          id: string
          path: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          path: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          path?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      strava_connections: {
        Row: {
          access_token: string
          athlete_city: string | null
          athlete_country: string | null
          athlete_firstname: string | null
          athlete_lastname: string | null
          athlete_profile: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          strava_athlete_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          athlete_city?: string | null
          athlete_country?: string | null
          athlete_firstname?: string | null
          athlete_lastname?: string | null
          athlete_profile?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          strava_athlete_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          athlete_city?: string | null
          athlete_country?: string | null
          athlete_firstname?: string | null
          athlete_lastname?: string | null
          athlete_profile?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          strava_athlete_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          contact_email: string | null
          created_at: string
          design_rating: number | null
          discovery_source: string | null
          ease_of_use: number | null
          easy_to_find_event: string | null
          event_choice_factors: string[]
          id: string
          liked_most: string | null
          missing_features: string[]
          nps_score: number | null
          organizer_event_creation: number | null
          organizer_missing_tools: string | null
          organizer_payments_clear: string | null
          participation_frequency: string | null
          registration_clarity: number | null
          registration_difficulty: string | null
          suggestions: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
          would_change: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          design_rating?: number | null
          discovery_source?: string | null
          ease_of_use?: number | null
          easy_to_find_event?: string | null
          event_choice_factors?: string[]
          id?: string
          liked_most?: string | null
          missing_features?: string[]
          nps_score?: number | null
          organizer_event_creation?: number | null
          organizer_missing_tools?: string | null
          organizer_payments_clear?: string | null
          participation_frequency?: string | null
          registration_clarity?: number | null
          registration_difficulty?: string | null
          suggestions?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
          would_change?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          design_rating?: number | null
          discovery_source?: string | null
          ease_of_use?: number | null
          easy_to_find_event?: string | null
          event_choice_factors?: string[]
          id?: string
          liked_most?: string | null
          missing_features?: string[]
          nps_score?: number | null
          organizer_event_creation?: number | null
          organizer_missing_tools?: string | null
          organizer_payments_clear?: string | null
          participation_frequency?: string | null
          registration_clarity?: number | null
          registration_difficulty?: string | null
          suggestions?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
          would_change?: string | null
        }
        Relationships: []
      }
      testimonial_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          testimonial_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          testimonial_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          testimonial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_reactions_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          ip_address: string | null
          last_seen_at: string
          login_at: string
          logout_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          login_at?: string
          logout_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          login_at?: string
          logout_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wayforpay_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_reference: string
          raw_callback: Json | null
          registration_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_reference: string
          raw_callback?: Json | null
          registration_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_reference?: string
          raw_callback?: Json | null
          registration_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wayforpay_orders_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_promo_code: {
        Args: {
          _base_price: number
          _code: string
          _distance_id: string
          _event_id: string
          _registration_id: string
        }
        Returns: {
          discount_amount: number
          final_price: number
          promo_id: string
        }[]
      }
      are_changes_allowed: { Args: { _event_id: string }; Returns: boolean }
      can_manage_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_chat_authors: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
        }[]
      }
      get_event_participants: {
        Args: { _event_id: string }
        Returns: {
          added_by_email: string
          added_by_name: string
          bib_number: number
          birth_year: number
          city: string
          club: string
          delivery_city_name: string
          delivery_enabled: boolean
          delivery_phone: string
          delivery_recipient_name: string
          delivery_warehouse_name: string
          delivery_warehouse_type: string
          distance_km: number
          distance_name: string
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          is_relay: boolean
          is_self_athlete: boolean
          payment_status: Database["public"]["Enums"]["payment_status_type"]
          phone: string
          receipt_confirmed_at: string
          receipt_uploaded_at: string
          receipt_url: string
          registration_id: string
          relay_members: Json
          team_category: string
          team_name: string
          user_id: string
        }[]
      }
      get_event_participants_count: {
        Args: { _event_id: string }
        Returns: number
      }
      get_managed_events_unread_chat: {
        Args: never
        Returns: {
          event_id: string
          last_message_at: string
          unread_count: number
        }[]
      }
      get_public_stats: {
        Args: never
        Returns: {
          cities_count: number
          clubs_count: number
          events_count: number
          organizers_count: number
          registrations_count: number
          runners_count: number
        }[]
      }
      get_unsubscribe_stats: {
        Args: never
        Returns: {
          city: string
          email: string
          full_name: string
          has_profile: boolean
          marketing_consent: boolean
          reason: string
          unsubscribed_at: string
        }[]
      }
      get_unsubscribe_summary: {
        Args: never
        Returns: {
          total_subscribed: number
          total_suppressed: number
          total_unsubscribed: number
          unsubscribed_last_30d: number
          unsubscribed_last_7d: number
        }[]
      }
      get_user_sessions_admin: {
        Args: { _limit?: number }
        Returns: {
          duration_seconds: number
          email: string
          full_name: string
          id: string
          ip_address: string
          last_seen_at: string
          login_at: string
          logout_at: string
          phone: string
          user_agent: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_event_co_organizer: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      move_registration_to_distance: {
        Args: { _new_distance_id: string; _registration_id: string }
        Returns: {
          new_bib_number: number
          new_distance_id: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      organizer_resolve_cancellation: {
        Args: { _approve: boolean; _note: string; _request_id: string }
        Returns: undefined
      }
      participant_accept_transfer: { Args: { _code: string }; Returns: string }
      participant_change_distance: {
        Args: { _new_distance_id: string; _registration_id: string }
        Returns: {
          new_bib_number: number
          new_distance_id: string
          price_diff: number
          requires_payment: boolean
        }[]
      }
      participant_create_transfer: {
        Args: { _registration_id: string }
        Returns: {
          code: string
          expires_at: string
          transfer_id: string
        }[]
      }
      participant_request_cancellation: {
        Args: { _reason: string; _registration_id: string }
        Returns: string
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      slugify: { Args: { _input: string }; Returns: string }
      validate_promo_code: {
        Args: {
          _base_price: number
          _code: string
          _distance_id: string
          _event_id: string
        }
        Returns: {
          discount_amount: number
          error_code: string
          final_price: number
          promo_id: string
        }[]
      }
    }
    Enums: {
      app_role: "participant" | "organizer" | "admin"
      club_activity_type:
        | "road_run"
        | "trail"
        | "ocr"
        | "triathlon"
        | "cycling"
        | "swimming"
        | "other"
      event_category:
        | "run"
        | "half_marathon"
        | "marathon"
        | "ultra"
        | "trail"
        | "ocr"
        | "online"
        | "swim"
        | "aquathlon"
        | "duathlon"
        | "cycling"
        | "triathlon"
      event_format: "offline" | "online" | "hybrid"
      event_status: "draft" | "published" | "cancelled" | "completed"
      gender_type: "male" | "female" | "other" | "boy" | "girl"
      payment_provider_type: "liqpay" | "stripe" | "free"
      payment_status_type: "pending" | "paid" | "failed" | "refunded" | "free"
      promo_discount_type: "percent" | "fixed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["participant", "organizer", "admin"],
      club_activity_type: [
        "road_run",
        "trail",
        "ocr",
        "triathlon",
        "cycling",
        "swimming",
        "other",
      ],
      event_category: [
        "run",
        "half_marathon",
        "marathon",
        "ultra",
        "trail",
        "ocr",
        "online",
        "swim",
        "aquathlon",
        "duathlon",
        "cycling",
        "triathlon",
      ],
      event_format: ["offline", "online", "hybrid"],
      event_status: ["draft", "published", "cancelled", "completed"],
      gender_type: ["male", "female", "other", "boy", "girl"],
      payment_provider_type: ["liqpay", "stripe", "free"],
      payment_status_type: ["pending", "paid", "failed", "refunded", "free"],
      promo_discount_type: ["percent", "fixed"],
    },
  },
} as const
