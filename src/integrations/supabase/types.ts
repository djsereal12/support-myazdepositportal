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
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demand_letters: {
        Row: {
          amount_withheld: number | null
          body: string | null
          created_at: string
          id: string
          letter_pdf_url: string | null
          property_id: string | null
          report_id: string | null
          user_id: string
        }
        Insert: {
          amount_withheld?: number | null
          body?: string | null
          created_at?: string
          id?: string
          letter_pdf_url?: string | null
          property_id?: string | null
          report_id?: string | null
          user_id?: string
        }
        Update: {
          amount_withheld?: number | null
          body?: string | null
          created_at?: string
          id?: string
          letter_pdf_url?: string | null
          property_id?: string | null
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_letters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_letters_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          amount_claimed: number
          created_at: string
          id: string
          items: string | null
          landlord_id: string
          property_id: string | null
          reason: string | null
          report_id: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          amount_claimed?: number
          created_at?: string
          id?: string
          items?: string | null
          landlord_id?: string
          property_id?: string | null
          reason?: string | null
          report_id: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          amount_claimed?: number
          created_at?: string
          id?: string
          items?: string | null
          landlord_id?: string
          property_id?: string | null
          reason?: string | null
          report_id?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_messages: {
        Row: {
          author_name: string | null
          author_role: string
          body: string
          created_at: string
          id: string
          invite_id: string
          report_id: string
        }
        Insert: {
          author_name?: string | null
          author_role: string
          body: string
          created_at?: string
          id?: string
          invite_id: string
          report_id: string
        }
        Update: {
          author_name?: string | null
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          invite_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_messages_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "landlord_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_messages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_invites: {
        Row: {
          created_at: string
          custom_message: string | null
          expires_at: string
          id: string
          landlord_email: string
          landlord_name: string | null
          property_id: string | null
          report_id: string
          responded_at: string | null
          response_ip: string | null
          response_note: string | null
          response_signature_name: string | null
          sent_at: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          expires_at?: string
          id?: string
          landlord_email: string
          landlord_name?: string | null
          property_id?: string | null
          report_id: string
          responded_at?: string | null
          response_ip?: string | null
          response_note?: string | null
          response_signature_name?: string | null
          sent_at?: string
          status?: string
          token: string
          user_id?: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          expires_at?: string
          id?: string
          landlord_email?: string
          landlord_name?: string | null
          property_id?: string | null
          report_id?: string
          responded_at?: string | null
          response_ip?: string | null
          response_note?: string | null
          response_signature_name?: string | null
          sent_at?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_invites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_invites_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_letters: {
        Row: {
          amount_withheld: number
          body: string | null
          created_at: string
          dispute_id: string | null
          id: string
          landlord_id: string
          property_id: string | null
          report_id: string
        }
        Insert: {
          amount_withheld?: number
          body?: string | null
          created_at?: string
          dispute_id?: string | null
          id?: string
          landlord_id?: string
          property_id?: string | null
          report_id: string
        }
        Update: {
          amount_withheld?: number
          body?: string | null
          created_at?: string
          dispute_id?: string | null
          id?: string
          landlord_id?: string
          property_id?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_letters_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_letters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_letters_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_profiles: {
        Row: {
          city: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          license_number: string | null
          mailing_address: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          license_number?: string | null
          mailing_address?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          license_number?: string | null
          mailing_address?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          condition: string
          created_at: string
          device_model: string | null
          exif_timestamp: string | null
          file_hash_sha256: string | null
          file_url: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          note: string | null
          report_id: string
          room_label: string
          user_id: string
        }
        Insert: {
          condition?: string
          created_at?: string
          device_model?: string | null
          exif_timestamp?: string | null
          file_hash_sha256?: string | null
          file_url: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          note?: string | null
          report_id: string
          room_label: string
          user_id?: string
        }
        Update: {
          condition?: string
          created_at?: string
          device_model?: string | null
          exif_timestamp?: string | null
          file_hash_sha256?: string | null
          file_url?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          note?: string | null
          report_id?: string
          room_label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          mailing_address: string | null
          notify_email: boolean
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          mailing_address?: string | null
          notify_email?: boolean
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          mailing_address?: string | null
          notify_email?: boolean
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          created_at: string
          deposit_amount: number | null
          id: string
          landlord_email: string | null
          landlord_name: string | null
          lease_end: string | null
          lease_start: string | null
          status: string
          unit: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          deposit_amount?: number | null
          id?: string
          landlord_email?: string | null
          landlord_name?: string | null
          lease_end?: string | null
          lease_start?: string | null
          status?: string
          unit?: string | null
          user_id?: string
        }
        Update: {
          address?: string
          created_at?: string
          deposit_amount?: number | null
          id?: string
          landlord_email?: string | null
          landlord_name?: string | null
          lease_end?: string | null
          lease_start?: string | null
          status?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_total: number | null
          created_at: string
          currency: string | null
          email: string | null
          environment: string
          id: string
          price_id: string
          product_id: string | null
          property_id: string | null
          report_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id?: string | null
          property_id?: string | null
          report_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string | null
          property_id?: string | null
          report_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_shares: {
        Row: {
          created_at: string
          id: string
          landlord_email: string
          property_id: string | null
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_email: string
          property_id?: string | null
          report_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_email?: string
          property_id?: string | null
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_shares_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          overall_hash: string | null
          pdf_url: string | null
          property_id: string
          qr_verification_url: string | null
          report_number: string
          status: string
          type: string
          user_id: string
          weather_snapshot: string | null
        }
        Insert: {
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          overall_hash?: string | null
          pdf_url?: string | null
          property_id: string
          qr_verification_url?: string | null
          report_number?: string
          status?: string
          type?: string
          user_id?: string
          weather_snapshot?: string | null
        }
        Update: {
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          overall_hash?: string | null
          pdf_url?: string | null
          property_id?: string
          qr_verification_url?: string | null
          report_number?: string
          status?: string
          type?: string
          user_id?: string
          weather_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      landlord_can_view_property: {
        Args: { _property_id: string }
        Returns: boolean
      }
      landlord_can_view_report: {
        Args: { _report_id: string }
        Returns: boolean
      }
      report_owner: { Args: { _report_id: string }; Returns: string }
    }
    Enums: {
      app_role: "tenant" | "landlord"
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
      app_role: ["tenant", "landlord"],
    },
  },
} as const
