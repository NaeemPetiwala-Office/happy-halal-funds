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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          actual_balance: number | null
          created_at: string
          id: string
          minimum_balance: number
          name: string
          opening_balance: number
          user_id: string
        }
        Insert: {
          actual_balance?: number | null
          created_at?: string
          id?: string
          minimum_balance?: number
          name: string
          opening_balance?: number
          user_id?: string
        }
        Update: {
          actual_balance?: number | null
          created_at?: string
          id?: string
          minimum_balance?: number
          name?: string
          opening_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      archived_entries: {
        Row: {
          archived_at: string
          data: Json
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          archived_at?: string
          data: Json
          id?: string
          kind: string
          user_id?: string
        }
        Update: {
          archived_at?: string
          data?: Json
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          leftover_category_id: string | null
          leftover_mode: Database["public"]["Enums"]["leftover_mode"]
          name: string
          notes: string | null
          planned: number
          type: Database["public"]["Enums"]["category_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          leftover_category_id?: string | null
          leftover_mode?: Database["public"]["Enums"]["leftover_mode"]
          name: string
          notes?: string | null
          planned?: number
          type: Database["public"]["Enums"]["category_type"]
          user_id?: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          leftover_category_id?: string | null
          leftover_mode?: Database["public"]["Enums"]["leftover_mode"]
          name?: string
          notes?: string | null
          planned?: number
          type?: Database["public"]["Enums"]["category_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_goal_id_user_id_fkey"
            columns: ["goal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "categories_leftover_category_id_user_id_fkey"
            columns: ["leftover_category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      goals: {
        Row: {
          auto_count: boolean
          created_at: string
          id: string
          name: string
          opening_saved: number
          priority: Database["public"]["Enums"]["goal_priority"]
          target: number | null
          user_id: string
        }
        Insert: {
          auto_count?: boolean
          created_at?: string
          id?: string
          name: string
          opening_saved?: number
          priority?: Database["public"]["Enums"]["goal_priority"]
          target?: number | null
          user_id?: string
        }
        Update: {
          auto_count?: boolean
          created_at?: string
          id?: string
          name?: string
          opening_saved?: number
          priority?: Database["public"]["Enums"]["goal_priority"]
          target?: number | null
          user_id?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          date: string
          id: string
          note: string | null
          source_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          date: string
          id?: string
          note?: string | null
          source_id?: string | null
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "income_entries_source_id_user_id_fkey"
            columns: ["source_id", "user_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      income_sources: {
        Row: {
          created_at: string
          id: string
          monthly_amount: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_amount?: number
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_amount?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      interest_given: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          note: string | null
          recipient: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          note?: string | null
          recipient?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          recipient?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interest_received: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          date: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_received_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      module_plans: {
        Row: {
          data: Json
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          id?: string
          module: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          data?: Json
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          locale: string
          modules: Json
          name: string | null
          onboarding_completed: boolean
          plan_start: string
          selected_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          locale?: string
          modules?: Json
          name?: string | null
          onboarding_completed?: boolean
          plan_start?: string
          selected_month?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          currency?: string
          locale?: string
          modules?: Json
          name?: string | null
          onboarding_completed?: boolean
          plan_start?: string
          selected_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_items: {
        Row: {
          active: boolean
          amount: number
          category_id: string | null
          created_at: string
          first_due_date: string
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          category_id?: string | null
          created_at?: string
          first_due_date: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          active?: boolean
          amount?: number
          category_id?: string | null
          created_at?: string
          first_due_date?: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_items_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          date: string
          from_account_id: string | null
          id: string
          note: string | null
          to_account_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          from_account_id?: string | null
          id?: string
          note?: string | null
          to_account_id?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          from_account_id?: string | null
          id?: string
          note?: string | null
          to_account_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_user_id_fkey"
            columns: ["from_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_user_id_fkey"
            columns: ["to_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      zakat_lines: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["zakat_line_kind"]
          label: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["zakat_line_kind"]
          label: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["zakat_line_kind"]
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      zakat_settings: {
        Row: {
          anniversary_date: string | null
          basis: Database["public"]["Enums"]["zakat_basis"]
          gold_grams: number
          gold_price: number | null
          rate: number
          silver_grams: number
          silver_price: number | null
          updated_at: string
          user_id: string
          zakat_category_id: string | null
        }
        Insert: {
          anniversary_date?: string | null
          basis?: Database["public"]["Enums"]["zakat_basis"]
          gold_grams?: number
          gold_price?: number | null
          rate?: number
          silver_grams?: number
          silver_price?: number | null
          updated_at?: string
          user_id?: string
          zakat_category_id?: string | null
        }
        Update: {
          anniversary_date?: string | null
          basis?: Database["public"]["Enums"]["zakat_basis"]
          gold_grams?: number
          gold_price?: number | null
          rate?: number
          silver_grams?: number
          silver_price?: number | null
          updated_at?: string
          user_id?: string
          zakat_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zakat_settings_zakat_category_id_user_id_fkey"
            columns: ["zakat_category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      start_new_year: {
        Args: { accounts: Json; goals: Json; new_plan_start: string }
        Returns: undefined
      }
    }
    Enums: {
      category_type: "Fixed" | "Variable" | "Giving" | "Savings"
      goal_priority: "High" | "Medium" | "Low"
      leftover_mode: "same" | "drop" | "move"
      recurring_frequency:
        | "Monthly"
        | "Quarterly"
        | "Half-yearly"
        | "Yearly"
        | "One-time"
      zakat_basis: "Silver" | "Gold"
      zakat_line_kind: "asset" | "liability"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      category_type: ["Fixed", "Variable", "Giving", "Savings"],
      goal_priority: ["High", "Medium", "Low"],
      leftover_mode: ["same", "drop", "move"],
      recurring_frequency: [
        "Monthly",
        "Quarterly",
        "Half-yearly",
        "Yearly",
        "One-time",
      ],
      zakat_basis: ["Silver", "Gold"],
      zakat_line_kind: ["asset", "liability"],
    },
  },
} as const
