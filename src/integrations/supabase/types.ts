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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          language: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          crop_category: string | null
          id: string
          image_url: string | null
          is_resolved: boolean | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          crop_category?: string | null
          id?: string
          image_url?: string | null
          is_resolved?: boolean | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          crop_category?: string | null
          id?: string
          image_url?: string | null
          is_resolved?: boolean | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_accepted: boolean | null
          is_expert_answer: boolean | null
          post_id: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          is_expert_answer?: boolean | null
          post_id: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          is_expert_answer?: boolean | null
          post_id?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_calendar: {
        Row: {
          created_at: string
          crop_name: string
          crop_name_hi: string | null
          fertilizer_months: number[] | null
          harvest_end_month: number | null
          harvest_start_month: number | null
          id: string
          irrigation_frequency: string | null
          notes_en: string | null
          notes_hi: string | null
          pest_risk_months: number[] | null
          region: string[] | null
          sowing_end_month: number | null
          sowing_start_month: number | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          crop_name_hi?: string | null
          fertilizer_months?: number[] | null
          harvest_end_month?: number | null
          harvest_start_month?: number | null
          id?: string
          irrigation_frequency?: string | null
          notes_en?: string | null
          notes_hi?: string | null
          pest_risk_months?: number[] | null
          region?: string[] | null
          sowing_end_month?: number | null
          sowing_start_month?: number | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          crop_name_hi?: string | null
          fertilizer_months?: number[] | null
          harvest_end_month?: number | null
          harvest_start_month?: number | null
          id?: string
          irrigation_frequency?: string | null
          notes_en?: string | null
          notes_hi?: string | null
          pest_risk_months?: number[] | null
          region?: string[] | null
          sowing_end_month?: number | null
          sowing_start_month?: number | null
        }
        Relationships: []
      }
      crop_scans: {
        Row: {
          cause: string | null
          created_at: string
          crop_name: string | null
          disease_name: string | null
          id: string
          image_url: string
          language: string
          pesticide: string | null
          prevention: string | null
          raw_result: Json | null
          session_id: string
          severity: string | null
          treatment: string | null
          user_id: string | null
        }
        Insert: {
          cause?: string | null
          created_at?: string
          crop_name?: string | null
          disease_name?: string | null
          id?: string
          image_url: string
          language?: string
          pesticide?: string | null
          prevention?: string | null
          raw_result?: Json | null
          session_id: string
          severity?: string | null
          treatment?: string | null
          user_id?: string | null
        }
        Update: {
          cause?: string | null
          created_at?: string
          crop_name?: string | null
          disease_name?: string | null
          id?: string
          image_url?: string
          language?: string
          pesticide?: string | null
          prevention?: string | null
          raw_result?: Json | null
          session_id?: string
          severity?: string | null
          treatment?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          created_at: string
          description_en: string | null
          description_hi: string | null
          id: string
          name_bn: string | null
          name_en: string
          name_hi: string | null
          name_mr: string | null
          name_ta: string | null
          name_te: string | null
          region: string[] | null
          season: string | null
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          id?: string
          name_bn?: string | null
          name_en: string
          name_hi?: string | null
          name_mr?: string | null
          name_ta?: string | null
          name_te?: string | null
          region?: string[] | null
          season?: string | null
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          id?: string
          name_bn?: string | null
          name_en?: string
          name_hi?: string | null
          name_mr?: string | null
          name_ta?: string | null
          name_te?: string | null
          region?: string[] | null
          season?: string | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          crop_name: string
          crop_name_hi: string | null
          district: string
          id: string
          mandi: string
          price: number
          price_date: string
          price_trend: string | null
          state: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          crop_name_hi?: string | null
          district: string
          id?: string
          mandi: string
          price: number
          price_date?: string
          price_trend?: string | null
          state: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          crop_name_hi?: string | null
          district?: string
          id?: string
          mandi?: string
          price?: number
          price_date?: string
          price_trend?: string | null
          state?: string
          unit?: string | null
        }
        Relationships: []
      }
      msp_rates: {
        Row: {
          created_at: string
          crop_name: string
          crop_name_hi: string | null
          id: string
          msp_price: number
          season: string | null
          unit: string | null
          year: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          crop_name_hi?: string | null
          id?: string
          msp_price: number
          season?: string | null
          unit?: string | null
          year: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          crop_name_hi?: string | null
          id?: string
          msp_price?: number
          season?: string | null
          unit?: string | null
          year?: string
        }
        Relationships: []
      }
      pests: {
        Row: {
          affected_crops: string[] | null
          created_at: string
          description_en: string | null
          description_hi: string | null
          id: string
          name_bn: string | null
          name_en: string
          name_hi: string | null
          name_mr: string | null
          name_ta: string | null
          name_te: string | null
          treatment_en: string | null
          treatment_hi: string | null
        }
        Insert: {
          affected_crops?: string[] | null
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          id?: string
          name_bn?: string | null
          name_en: string
          name_hi?: string | null
          name_mr?: string | null
          name_ta?: string | null
          name_te?: string | null
          treatment_en?: string | null
          treatment_hi?: string | null
        }
        Update: {
          affected_crops?: string[] | null
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          id?: string
          name_bn?: string | null
          name_en?: string
          name_hi?: string | null
          name_mr?: string | null
          name_ta?: string | null
          name_te?: string | null
          treatment_en?: string | null
          treatment_hi?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          district: string | null
          id: string
          language: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schemes: {
        Row: {
          benefits_en: string | null
          benefits_hi: string | null
          category: string
          created_at: string
          documents_en: string[] | null
          documents_hi: string[] | null
          eligibility_en: string | null
          eligibility_hi: string | null
          how_to_apply_en: string | null
          how_to_apply_hi: string | null
          id: string
          name_bn: string | null
          name_en: string
          name_hi: string | null
          name_mr: string | null
          name_ta: string | null
          name_te: string | null
          official_link: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          benefits_en?: string | null
          benefits_hi?: string | null
          category: string
          created_at?: string
          documents_en?: string[] | null
          documents_hi?: string[] | null
          eligibility_en?: string | null
          eligibility_hi?: string | null
          how_to_apply_en?: string | null
          how_to_apply_hi?: string | null
          id?: string
          name_bn?: string | null
          name_en: string
          name_hi?: string | null
          name_mr?: string | null
          name_ta?: string | null
          name_te?: string | null
          official_link?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          benefits_en?: string | null
          benefits_hi?: string | null
          category?: string
          created_at?: string
          documents_en?: string[] | null
          documents_hi?: string[] | null
          eligibility_en?: string | null
          eligibility_hi?: string | null
          how_to_apply_en?: string | null
          how_to_apply_hi?: string | null
          id?: string
          name_bn?: string | null
          name_en?: string
          name_hi?: string | null
          name_mr?: string | null
          name_ta?: string | null
          name_te?: string | null
          official_link?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      upvotes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upvotes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "community_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reminders: {
        Row: {
          created_at: string
          crop_name: string
          id: string
          is_completed: boolean | null
          message: string | null
          reminder_date: string
          reminder_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          id?: string
          is_completed?: boolean | null
          message?: string | null
          reminder_date: string
          reminder_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          id?: string
          is_completed?: boolean | null
          message?: string | null
          reminder_date?: string
          reminder_type?: string | null
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
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          district: string | null
          id: string | null
          language: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          district?: string | null
          id?: string | null
          language?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          district?: string | null
          id?: string | null
          language?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_session_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "farmer" | "expert" | "admin"
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
      app_role: ["farmer", "expert", "admin"],
    },
  },
} as const
