export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      algo_assets: {
        Row: {
          asset_id: number
          created_at: string
          decimals: number
          id: number
          is_native: boolean
          is_supported: boolean
          name: string
          network: string
          unit_name: string
          updated_at: string
        }
        Insert: {
          asset_id: number
          created_at?: string
          decimals: number
          id?: number
          is_native?: boolean
          is_supported?: boolean
          name: string
          network?: string
          unit_name: string
          updated_at?: string
        }
        Update: {
          asset_id?: number
          created_at?: string
          decimals?: number
          id?: number
          is_native?: boolean
          is_supported?: boolean
          name?: string
          network?: string
          unit_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      algo_limit_orders: {
        Row: {
          always_use_starting_amount_in: boolean
          amount_in: string
          amount_received: string | null
          asset_in: number
          asset_out: number
          at_price: string
          completed_on: string | null
          created_at: string
          dex_used: string | null
          excess_group_id: string | null
          excess_txn_id: string | null
          first_asset_in_linked_trades: number | null
          generate_reverse_trade: boolean
          group_id: string | null
          id: number
          is_active: boolean
          is_completed: boolean
          network: string
          order_type: string
          origin_trade: number | null
          reverse_trade_at_price: string | null
          slippage: number
          txn_id: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          always_use_starting_amount_in?: boolean
          amount_in: string
          amount_received?: string | null
          asset_in: number
          asset_out: number
          at_price: string
          completed_on?: string | null
          created_at?: string
          dex_used?: string | null
          excess_group_id?: string | null
          excess_txn_id?: string | null
          first_asset_in_linked_trades?: number | null
          generate_reverse_trade?: boolean
          group_id?: string | null
          id?: number
          is_active?: boolean
          is_completed?: boolean
          network?: string
          order_type: string
          origin_trade?: number | null
          reverse_trade_at_price?: string | null
          slippage?: number
          txn_id?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          always_use_starting_amount_in?: boolean
          amount_in?: string
          amount_received?: string | null
          asset_in?: number
          asset_out?: number
          at_price?: string
          completed_on?: string | null
          created_at?: string
          dex_used?: string | null
          excess_group_id?: string | null
          excess_txn_id?: string | null
          first_asset_in_linked_trades?: number | null
          generate_reverse_trade?: boolean
          group_id?: string | null
          id?: number
          is_active?: boolean
          is_completed?: boolean
          network?: string
          order_type?: string
          origin_trade?: number | null
          reverse_trade_at_price?: string | null
          slippage?: number
          txn_id?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "algo_limit_orders_asset_in_fkey"
            columns: ["asset_in"]
            isOneToOne: false
            referencedRelation: "algo_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algo_limit_orders_asset_out_fkey"
            columns: ["asset_out"]
            isOneToOne: false
            referencedRelation: "algo_assets"
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

