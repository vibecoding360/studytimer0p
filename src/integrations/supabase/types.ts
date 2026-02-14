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
      courses: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          office_hours: string | null
          professor_email: string | null
          professor_name: string | null
          semester: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          office_hours?: string | null
          professor_email?: string | null
          professor_name?: string | null
          semester?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          office_hours?: string | null
          professor_email?: string | null
          professor_name?: string | null
          semester?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grading_weights: {
        Row: {
          category: string
          course_id: string
          created_at: string
          current_score: number | null
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          category: string
          course_id: string
          created_at?: string
          current_score?: number | null
          id?: string
          user_id: string
          weight?: number
        }
        Update: {
          category?: string
          course_id?: string
          created_at?: string
          current_score?: number | null
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_weights_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      readings: {
        Row: {
          author: string | null
          chapter: string | null
          completed: boolean | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          chapter?: string | null
          completed?: boolean | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          author?: string | null
          chapter?: string | null
          completed?: boolean | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          course_id: string
          created_at: string
          id: string
          resource_type: string | null
          source: string | null
          title: string
          topic: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          resource_type?: string | null
          source?: string | null
          title: string
          topic?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          resource_type?: string | null
          source?: string | null
          title?: string
          topic?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      study_roadmap: {
        Row: {
          course_id: string
          created_at: string
          effort_level: string | null
          focus_area: string
          id: string
          tasks: Json | null
          user_id: string
          week_number: number
        }
        Insert: {
          course_id: string
          created_at?: string
          effort_level?: string | null
          focus_area: string
          id?: string
          tasks?: Json | null
          user_id: string
          week_number: number
        }
        Update: {
          course_id?: string
          created_at?: string
          effort_level?: string | null
          focus_area?: string
          id?: string
          tasks?: Json | null
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_roadmap_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_dates: {
        Row: {
          course_id: string
          created_at: string
          date: string | null
          event_type: string | null
          id: string
          is_high_stakes: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date?: string | null
          event_type?: string | null
          id?: string
          is_high_stakes?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date?: string | null
          event_type?: string | null
          id?: string
          is_high_stakes?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_dates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
