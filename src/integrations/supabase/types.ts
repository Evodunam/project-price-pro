export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_instructions: {
        Row: {
          contractor_id: string
          created_at: string | null
          description: string | null
          id: string
          instructions: string
          system_prompt: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          instructions: string
          system_prompt?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string
          system_prompt?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_instructions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rates: {
        Row: {
          contractor_id: string
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          rate: number
          title: string
          type: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          rate: number
          title: string
          type: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          rate?: number
          title?: string
          type?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rates_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contractor_settings: {
        Row: {
          ai_estimate_template: string | null
          ai_instructions: string | null
          ai_model_settings: Json | null
          ai_preferences: Json | null
          ai_prompt_template: string | null
          ai_rates: Json | null
          branding_colors: Json | null
          created_at: string | null
          estimate_client_message: string | null
          estimate_compact_view: boolean | null
          estimate_footer_text: string | null
          estimate_hide_subtotals: boolean | null
          estimate_signature_enabled: boolean | null
          estimate_template_style: string | null
          excluded_categories: string[] | null
          id: string
          markup_percentage: number | null
          minimum_project_cost: number | null
          preferred_language: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          ai_estimate_template?: string | null
          ai_instructions?: string | null
          ai_model_settings?: Json | null
          ai_preferences?: Json | null
          ai_prompt_template?: string | null
          ai_rates?: Json | null
          branding_colors?: Json | null
          created_at?: string | null
          estimate_client_message?: string | null
          estimate_compact_view?: boolean | null
          estimate_footer_text?: string | null
          estimate_hide_subtotals?: boolean | null
          estimate_signature_enabled?: boolean | null
          estimate_template_style?: string | null
          excluded_categories?: string[] | null
          id: string
          markup_percentage?: number | null
          minimum_project_cost?: number | null
          preferred_language?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_estimate_template?: string | null
          ai_instructions?: string | null
          ai_model_settings?: Json | null
          ai_preferences?: Json | null
          ai_prompt_template?: string | null
          ai_rates?: Json | null
          branding_colors?: Json | null
          created_at?: string | null
          estimate_client_message?: string | null
          estimate_compact_view?: boolean | null
          estimate_footer_text?: string | null
          estimate_hide_subtotals?: boolean | null
          estimate_signature_enabled?: boolean | null
          estimate_template_style?: string | null
          excluded_categories?: string[] | null
          id?: string
          markup_percentage?: number | null
          minimum_project_cost?: number | null
          preferred_language?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          branding_colors: Json | null
          business_address: string | null
          business_logo_url: string | null
          business_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          id: string
          license_number: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          branding_colors?: Json | null
          business_address?: string | null
          business_logo_url?: string | null
          business_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          license_number?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          branding_colors?: Json | null
          business_address?: string | null
          business_logo_url?: string | null
          business_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          license_number?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_generated_message: string | null
          ai_generated_title: string | null
          answers: Json | null
          category: string | null
          client_signature: string | null
          client_signature_date: string | null
          contractor_id: string | null
          contractor_signature: string | null
          contractor_signature_date: string | null
          created_at: string | null
          error_message: string | null
          error_timestamp: string | null
          estimate_data: Json | null
          estimated_cost: number | null
          id: string
          image_url: string | null
          is_test_estimate: boolean | null
          preview_data: Json | null
          project_address: string | null
          project_description: string | null
          project_images: Json | null
          project_title: string
          status: string | null
          updated_at: string | null
          user_email: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          ai_generated_message?: string | null
          ai_generated_title?: string | null
          answers?: Json | null
          category?: string | null
          client_signature?: string | null
          client_signature_date?: string | null
          contractor_id?: string | null
          contractor_signature?: string | null
          contractor_signature_date?: string | null
          created_at?: string | null
          error_message?: string | null
          error_timestamp?: string | null
          estimate_data?: Json | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          is_test_estimate?: boolean | null
          preview_data?: Json | null
          project_address?: string | null
          project_description?: string | null
          project_images?: Json | null
          project_title: string
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          ai_generated_message?: string | null
          ai_generated_title?: string | null
          answers?: Json | null
          category?: string | null
          client_signature?: string | null
          client_signature_date?: string | null
          contractor_id?: string | null
          contractor_signature?: string | null
          contractor_signature_date?: string | null
          created_at?: string | null
          error_message?: string | null
          error_timestamp?: string | null
          estimate_data?: Json | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          is_test_estimate?: boolean | null
          preview_data?: Json | null
          project_address?: string | null
          project_description?: string | null
          project_images?: Json | null
          project_title?: string
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Options: {
        Row: {
          Carpenter: Json | null
          Concrete: Json | null
          "Deck & porch": Json | null
          Demolition: Json | null
          Door: Json | null
          Drywall: Json | null
          Electrician: Json | null
          "Fence Installation": Json | null
          "Flooring Installation": Json | null
          "Key Options": string
          "Kitchen Remodel": Json | null
          Landscaping: Json | null
          "Major Renovation": Json | null
          "Mold remediation": Json | null
          Moving: Json | null
          Painting: Json | null
          Plumber: Json | null
          Repairs: Json | null
          "Security System": Json | null
        }
        Insert: {
          Carpenter?: Json | null
          Concrete?: Json | null
          "Deck & porch"?: Json | null
          Demolition?: Json | null
          Door?: Json | null
          Drywall?: Json | null
          Electrician?: Json | null
          "Fence Installation"?: Json | null
          "Flooring Installation"?: Json | null
          "Key Options"?: string
          "Kitchen Remodel"?: Json | null
          Landscaping?: Json | null
          "Major Renovation"?: Json | null
          "Mold remediation"?: Json | null
          Moving?: Json | null
          Painting?: Json | null
          Plumber?: Json | null
          Repairs?: Json | null
          "Security System"?: Json | null
        }
        Update: {
          Carpenter?: Json | null
          Concrete?: Json | null
          "Deck & porch"?: Json | null
          Demolition?: Json | null
          Door?: Json | null
          Drywall?: Json | null
          Electrician?: Json | null
          "Fence Installation"?: Json | null
          "Flooring Installation"?: Json | null
          "Key Options"?: string
          "Kitchen Remodel"?: Json | null
          Landscaping?: Json | null
          "Major Renovation"?: Json | null
          "Mold remediation"?: Json | null
          Moving?: Json | null
          Painting?: Json | null
          Plumber?: Json | null
          Repairs?: Json | null
          "Security System"?: Json | null
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      question_sets: {
        Row: {
          category: string | null
          created_at: string | null
          data: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      teammates: {
        Row: {
          contractor_id: string
          created_at: string | null
          email: string
          id: string
          invitation_sent_at: string | null
          invitation_status: string
          role: string
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          email: string
          id?: string
          invitation_sent_at?: string | null
          invitation_status?: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          email?: string
          id?: string
          invitation_sent_at?: string | null
          invitation_status?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teammates_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          contractor_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          url: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          url: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
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
      estimate_template_style:
        | "modern"
        | "classic"
        | "minimal"
        | "bold"
        | "excel"
      question_template_type: "single_choice" | "multi_choice"
      question_type: "multiple_choice" | "multi_select" | "yes_no"
      subscription_status: "active" | "inactive" | "trial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
