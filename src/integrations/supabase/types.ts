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
      body_measurements: {
        Row: {
          id: string
          logged_at: string
          type: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          logged_at?: string
          type: string
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          id?: string
          logged_at?: string
          type?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          metric: string
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          metric?: string
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          metric?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      coach_clients: {
        Row: {
          client_id: string
          coach_id: string
          connected_at: string | null
          id: string
          status: Database["public"]["Enums"]["coach_client_status"]
        }
        Insert: {
          client_id: string
          coach_id: string
          connected_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["coach_client_status"]
        }
        Update: {
          client_id?: string
          coach_id?: string
          connected_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["coach_client_status"]
        }
        Relationships: []
      }
      coach_invite_emails: {
        Row: {
          coach_client_id: string
          coach_id: string
          created_at: string
          invited_email: string
        }
        Insert: {
          coach_client_id: string
          coach_id: string
          created_at?: string
          invited_email: string
        }
        Update: {
          coach_client_id?: string
          coach_id?: string
          created_at?: string
          invited_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_invite_emails_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: true
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          difficulty: string | null
          equipment: string | null
          id: string
          instructions: string | null
          is_custom: boolean
          media_url: string | null
          name: string
          primary_muscles: string[]
          secondary_muscles: string[]
          slug: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_custom?: boolean
          media_url?: string | null
          name: string
          primary_muscles?: string[]
          secondary_muscles?: string[]
          slug?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_custom?: boolean
          media_url?: string | null
          name?: string
          primary_muscles?: string[]
          secondary_muscles?: string[]
          slug?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          experience: Database["public"]["Enums"]["experience_level"] | null
          goal: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm: number | null
          id: string
          onboarded: boolean
          privacy: Database["public"]["Enums"]["privacy_pref"]
          rest_timer_seconds: number
          units: Database["public"]["Enums"]["units_pref"]
          updated_at: string
          username: string | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          experience?: Database["public"]["Enums"]["experience_level"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm?: number | null
          id: string
          onboarded?: boolean
          privacy?: Database["public"]["Enums"]["privacy_pref"]
          rest_timer_seconds?: number
          units?: Database["public"]["Enums"]["units_pref"]
          updated_at?: string
          username?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          experience?: Database["public"]["Enums"]["experience_level"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm?: number | null
          id?: string
          onboarded?: boolean
          privacy?: Database["public"]["Enums"]["privacy_pref"]
          rest_timer_seconds?: number
          units?: Database["public"]["Enums"]["units_pref"]
          updated_at?: string
          username?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      program_assignments: {
        Row: {
          active: boolean
          assigned_by: string | null
          assigned_to: string
          id: string
          program_id: string
          started_at: string | null
        }
        Insert: {
          active?: boolean
          assigned_by?: string | null
          assigned_to: string
          id?: string
          program_id: string
          started_at?: string | null
        }
        Update: {
          active?: boolean
          assigned_by?: string | null
          assigned_to?: string
          id?: string
          program_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_days: {
        Row: {
          day_number: number
          id: string
          label: string | null
          program_id: string
          routine_id: string | null
          week_number: number
        }
        Insert: {
          day_number: number
          id?: string
          label?: string | null
          program_id: string
          routine_id?: string | null
          week_number: number
        }
        Update: {
          day_number?: number
          id?: string
          label?: string | null
          program_id?: string
          routine_id?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_days_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          duration_weeks: number
          id: string
          is_template: boolean
          name: string
          owner_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          duration_weeks?: number
          id?: string
          is_template?: boolean
          name: string
          owner_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          duration_weeks?: number
          id?: string
          is_template?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          routine_id: string
          target_reps: number | null
          target_sets: number | null
          target_weight: number | null
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          routine_id: string
          target_reps?: number | null
          target_sets?: number | null
          target_weight?: number | null
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          routine_id?: string
          target_reps?: number | null
          target_sets?: number | null
          target_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          is_template: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
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
      workout_comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          text: string
          workout_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          text: string
          workout_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          text?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_comments_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_comments_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_likes: {
        Row: {
          created_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_likes_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          exercise_id: string
          id: string
          is_pr: boolean
          logged_at: string
          notes: string | null
          reps: number | null
          rpe: number | null
          set_number: number
          tag: Database["public"]["Enums"]["set_tag"]
          weight: number | null
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          is_pr?: boolean
          logged_at?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          set_number?: number
          tag?: Database["public"]["Enums"]["set_tag"]
          weight?: number | null
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          is_pr?: boolean
          logged_at?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          set_number?: number
          tag?: Database["public"]["Enums"]["set_tag"]
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          duration_seconds: number | null
          finished_at: string | null
          id: string
          name: string | null
          notes: string | null
          routine_id: string | null
          started_at: string
          total_volume: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          routine_id?: string | null
          started_at?: string
          total_volume?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          routine_id?: string | null
          started_at?: string
          total_volume?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coach_of: {
        Args: { _client: string; _coach: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "individual" | "coach" | "both" | "admin"
      coach_client_status: "pending" | "active" | "declined"
      experience_level: "beginner" | "intermediate" | "advanced"
      fitness_goal: "strength" | "hypertrophy" | "weight_loss" | "general"
      privacy_pref: "public" | "private"
      set_tag:
        | "warmup"
        | "working"
        | "failure"
        | "dropset"
        | "negative"
        | "amrap"
        | "left"
        | "right"
      units_pref: "kg" | "lb"
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
      app_role: ["individual", "coach", "both", "admin"],
      coach_client_status: ["pending", "active", "declined"],
      experience_level: ["beginner", "intermediate", "advanced"],
      fitness_goal: ["strength", "hypertrophy", "weight_loss", "general"],
      privacy_pref: ["public", "private"],
      set_tag: [
        "warmup",
        "working",
        "failure",
        "dropset",
        "negative",
        "amrap",
        "left",
        "right",
      ],
      units_pref: ["kg", "lb"],
    },
  },
} as const
