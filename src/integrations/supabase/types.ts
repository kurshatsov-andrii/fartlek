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
          distance_km: number
          event_id: string
          id: string
          is_active: boolean
          max_participants: number | null
          name: string | null
          price: number
        }
        Insert: {
          bib_start?: number | null
          created_at?: string
          distance_km: number
          event_id: string
          id?: string
          is_active?: boolean
          max_participants?: number | null
          name?: string | null
          price?: number
        }
        Update: {
          bib_start?: number | null
          created_at?: string
          distance_km?: number
          event_id?: string
          id?: string
          is_active?: boolean
          max_participants?: number | null
          name?: string | null
          price?: number
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
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
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
          results_pdf_url: string | null
          results_url: string | null
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["event_category"]
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
          results_pdf_url?: string | null
          results_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
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
          results_pdf_url?: string | null
          results_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
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
      registrations: {
        Row: {
          athlete_id: string | null
          bib_number: number | null
          created_at: string
          distance_id: string
          event_id: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data: string | null
          receipt_confirmed_at: string | null
          receipt_revoked_reason: string | null
          receipt_uploaded_at: string | null
          receipt_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          athlete_id?: string | null
          bib_number?: number | null
          created_at?: string
          distance_id: string
          event_id: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data?: string | null
          receipt_confirmed_at?: string | null
          receipt_revoked_reason?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          athlete_id?: string | null
          bib_number?: number | null
          created_at?: string
          distance_id?: string
          event_id?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data?: string | null
          receipt_confirmed_at?: string | null
          receipt_revoked_reason?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
          distance_km: number
          distance_name: string
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          is_self_athlete: boolean
          payment_status: Database["public"]["Enums"]["payment_status_type"]
          phone: string
          receipt_confirmed_at: string
          receipt_uploaded_at: string
          receipt_url: string
          registration_id: string
          user_id: string
        }[]
      }
      get_event_participants_count: {
        Args: { _event_id: string }
        Returns: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
