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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      auth_flow_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          is_used: boolean | null
          purpose: string
          token: string
          token_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          is_used?: boolean | null
          purpose: string
          token: string
          token_id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          is_used?: boolean | null
          purpose?: string
          token?: string
          token_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_community: {
        Row: {
          assigned_at: string | null
          event_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          event_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_community_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_community_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_community_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_community_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_images: {
        Row: {
          created_at: string | null
          event_id: string
          image_url: string
          priority_order: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          image_url: string
          priority_order: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          image_url?: string
          priority_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      events: {
        Row: {
          allowed_payment_methods:
            | Database["public"]["Enums"]["payment_source"][]
            | null
          category_id: string
          created_at: string | null
          description: string
          end_at: string
          event_id: string
          is_active: boolean | null
          is_vip: boolean | null
          location: string
          map_link: string
          name: string
          organizer_id: string
          platform_fee_cap: number | null
          platform_fee_type: Database["public"]["Enums"]["discount_type"]
          platform_fee_value: number
          requirements: string | null
          start_at: string
          status: Database["public"]["Enums"]["event_status"] | null
          subtitle: string
          updated_at: string | null
        }
        Insert: {
          allowed_payment_methods?:
            | Database["public"]["Enums"]["payment_source"][]
            | null
          category_id: string
          created_at?: string | null
          description: string
          end_at: string
          event_id?: string
          is_active?: boolean | null
          is_vip?: boolean | null
          location: string
          map_link: string
          name: string
          organizer_id: string
          platform_fee_cap?: number | null
          platform_fee_type?: Database["public"]["Enums"]["discount_type"]
          platform_fee_value?: number
          requirements?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["event_status"] | null
          subtitle: string
          updated_at?: string | null
        }
        Update: {
          allowed_payment_methods?:
            | Database["public"]["Enums"]["payment_source"][]
            | null
          category_id?: string
          created_at?: string | null
          description?: string
          end_at?: string
          event_id?: string
          is_active?: boolean | null
          is_vip?: boolean | null
          location?: string
          map_link?: string
          name?: string
          organizer_id?: string
          platform_fee_cap?: number | null
          platform_fee_type?: Database["public"]["Enums"]["discount_type"]
          platform_fee_value?: number
          requirements?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          subtitle?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          event_id: string
          final_amount: number
          order_id: string
          payment_source: Database["public"]["Enums"]["payment_source"]
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          promotion_id: string | null
          remarks: string | null
          subtotal: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          event_id: string
          final_amount: number
          order_id?: string
          payment_source: Database["public"]["Enums"]["payment_source"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          promotion_id?: string | null
          remarks?: string | null
          subtotal?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          event_id?: string
          final_amount?: number
          order_id?: string
          payment_source?: Database["public"]["Enums"]["payment_source"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          promotion_id?: string | null
          remarks?: string | null
          subtotal?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "orders_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["promotion_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizer_details: {
        Row: {
          account_holder_name: string
          account_number: string
          address: string
          bank_branch: string
          bank_name: string
          created_at: string | null
          is_submitted: boolean | null
          nic_back_image_url: string
          nic_front_image_url: string
          nic_number: string
          remarks: string | null
          status: Database["public"]["Enums"]["organizer_status"] | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          address: string
          bank_branch: string
          bank_name: string
          created_at?: string | null
          is_submitted?: boolean | null
          nic_back_image_url: string
          nic_front_image_url: string
          nic_number: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["organizer_status"] | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          address?: string
          bank_branch?: string
          bank_name?: string
          created_at?: string | null
          is_submitted?: boolean | null
          nic_back_image_url?: string
          nic_front_image_url?: string
          nic_number?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["organizer_status"] | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organizer_details_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      otp_records: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          is_used: boolean | null
          last_sent_at: string | null
          otp_hash: string
          otp_id: string
          purpose: string
          resend_count: number | null
          user_id: string | null
          verify_attempts: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          is_used?: boolean | null
          last_sent_at?: string | null
          otp_hash: string
          otp_id?: string
          purpose: string
          resend_count?: number | null
          user_id?: string | null
          verify_attempts?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          is_used?: boolean | null
          last_sent_at?: string | null
          otp_hash?: string
          otp_id?: string
          purpose?: string
          resend_count?: number | null
          user_id?: string | null
          verify_attempts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payouts: {
        Row: {
          bank_transfer_ref: string | null
          created_at: string | null
          event_id: string
          gross_revenue: number
          net_payout_amount: number
          organizer_id: string
          payout_id: string
          platform_fee_amount: number
          processed_at: string | null
          processed_by: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string | null
        }
        Insert: {
          bank_transfer_ref?: string | null
          created_at?: string | null
          event_id: string
          gross_revenue: number
          net_payout_amount: number
          organizer_id: string
          payout_id?: string
          platform_fee_amount: number
          processed_at?: string | null
          processed_by?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string | null
        }
        Update: {
          bank_transfer_ref?: string | null
          created_at?: string | null
          event_id?: string
          gross_revenue?: number
          net_payout_amount?: number
          organizer_id?: string
          payout_id?: string
          platform_fee_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "payouts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      promotion_usages: {
        Row: {
          discount_received: number
          order_id: string
          promotion_id: string
          usage_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          discount_received: number
          order_id: string
          promotion_id: string
          usage_id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          discount_received?: number
          order_id?: string
          promotion_id?: string
          usage_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "promotion_usages_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["promotion_id"]
          },
          {
            foreignKeyName: "promotion_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      promotions: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          current_global_usage: number | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at: string
          extra_rules_json: Json | null
          is_active: boolean | null
          max_discount_cap: number | null
          min_order_amount: number | null
          promotion_id: string
          scope_event_id: string | null
          scope_ticket_type_id: string | null
          start_at: string
          updated_at: string | null
          usage_limit_global: number | null
          usage_limit_per_user: number | null
          version: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          current_global_usage?: number | null
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at: string
          extra_rules_json?: Json | null
          is_active?: boolean | null
          max_discount_cap?: number | null
          min_order_amount?: number | null
          promotion_id?: string
          scope_event_id?: string | null
          scope_ticket_type_id?: string | null
          start_at: string
          updated_at?: string | null
          usage_limit_global?: number | null
          usage_limit_per_user?: number | null
          version?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          current_global_usage?: number | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          end_at?: string
          extra_rules_json?: Json | null
          is_active?: boolean | null
          max_discount_cap?: number | null
          min_order_amount?: number | null
          promotion_id?: string
          scope_event_id?: string | null
          scope_ticket_type_id?: string | null
          start_at?: string
          updated_at?: string | null
          usage_limit_global?: number | null
          usage_limit_per_user?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "promotions_scope_event_id_fkey"
            columns: ["scope_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "promotions_scope_event_id_fkey"
            columns: ["scope_event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "promotions_scope_event_id_fkey"
            columns: ["scope_event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "promotions_scope_ticket_type_id_fkey"
            columns: ["scope_ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["ticket_type_id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          admin_note: string | null
          created_at: string | null
          gateway_refund_ref: string | null
          order_id: string
          reason: string
          refund_amount: number
          refund_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
          ticket_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string | null
          gateway_refund_ref?: string | null
          order_id: string
          reason: string
          refund_amount: number
          refund_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          ticket_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string | null
          gateway_refund_ref?: string | null
          order_id?: string
          reason?: string
          refund_amount?: number
          refund_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          ticket_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "refund_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refund_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "refund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string | null
          event_id: string
          is_visible: boolean | null
          rating: number
          review_id: string
          review_text: string | null
          ticket_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          is_visible?: boolean | null
          rating: number
          review_id?: string
          review_text?: string | null
          ticket_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          is_visible?: boolean | null
          rating?: number
          review_id?: string
          review_text?: string | null
          ticket_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "reviews_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          result: Database["public"]["Enums"]["scan_result"]
          scan_id: number
          scanned_at: string | null
          scanned_by_user_id: string
          ticket_id: string
        }
        Insert: {
          result: Database["public"]["Enums"]["scan_result"]
          scan_id?: number
          scanned_at?: string | null
          scanned_by_user_id: string
          ticket_id: string
        }
        Update: {
          result?: Database["public"]["Enums"]["scan_result"]
          scan_id?: number
          scanned_at?: string | null
          scanned_by_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_scanned_by_user_id_fkey"
            columns: ["scanned_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scan_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_reservations: {
        Row: {
          event_id: string
          expires_at: string
          order_id: string | null
          quantity: number
          reservation_id: string
          reserved_at: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          ticket_type_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          expires_at: string
          order_id?: string | null
          quantity?: number
          reservation_id?: string
          reserved_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          ticket_type_id: string
          user_id: string
        }
        Update: {
          event_id?: string
          expires_at?: string
          order_id?: string | null
          quantity?: number
          reservation_id?: string
          reserved_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          ticket_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "ticket_reservations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["ticket_type_id"]
          },
          {
            foreignKeyName: "ticket_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          capacity: number
          created_at: string | null
          description: string
          event_id: string
          inclusions: Json
          is_active: boolean | null
          name: string
          price: number
          qty_sold: number | null
          sale_end_at: string | null
          sale_start_at: string | null
          ticket_type_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          description: string
          event_id: string
          inclusions: Json
          is_active?: boolean | null
          name: string
          price?: number
          qty_sold?: number | null
          sale_end_at?: string | null
          sale_start_at?: string | null
          ticket_type_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          description?: string
          event_id?: string
          inclusions?: Json
          is_active?: boolean | null
          name?: string
          price?: number
          qty_sold?: number | null
          sale_end_at?: string | null
          sale_start_at?: string | null
          ticket_type_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_email: string | null
          attendee_mobile: string | null
          attendee_name: string | null
          attendee_nic: string | null
          created_at: string | null
          event_id: string
          order_id: string
          owner_user_id: string
          price_purchased: number
          qr_hash: string
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string
          ticket_type_id: string
          updated_at: string | null
        }
        Insert: {
          attendee_email?: string | null
          attendee_mobile?: string | null
          attendee_name?: string | null
          attendee_nic?: string | null
          created_at?: string | null
          event_id: string
          order_id: string
          owner_user_id: string
          price_purchased: number
          qr_hash: string
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id?: string
          ticket_type_id: string
          updated_at?: string | null
        }
        Update: {
          attendee_email?: string | null
          attendee_mobile?: string | null
          attendee_name?: string | null
          attendee_nic?: string | null
          created_at?: string | null
          event_id?: string
          order_id?: string
          owner_user_id?: string
          price_purchased?: number
          qr_hash?: string
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id?: string
          ticket_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "tickets_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["ticket_type_id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          gateway: Database["public"]["Enums"]["gateway_type"]
          gateway_ref_id: string | null
          meta_data: Json | null
          order_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway: Database["public"]["Enums"]["gateway_type"]
          gateway_ref_id?: string | null
          meta_data?: Json | null
          order_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_id?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway?: Database["public"]["Enums"]["gateway_type"]
          gateway_ref_id?: string | null
          meta_data?: Json | null
          order_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          image_url: string | null
          is_active: boolean | null
          is_email_verified: boolean | null
          is_mobile_verified: boolean | null
          last_login_at: string | null
          mobile: string
          name: string
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          image_url?: string | null
          is_active?: boolean | null
          is_email_verified?: boolean | null
          is_mobile_verified?: boolean | null
          last_login_at?: string | null
          mobile: string
          name: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          image_url?: string | null
          is_active?: boolean | null
          is_email_verified?: boolean | null
          is_mobile_verified?: boolean | null
          last_login_at?: string | null
          mobile?: string
          name?: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      vip_events: {
        Row: {
          assigned_by: string
          created_at: string | null
          event_id: string
          priority_order: number
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          created_at?: string | null
          event_id: string
          priority_order: number
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          created_at?: string | null
          event_id?: string
          priority_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_events_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vip_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "vip_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "vip_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      waitlists: {
        Row: {
          converted_order_id: string | null
          created_at: string | null
          event_id: string
          notified_at: string | null
          notify_email: string
          position_order: number
          status: Database["public"]["Enums"]["waitlist_status"]
          ticket_type_id: string | null
          updated_at: string | null
          user_id: string
          waitlist_id: string
        }
        Insert: {
          converted_order_id?: string | null
          created_at?: string | null
          event_id: string
          notified_at?: string | null
          notify_email: string
          position_order: number
          status?: Database["public"]["Enums"]["waitlist_status"]
          ticket_type_id?: string | null
          updated_at?: string | null
          user_id: string
          waitlist_id?: string
        }
        Update: {
          converted_order_id?: string | null
          created_at?: string | null
          event_id?: string
          notified_at?: string | null
          notify_email?: string
          position_order?: number
          status?: Database["public"]["Enums"]["waitlist_status"]
          ticket_type_id?: string | null
          updated_at?: string | null
          user_id?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_all_active_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_featured_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "waitlists_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["ticket_type_id"]
          },
          {
            foreignKeyName: "waitlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      view_all_active_events: {
        Row: {
          allowed_payment_methods:
            | Database["public"]["Enums"]["payment_source"][]
            | null
          category_id: string | null
          created_at: string | null
          description: string | null
          end_at: string | null
          event_id: string | null
          is_active: boolean | null
          is_vip: boolean | null
          location: string | null
          map_link: string | null
          name: string | null
          organizer_id: string | null
          platform_fee_cap: number | null
          platform_fee_type: Database["public"]["Enums"]["discount_type"] | null
          platform_fee_value: number | null
          requirements: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          subtitle: string | null
          updated_at: string | null
          vip_priority_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      view_featured_events: {
        Row: {
          allowed_payment_methods:
            | Database["public"]["Enums"]["payment_source"][]
            | null
          category_id: string | null
          created_at: string | null
          description: string | null
          end_at: string | null
          event_id: string | null
          is_active: boolean | null
          is_vip: boolean | null
          location: string | null
          map_link: string | null
          name: string | null
          organizer_id: string | null
          platform_fee_cap: number | null
          platform_fee_type: Database["public"]["Enums"]["discount_type"] | null
          platform_fee_value: number | null
          requirements: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          subtitle: string | null
          updated_at: string | null
          vip_priority_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      auto_update_event_time_statuses: { Args: never; Returns: undefined }
      expire_stale_reservations: { Args: never; Returns: undefined }
      finalize_order_tickets: {
        Args: {
          p_gateway_ref_id?: string
          p_order_id: string
          p_payment_status?: Database["public"]["Enums"]["payment_status"]
          p_ticket_qr_data?: Json
          p_user_id: string
        }
        Returns: Json
      }
      reserve_tickets_occ: {
        Args: {
          p_event_id: string
          p_expires_mins?: number
          p_items: Json
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      discount_type: "PERCENTAGE" | "FIXED_AMOUNT"
      event_status:
        | "DRAFT"
        | "PUBLISHED"
        | "ON_SALE"
        | "SOLD_OUT"
        | "ONGOING"
        | "COMPLETED"
        | "CANCELLED"
      gateway_type: "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE"
      organizer_status: "PENDING" | "APPROVED" | "REJECTED"
      payment_source: "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE"
      payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
      payout_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
      refund_status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED"
      reservation_status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED"
      scan_result:
        | "ALLOWED"
        | "DENIED_SOLD_OUT"
        | "DENIED_ALREADY_USED"
        | "DENIED_UNPAID"
        | "DENIED_INVALID"
      ticket_status: "ACTIVE" | "PENDING" | "USED" | "CANCELLED"
      transaction_status: "SUCCESS" | "FAILED"
      user_role: "SYSTEM" | "ORGANIZER" | "STAFF" | "USER"
      waitlist_status: "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED"
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
      discount_type: ["PERCENTAGE", "FIXED_AMOUNT"],
      event_status: [
        "DRAFT",
        "PUBLISHED",
        "ON_SALE",
        "SOLD_OUT",
        "ONGOING",
        "COMPLETED",
        "CANCELLED",
      ],
      gateway_type: ["PAYMENT_GATEWAY", "BANK_TRANSFER", "ONGATE"],
      organizer_status: ["PENDING", "APPROVED", "REJECTED"],
      payment_source: ["PAYMENT_GATEWAY", "BANK_TRANSFER", "ONGATE"],
      payment_status: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      payout_status: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      refund_status: ["PENDING", "APPROVED", "REJECTED", "REFUNDED"],
      reservation_status: ["PENDING", "CONFIRMED", "EXPIRED", "CANCELLED"],
      scan_result: [
        "ALLOWED",
        "DENIED_SOLD_OUT",
        "DENIED_ALREADY_USED",
        "DENIED_UNPAID",
        "DENIED_INVALID",
      ],
      ticket_status: ["ACTIVE", "PENDING", "USED", "CANCELLED"],
      transaction_status: ["SUCCESS", "FAILED"],
      user_role: ["SYSTEM", "ORGANIZER", "STAFF", "USER"],
      waitlist_status: ["WAITING", "NOTIFIED", "CONVERTED", "EXPIRED"],
    },
  },
} as const
