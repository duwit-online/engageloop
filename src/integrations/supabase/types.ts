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
      ad_zones: {
        Row: {
          clicks: number
          content: string
          created_at: string
          enabled: boolean
          id: string
          impressions: number
          name: string
          placement: string
          provider: string | null
          revenue: number
          type: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          impressions?: number
          name: string
          placement: string
          provider?: string | null
          revenue?: number
          type: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          impressions?: number
          name?: string
          placement?: string
          provider?: string | null
          revenue?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_tasks: {
        Row: {
          capsule_reward: number
          created_at: string
          created_by: string | null
          current_completions: number
          description: string | null
          id: string
          is_active: boolean
          is_promoted: boolean
          max_completions: number | null
          platform: string
          priority: number
          target_url: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          capsule_reward?: number
          created_at?: string
          created_by?: string | null
          current_completions?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_promoted?: boolean
          max_completions?: number | null
          platform: string
          priority?: number
          target_url?: string | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          capsule_reward?: number
          created_at?: string
          created_by?: string | null
          current_completions?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_promoted?: boolean
          max_completions?: number | null
          platform?: string
          priority?: number
          target_url?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      bank_transfers: {
        Row: {
          amount_ngn: number
          bank_reference: string | null
          capsules_to_credit: number
          created_at: string
          id: string
          package_id: string | null
          proof_url: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_ngn: number
          bank_reference?: string | null
          capsules_to_credit: number
          created_at?: string
          id?: string
          package_id?: string | null
          proof_url: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_ngn?: number
          bank_reference?: string | null
          capsules_to_credit?: number
          created_at?: string
          id?: string
          package_id?: string | null
          proof_url?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_configs: {
        Row: {
          config: Json
          id: string
          is_enabled: boolean
          provider: string
          public_key: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: string
          is_enabled?: boolean
          provider: string
          public_key?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: string
          is_enabled?: boolean
          provider?: string
          public_key?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_ngn: number
          amount_usd: number | null
          capsules: number
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          package_id: string | null
          payment_type: string
          provider: string
          provider_reference: string | null
          status: string
          subscription_months: number | null
          user_id: string
        }
        Insert: {
          amount_ngn: number
          amount_usd?: number | null
          capsules: number
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          package_id?: string | null
          payment_type: string
          provider: string
          provider_reference?: string | null
          status?: string
          subscription_months?: number | null
          user_id: string
        }
        Update: {
          amount_ngn?: number
          amount_usd?: number | null
          capsules?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          package_id?: string | null
          payment_type?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          subscription_months?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cooldown_until: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cooldown_until?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cooldown_until?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          capsule_budget: number
          capsule_reward: number
          completed_quantity: number
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          platform: string
          status: string
          target_quantity: number
          target_url: string
          task_type: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          capsule_budget?: number
          capsule_reward?: number
          completed_quantity?: number
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          platform?: string
          status?: string
          target_quantity?: number
          target_url?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          capsule_budget?: number
          capsule_reward?: number
          completed_quantity?: number
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          platform?: string
          status?: string
          target_quantity?: number
          target_url?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          capsules_earned: number
          content_answer: string
          content_question: string
          created_at: string
          id: string
          platform: string
          platform_username: string
          released_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          task_id: string
          task_type: string
          timer_seconds: number
          user_id: string | null
          verification_result: Json | null
          verified_at: string | null
        }
        Insert: {
          capsules_earned?: number
          content_answer: string
          content_question: string
          created_at?: string
          id?: string
          platform: string
          platform_username: string
          released_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          task_id: string
          task_type: string
          timer_seconds: number
          user_id?: string | null
          verification_result?: Json | null
          verified_at?: string | null
        }
        Update: {
          capsules_earned?: number
          content_answer?: string
          content_question?: string
          created_at?: string
          id?: string
          platform?: string
          platform_username?: string
          released_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          task_id?: string
          task_type?: string
          timer_seconds?: number
          user_id?: string | null
          verification_result?: Json | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_access_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          plan: string
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan?: string
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan?: string
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trust_scores: {
        Row: {
          cooldown_until: string | null
          created_at: string
          id: string
          identifier: string | null
          last_task_at: string | null
          total_capsules_earned: number
          total_capsules_slashed: number
          total_tasks_completed: number
          total_tasks_rejected: number
          trust_score: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string
          id?: string
          identifier?: string | null
          last_task_at?: string | null
          total_capsules_earned?: number
          total_capsules_slashed?: number
          total_tasks_completed?: number
          total_tasks_rejected?: number
          trust_score?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string
          id?: string
          identifier?: string | null
          last_task_at?: string | null
          total_capsules_earned?: number
          total_capsules_slashed?: number
          total_tasks_completed?: number
          total_tasks_rejected?: number
          trust_score?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      username_verifications: {
        Row: {
          created_at: string
          id: string
          is_valid: boolean
          last_verified_at: string
          platform: string
          profile_data: Json | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_valid?: boolean
          last_verified_at?: string
          platform: string
          profile_data?: Json | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_valid?: boolean
          last_verified_at?: string
          platform?: string
          profile_data?: Json | null
          username?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_capsules: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
          p_user_id: string
        }
        Returns: number
      }
      debit_capsules: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
          p_user_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
