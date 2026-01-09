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
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
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
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          session_id?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
