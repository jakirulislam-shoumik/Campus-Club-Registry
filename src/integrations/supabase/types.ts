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
      admins: {
        Row: {
          admin_id: string
          email: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["admin_level"]
        }
        Insert: {
          admin_id: string
          email: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_level"]
        }
        Update: {
          admin_id?: string
          email?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_level"]
        }
        Relationships: []
      }
      clubs: {
        Row: {
          category: string
          club_id: string
          club_name: string
          created_at: string
          created_by: string | null
          description: string
          email: string
          established_date: string | null
          status: Database["public"]["Enums"]["club_status"]
        }
        Insert: {
          category: string
          club_id?: string
          club_name: string
          created_at?: string
          created_by?: string | null
          description?: string
          email: string
          established_date?: string | null
          status?: Database["public"]["Enums"]["club_status"]
        }
        Update: {
          category?: string
          club_id?: string
          club_name?: string
          created_at?: string
          created_by?: string | null
          description?: string
          email?: string
          established_date?: string | null
          status?: Database["public"]["Enums"]["club_status"]
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["admin_id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          feedback: string | null
          registration_date: string
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
          student_id: string
        }
        Insert: {
          event_id: string
          feedback?: string | null
          registration_date?: string
          registration_id?: string
          status?: Database["public"]["Enums"]["registration_status"]
          student_id: string
        }
        Update: {
          event_id?: string
          feedback?: string | null
          registration_date?: string
          registration_id?: string
          status?: Database["public"]["Enums"]["registration_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          description: string
          end_time: string
          event_date: string
          event_id: string
          event_name: string
          start_time: string
          venue: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_time: string
          event_date: string
          event_id?: string
          event_name: string
          start_time: string
          venue: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_time?: string
          event_date?: string
          event_id?: string
          event_name?: string
          start_time?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["club_id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["admin_id"]
          },
        ]
      }
      memberships: {
        Row: {
          club_id: string
          join_date: string
          membership_id: string
          role_in_club: Database["public"]["Enums"]["club_role"]
          status: Database["public"]["Enums"]["membership_status"]
          student_id: string
        }
        Insert: {
          club_id: string
          join_date?: string
          membership_id?: string
          role_in_club?: Database["public"]["Enums"]["club_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          student_id: string
        }
        Update: {
          club_id?: string
          join_date?: string
          membership_id?: string
          role_in_club?: Database["public"]["Enums"]["club_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["club_id"]
          },
          {
            foreignKeyName: "memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          department: string | null
          email: string
          name: string
          phone: string | null
          registration_date: string
          semester: number | null
          student_id: string
        }
        Insert: {
          department?: string | null
          email: string
          name: string
          phone?: string | null
          registration_date?: string
          semester?: number | null
          student_id: string
        }
        Update: {
          department?: string | null
          email?: string
          name?: string
          phone?: string | null
          registration_date?: string
          semester?: number | null
          student_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      provision_admin: {
        Args: { _email: string; _id: string; _name: string; _phone: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_level: "Super Admin" | "Club Admin"
      app_role: "admin" | "student"
      club_role: "Member" | "Executive"
      club_status: "Active" | "Inactive"
      membership_status: "Pending" | "Active" | "Rejected"
      registration_status: "Registered" | "Cancelled" | "Attended"
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
      admin_level: ["Super Admin", "Club Admin"],
      app_role: ["admin", "student"],
      club_role: ["Member", "Executive"],
      club_status: ["Active", "Inactive"],
      membership_status: ["Pending", "Active", "Rejected"],
      registration_status: ["Registered", "Cancelled", "Attended"],
    },
  },
} as const
