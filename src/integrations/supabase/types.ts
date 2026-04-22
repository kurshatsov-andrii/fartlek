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
      distances: {
        Row: {
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
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          description: string | null
          event_date: string
          event_time: string
          id: string
          image_url: string | null
          is_paid: boolean
          location: string | null
          organizer_id: string
          organizer_name: string
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string | null
          event_date: string
          event_time: string
          id?: string
          image_url?: string | null
          is_paid?: boolean
          location?: string | null
          organizer_id: string
          organizer_name: string
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string
          id?: string
          image_url?: string | null
          is_paid?: boolean
          location?: string | null
          organizer_id?: string
          organizer_name?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
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
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          bib_number: number | null
          created_at: string
          distance_id: string
          event_id: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bib_number?: number | null
          created_at?: string
          distance_id: string
          event_id: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bib_number?: number | null
          created_at?: string
          distance_id?: string
          event_id?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          qr_code_data?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
      get_event_participants: {
        Args: { _event_id: string }
        Returns: {
          bib_number: number
          birth_year: number
          city: string
          club: string
          distance_km: number
          distance_name: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
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
      slugify: { Args: { _input: string }; Returns: string }
    }
    Enums: {
      app_role: "participant" | "organizer" | "admin"
      event_category:
        | "run"
        | "half_marathon"
        | "marathon"
        | "ultra"
        | "trail"
        | "ocr"
        | "online"
      event_status: "draft" | "published" | "cancelled" | "completed"
      gender_type: "male" | "female" | "other"
      payment_provider_type: "liqpay" | "stripe" | "free"
      payment_status_type: "pending" | "paid" | "failed" | "refunded" | "free"
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
      event_category: [
        "run",
        "half_marathon",
        "marathon",
        "ultra",
        "trail",
        "ocr",
        "online",
      ],
      event_status: ["draft", "published", "cancelled", "completed"],
      gender_type: ["male", "female", "other"],
      payment_provider_type: ["liqpay", "stripe", "free"],
      payment_status_type: ["pending", "paid", "failed", "refunded", "free"],
    },
  },
} as const
