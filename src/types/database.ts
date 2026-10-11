
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "clothing_items": {
                  Row: {
                    "brand": string | null,"category": Database["public"]['Enums']["clothing_category"],"color": Database["public"]['Enums']["clothing_color"] | null,"colors": (Database["public"]['Enums']["clothing_color"])[],"created_at": string,"id": string,"image_path": string,"image_processed_path": string | null,"is_favorite": boolean,"name": string,"notes": string | null,"seasons": (Database["public"]['Enums']["season"])[],"thumbnail_path": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "brand"?: string | null,"category": Database["public"]['Enums']["clothing_category"],"color"?: Database["public"]['Enums']["clothing_color"] | null,"colors"?: (Database["public"]['Enums']["clothing_color"])[],"created_at"?: string,"id"?: string,"image_path": string,"image_processed_path"?: string | null,"is_favorite"?: boolean,"name": string,"notes"?: string | null,"seasons"?: (Database["public"]['Enums']["season"])[],"thumbnail_path"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "brand"?: string | null,"category"?: Database["public"]['Enums']["clothing_category"],"color"?: Database["public"]['Enums']["clothing_color"] | null,"colors"?: (Database["public"]['Enums']["clothing_color"])[],"created_at"?: string,"id"?: string,"image_path"?: string,"image_processed_path"?: string | null,"is_favorite"?: boolean,"name"?: string,"notes"?: string | null,"seasons"?: (Database["public"]['Enums']["season"])[],"thumbnail_path"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"outfit_items": {
                  Row: {
                    "clothing_item_id": string,"outfit_id": string,"width": number,"x": number,"y": number,"z_index": number
                  }
                  Insert: {
                    "clothing_item_id": string,"outfit_id": string,"width": number,"x": number,"y": number,"z_index"?: number
                  }
                  Update: {
                    "clothing_item_id"?: string,"outfit_id"?: string,"width"?: number,"x"?: number,"y"?: number,"z_index"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_items_clothing_item_id_fkey"
      columns: ["clothing_item_id"]
isOneToOne: false
      referencedRelation: "clothing_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outfit_items_outfit_id_fkey"
      columns: ["outfit_id"]
isOneToOne: false
      referencedRelation: "outfits"
      referencedColumns: ["id"]
    }
                  ]
                },"outfits": {
                  Row: {
                    "created_at": string,"id": string,"is_favorite": boolean,"name": string,"notes": string | null,"occasion": Database["public"]['Enums']["occasion"] | null,"seasons": (Database["public"]['Enums']["season"])[],"thumbnail_path": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_favorite"?: boolean,"name": string,"notes"?: string | null,"occasion"?: Database["public"]['Enums']["occasion"] | null,"seasons"?: (Database["public"]['Enums']["season"])[],"thumbnail_path"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_favorite"?: boolean,"name"?: string,"notes"?: string | null,"occasion"?: Database["public"]['Enums']["occasion"] | null,"seasons"?: (Database["public"]['Enums']["season"])[],"thumbnail_path"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"planned_outfits": {
                  Row: {
                    "created_at": string,"date": string,"event_name": string | null,"id": string,"outfit_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"date": string,"event_name"?: string | null,"id"?: string,"outfit_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"event_name"?: string | null,"id"?: string,"outfit_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "planned_outfits_outfit_id_fkey"
      columns: ["outfit_id"]
isOneToOne: false
      referencedRelation: "outfits"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string
                  }
                  Relationships: [
                    
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
            "clothing_category": "tops"|"bottoms"|"dresses"|"sets"|"jackets_outerwear"|"shoes"|"bags"|"accessories"|"jewelry","clothing_color": "black"|"white"|"cream"|"beige"|"brown"|"gray"|"navy"|"blue"|"green"|"olive"|"yellow"|"orange"|"red"|"pink"|"purple"|"gold"|"silver"|"multi_pattern","occasion": "casual"|"class"|"going_out"|"dinner"|"formal"|"work"|"vacation"|"date_night"|"party"|"workout"|"other","season": "spring"|"summer"|"fall"|"winter"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "clothing_category": ["tops", "bottoms", "dresses", "sets", "jackets_outerwear", "shoes", "bags", "accessories", "jewelry"],"clothing_color": ["black", "white", "cream", "beige", "brown", "gray", "navy", "blue", "green", "olive", "yellow", "orange", "red", "pink", "purple", "gold", "silver", "multi_pattern"],"occasion": ["casual", "class", "going_out", "dinner", "formal", "work", "vacation", "date_night", "party", "workout", "other"],"season": ["spring", "summer", "fall", "winter"]
          }
        }
} as const
