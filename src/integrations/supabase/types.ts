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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          case_id: string | null
          created_at: string
          id: string
          payload: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          address: string | null
          assigned_civil_officer: string | null
          assigned_doctor: string | null
          assigned_funeral_provider: string | null
          assigned_notary: string | null
          case_number: string
          city: string | null
          county: string | null
          created_at: string
          created_by: string
          death_cause_type: Database["public"]["Enums"]["death_cause_type"]
          death_location: string | null
          deceased_cnp: string | null
          deceased_dob: string | null
          deceased_dod: string
          deceased_full_name: string
          id: string
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_civil_officer?: string | null
          assigned_doctor?: string | null
          assigned_funeral_provider?: string | null
          assigned_notary?: string | null
          case_number?: string
          city?: string | null
          county?: string | null
          created_at?: string
          created_by: string
          death_cause_type?: Database["public"]["Enums"]["death_cause_type"]
          death_location?: string | null
          deceased_cnp?: string | null
          deceased_dob?: string | null
          deceased_dod: string
          deceased_full_name: string
          id?: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_civil_officer?: string | null
          assigned_doctor?: string | null
          assigned_funeral_provider?: string | null
          assigned_notary?: string | null
          case_number?: string
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string
          death_cause_type?: Database["public"]["Enums"]["death_cause_type"]
          death_location?: string | null
          deceased_cnp?: string | null
          deceased_dob?: string | null
          deceased_dod?: string
          deceased_full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string
          id: string
          issued_at: string
          metadata: Json | null
          signature_meta: Json | null
          signed: boolean
          storage_path: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          id?: string
          issued_at?: string
          metadata?: Json | null
          signature_meta?: Json | null
          signed?: boolean
          storage_path?: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          id?: string
          issued_at?: string
          metadata?: Json | null
          signature_meta?: Json | null
          signed?: boolean
          storage_path?: string | null
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          case_id: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          cnp: string | null
          county: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          case_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          legal_deadline: string | null
          legal_reference: string | null
          role_responsible: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          case_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          legal_deadline?: string | null
          legal_reference?: string | null
          role_responsible?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          case_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          legal_deadline?: string | null
          legal_reference?: string | null
          role_responsible?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
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
      get_user_county: { Args: { _user_id: string }; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
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
      app_role:
        | "family"
        | "doctor"
        | "civil_officer"
        | "funeral_provider"
        | "notary"
        | "admin"
      case_status:
        | "DRAFT"
        | "AWAITING_DOCTOR"
        | "CMCD_ISSUED"
        | "AWAITING_CIVIL_OFFICER"
        | "DEATH_CERT_ISSUED"
        | "FUNERAL_SCHEDULED"
        | "FUNERAL_COMPLETED"
        | "SUCCESSION_OPEN"
        | "SUCCESSION_CLOSED"
        | "ARCHIVED"
      death_cause_type: "natural" | "violent" | "suspect" | "unknown"
      document_type:
        | "cmcd"
        | "death_certificate"
        | "burial_permit"
        | "parquet_release"
        | "funeral_contract"
        | "inheritance_acceptance"
        | "inheritance_certificate"
        | "id_card"
        | "birth_certificate"
        | "marriage_certificate"
        | "other"
      task_status: "todo" | "in_progress" | "done" | "skipped"
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
      app_role: [
        "family",
        "doctor",
        "civil_officer",
        "funeral_provider",
        "notary",
        "admin",
      ],
      case_status: [
        "DRAFT",
        "AWAITING_DOCTOR",
        "CMCD_ISSUED",
        "AWAITING_CIVIL_OFFICER",
        "DEATH_CERT_ISSUED",
        "FUNERAL_SCHEDULED",
        "FUNERAL_COMPLETED",
        "SUCCESSION_OPEN",
        "SUCCESSION_CLOSED",
        "ARCHIVED",
      ],
      death_cause_type: ["natural", "violent", "suspect", "unknown"],
      document_type: [
        "cmcd",
        "death_certificate",
        "burial_permit",
        "parquet_release",
        "funeral_contract",
        "inheritance_acceptance",
        "inheritance_certificate",
        "id_card",
        "birth_certificate",
        "marriage_certificate",
        "other",
      ],
      task_status: ["todo", "in_progress", "done", "skipped"],
    },
  },
} as const
