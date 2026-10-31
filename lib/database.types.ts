
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
            "activity_log": {
                  Row: {
                    "author_id": string | null,"created_at": string,"furniture_id": string,"id": string,"kind": Database["public"]['Enums']["activity_kind"],"label": string,"payload": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"created_at"?: string,"furniture_id": string,"id"?: string,"kind": Database["public"]['Enums']["activity_kind"],"label": string,"payload"?: NonNullable<Json>
                  }
                  Update: {
                    "author_id"?: string | null,"created_at"?: string,"furniture_id"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["activity_kind"],"label"?: string,"payload"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_log_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"appointments": {
                  Row: {
                    "appointment_date": string,"author_id": string | null,"created_at": string,"done": boolean,"furniture_id": string,"id": string,"note": string | null,"period": Database["public"]['Enums']["day_period"],"type": Database["public"]['Enums']["appointment_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "appointment_date": string,"author_id"?: string | null,"created_at"?: string,"done"?: boolean,"furniture_id": string,"id"?: string,"note"?: string | null,"period": Database["public"]['Enums']["day_period"],"type": Database["public"]['Enums']["appointment_type"]
                  }
                  Update: {
                    "appointment_date"?: string,"author_id"?: string | null,"created_at"?: string,"done"?: boolean,"furniture_id"?: string,"id"?: string,"note"?: string | null,"period"?: Database["public"]['Enums']["day_period"],"type"?: Database["public"]['Enums']["appointment_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"attachments": {
                  Row: {
                    "author_id": string | null,"created_at": string,"filename": string,"furniture_id": string,"id": string,"mime": string | null,"note_id": string | null,"size_bytes": number | null,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"created_at"?: string,"filename": string,"furniture_id": string,"id"?: string,"mime"?: string | null,"note_id"?: string | null,"size_bytes"?: number | null,"storage_path": string
                  }
                  Update: {
                    "author_id"?: string | null,"created_at"?: string,"filename"?: string,"furniture_id"?: string,"id"?: string,"mime"?: string | null,"note_id"?: string | null,"size_bytes"?: number | null,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "notes"
      referencedColumns: ["id"]
    }
                  ]
                },"brand_suggestions": {
                  Row: {
                    "created_at": string,"furniture_id": string | null,"id": string,"label": string,"status": Database["public"]['Enums']["suggestion_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"furniture_id"?: string | null,"id"?: string,"label": string,"status"?: Database["public"]['Enums']["suggestion_status"]
                  }
                  Update: {
                    "created_at"?: string,"furniture_id"?: string | null,"id"?: string,"label"?: string,"status"?: Database["public"]['Enums']["suggestion_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "brand_suggestions_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "brand_suggestions_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"brands": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"finance_lines": {
                  Row: {
                    "amount": number,"author_id": string | null,"category": Database["public"]['Enums']["finance_category"],"created_at": string,"furniture_id": string,"id": string,"label": string,"line_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"author_id"?: string | null,"category"?: Database["public"]['Enums']["finance_category"],"created_at"?: string,"furniture_id": string,"id"?: string,"label": string,"line_date"?: string
                  }
                  Update: {
                    "amount"?: number,"author_id"?: string | null,"category"?: Database["public"]['Enums']["finance_category"],"created_at"?: string,"furniture_id"?: string,"id"?: string,"label"?: string,"line_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_lines_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "finance_lines_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"furnitures": {
                  Row: {
                    "access_notes": string | null,"brand_id": string | null,"brand_other": string | null,"category": Database["public"]['Enums']["furniture_category"],"certification_text": string,"certified_at": string,"condition": Database["public"]['Enums']["furniture_condition"],"conformity_report": string | null,"consignment_commission": number | null,"consignment_terms": string | null,"created_at": string,"defects": string | null,"depth_cm": number | null,"description": string,"designer": string | null,"desired_price": number | null,"expected_sale_price": number | null,"final_buyout_price": number | null,"final_sale_price": number | null,"floor": Database["public"]['Enums']["floor_level"] | null,"has_elevator": boolean | null,"height_cm": number | null,"id": string,"is_abandoned": boolean,"listed_price": number | null,"listing_lbc": Json | null,"listing_site": Json | null,"manufacture_year": string | null,"materials": string | null,"mode": Database["public"]['Enums']["furniture_mode"] | null,"name": string,"non_conform_at": string | null,"non_conform_choice": Database["public"]['Enums']["non_conform_choice"] | null,"offer_buyout_price": number | null,"offer_sent_at": string | null,"original_price": number | null,"picked_up_by_buyer_at": string | null,"published_lbc": boolean,"published_lbc_at": string | null,"published_site": boolean,"published_site_at": string | null,"purchase_year": string | null,"received_at": string | null,"refusal_reason": Database["public"]['Enums']["refusal_reason"] | null,"return_quote": number | null,"returned_at": string | null,"sale_channel": Database["public"]['Enums']["sale_channel"] | null,"seller_city": string,"seller_email": string,"seller_first_name": string,"seller_last_name": string,"seller_phone": string,"seller_postal_code": string,"seller_street": string,"sold_at": string | null,"status": Database["public"]['Enums']["furniture_status"],"status_changed_at": string,"transport_cost": number | null,"updated_at": string,"width_cm": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "access_notes"?: string | null,"brand_id"?: string | null,"brand_other"?: string | null,"category": Database["public"]['Enums']["furniture_category"],"certification_text": string,"certified_at": string,"condition": Database["public"]['Enums']["furniture_condition"],"conformity_report"?: string | null,"consignment_commission"?: number | null,"consignment_terms"?: string | null,"created_at"?: string,"defects"?: string | null,"depth_cm"?: number | null,"description": string,"designer"?: string | null,"desired_price"?: number | null,"expected_sale_price"?: number | null,"final_buyout_price"?: number | null,"final_sale_price"?: number | null,"floor"?: Database["public"]['Enums']["floor_level"] | null,"has_elevator"?: boolean | null,"height_cm"?: number | null,"id"?: string,"is_abandoned"?: boolean,"listed_price"?: number | null,"listing_lbc"?: Json | null,"listing_site"?: Json | null,"manufacture_year"?: string | null,"materials"?: string | null,"mode"?: Database["public"]['Enums']["furniture_mode"] | null,"name": string,"non_conform_at"?: string | null,"non_conform_choice"?: Database["public"]['Enums']["non_conform_choice"] | null,"offer_buyout_price"?: number | null,"offer_sent_at"?: string | null,"original_price"?: number | null,"picked_up_by_buyer_at"?: string | null,"published_lbc"?: boolean,"published_lbc_at"?: string | null,"published_site"?: boolean,"published_site_at"?: string | null,"purchase_year"?: string | null,"received_at"?: string | null,"refusal_reason"?: Database["public"]['Enums']["refusal_reason"] | null,"return_quote"?: number | null,"returned_at"?: string | null,"sale_channel"?: Database["public"]['Enums']["sale_channel"] | null,"seller_city": string,"seller_email": string,"seller_first_name": string,"seller_last_name": string,"seller_phone": string,"seller_postal_code": string,"seller_street": string,"sold_at"?: string | null,"status"?: Database["public"]['Enums']["furniture_status"],"status_changed_at"?: string,"transport_cost"?: number | null,"updated_at"?: string,"width_cm"?: number | null
                  }
                  Update: {
                    "access_notes"?: string | null,"brand_id"?: string | null,"brand_other"?: string | null,"category"?: Database["public"]['Enums']["furniture_category"],"certification_text"?: string,"certified_at"?: string,"condition"?: Database["public"]['Enums']["furniture_condition"],"conformity_report"?: string | null,"consignment_commission"?: number | null,"consignment_terms"?: string | null,"created_at"?: string,"defects"?: string | null,"depth_cm"?: number | null,"description"?: string,"designer"?: string | null,"desired_price"?: number | null,"expected_sale_price"?: number | null,"final_buyout_price"?: number | null,"final_sale_price"?: number | null,"floor"?: Database["public"]['Enums']["floor_level"] | null,"has_elevator"?: boolean | null,"height_cm"?: number | null,"id"?: string,"is_abandoned"?: boolean,"listed_price"?: number | null,"listing_lbc"?: Json | null,"listing_site"?: Json | null,"manufacture_year"?: string | null,"materials"?: string | null,"mode"?: Database["public"]['Enums']["furniture_mode"] | null,"name"?: string,"non_conform_at"?: string | null,"non_conform_choice"?: Database["public"]['Enums']["non_conform_choice"] | null,"offer_buyout_price"?: number | null,"offer_sent_at"?: string | null,"original_price"?: number | null,"picked_up_by_buyer_at"?: string | null,"published_lbc"?: boolean,"published_lbc_at"?: string | null,"published_site"?: boolean,"published_site_at"?: string | null,"purchase_year"?: string | null,"received_at"?: string | null,"refusal_reason"?: Database["public"]['Enums']["refusal_reason"] | null,"return_quote"?: number | null,"returned_at"?: string | null,"sale_channel"?: Database["public"]['Enums']["sale_channel"] | null,"seller_city"?: string,"seller_email"?: string,"seller_first_name"?: string,"seller_last_name"?: string,"seller_phone"?: string,"seller_postal_code"?: string,"seller_street"?: string,"sold_at"?: string | null,"status"?: Database["public"]['Enums']["furniture_status"],"status_changed_at"?: string,"transport_cost"?: number | null,"updated_at"?: string,"width_cm"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "furnitures_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"furniture_id": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"furniture_id": string,"id"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"furniture_id"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"photos": {
                  Row: {
                    "created_at": string,"furniture_id": string | null,"id": string,"is_main": boolean,"kind": Database["public"]['Enums']["photo_kind"],"position": number,"slot": Database["public"]['Enums']["photo_slot"],"storage_path": string,"submission_id": string | null,"thumb_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"furniture_id"?: string | null,"id"?: string,"is_main"?: boolean,"kind": Database["public"]['Enums']["photo_kind"],"position"?: number,"slot"?: Database["public"]['Enums']["photo_slot"],"storage_path": string,"submission_id"?: string | null,"thumb_path"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"furniture_id"?: string | null,"id"?: string,"is_main"?: boolean,"kind"?: Database["public"]['Enums']["photo_kind"],"position"?: number,"slot"?: Database["public"]['Enums']["photo_slot"],"storage_path"?: string,"submission_id"?: string | null,"thumb_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "photos_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "first_name": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "first_name"?: string,"id": string
                  }
                  Update: {
                    "first_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"salon_leads": {
                  Row: {
                    "consent": boolean,"consent_text": string,"consented_at": string,"created_at": string,"email": string,"email_error": string | null,"email_sent_at": string | null,"id": string,"ip_hash": string | null,"remind_at": string | null,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "consent": boolean,"consent_text": string,"consented_at"?: string,"created_at"?: string,"email": string,"email_error"?: string | null,"email_sent_at"?: string | null,"id"?: string,"ip_hash"?: string | null,"remind_at"?: string | null,"source": string
                  }
                  Update: {
                    "consent"?: boolean,"consent_text"?: string,"consented_at"?: string,"created_at"?: string,"email"?: string,"email_error"?: string | null,"email_sent_at"?: string | null,"id"?: string,"ip_hash"?: string | null,"remind_at"?: string | null,"source"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"status_history": {
                  Row: {
                    "author_id": string | null,"changed_at": string,"from_status": Database["public"]['Enums']["furniture_status"] | null,"furniture_id": string,"id": string,"payload": NonNullable<Json>,"to_status": Database["public"]['Enums']["furniture_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"changed_at"?: string,"from_status"?: Database["public"]['Enums']["furniture_status"] | null,"furniture_id": string,"id"?: string,"payload"?: NonNullable<Json>,"to_status": Database["public"]['Enums']["furniture_status"]
                  }
                  Update: {
                    "author_id"?: string | null,"changed_at"?: string,"from_status"?: Database["public"]['Enums']["furniture_status"] | null,"furniture_id"?: string,"id"?: string,"payload"?: NonNullable<Json>,"to_status"?: Database["public"]['Enums']["furniture_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "status_history_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "status_history_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                },"time_entries": {
                  Row: {
                    "author_id": string | null,"created_at": string,"entry_date": string,"furniture_id": string,"hours": number,"id": string,"note": string | null,"type": Database["public"]['Enums']["time_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"created_at"?: string,"entry_date"?: string,"furniture_id": string,"hours": number,"id"?: string,"note"?: string | null,"type": Database["public"]['Enums']["time_type"]
                  }
                  Update: {
                    "author_id"?: string | null,"created_at"?: string,"entry_date"?: string,"furniture_id"?: string,"hours"?: number,"id"?: string,"note"?: string | null,"type"?: Database["public"]['Enums']["time_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_entries_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furniture_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_furniture_id_fkey"
      columns: ["furniture_id"]
isOneToOne: false
      referencedRelation: "furnitures"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "furniture_overview": {
                  Row: {
                    "access_notes": string | null,"adjustments_total": number | null,"brand_id": string | null,"brand_name": string | null,"brand_other": string | null,"category": Database["public"]['Enums']["furniture_category"] | null,"certification_text": string | null,"certified_at": string | null,"condition": Database["public"]['Enums']["furniture_condition"] | null,"conformity_report": string | null,"consignment_commission": number | null,"consignment_terms": string | null,"created_at": string | null,"defects": string | null,"depth_cm": number | null,"description": string | null,"designer": string | null,"desired_price": number | null,"expected_sale_price": number | null,"final_buyout_price": number | null,"final_sale_price": number | null,"first_accepted_at": string | null,"first_refused_at": string | null,"floor": Database["public"]['Enums']["floor_level"] | null,"has_elevator": boolean | null,"height_cm": number | null,"hours_total": number | null,"id": string | null,"is_abandoned": boolean | null,"listed_price": number | null,"listing_lbc": Json | null,"listing_site": Json | null,"manufacture_year": string | null,"materials": string | null,"mode": Database["public"]['Enums']["furniture_mode"] | null,"name": string | null,"non_conform_at": string | null,"non_conform_choice": Database["public"]['Enums']["non_conform_choice"] | null,"offer_buyout_price": number | null,"offer_sent_at": string | null,"original_price": number | null,"picked_up_by_buyer_at": string | null,"published_lbc": boolean | null,"published_lbc_at": string | null,"published_site": boolean | null,"published_site_at": string | null,"purchase_year": string | null,"received_at": string | null,"refusal_reason": Database["public"]['Enums']["refusal_reason"] | null,"return_quote": number | null,"returned_at": string | null,"sale_channel": Database["public"]['Enums']["sale_channel"] | null,"seller_city": string | null,"seller_email": string | null,"seller_first_name": string | null,"seller_last_name": string | null,"seller_phone": string | null,"seller_postal_code": string | null,"seller_street": string | null,"sold_at": string | null,"status": Database["public"]['Enums']["furniture_status"] | null,"status_changed_at": string | null,"thumb_path": string | null,"transport_cost": number | null,"updated_at": string | null,"width_cm": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "furnitures_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "change_status":
{ Args: { "p_fields"?: Json,"p_furniture_id": string,"p_history_extra"?: Json,"p_to": Database["public"]['Enums']["furniture_status"] }; Returns: undefined
                           }
          }
          Enums: {
            "activity_kind": "email_prepared"|"field_update"|"note"|"appointment"|"photo"|"ai_generation"|"finance"|"time","appointment_type": "seller_pickup"|"buyer_pickup"|"client_return","day_period": "morning"|"afternoon","finance_category": "extra_cost"|"adjustment"|"other","floor_level": "ground"|"1"|"2"|"3"|"4_plus","furniture_category": "seating"|"storage"|"tables_desks"|"lighting_decor","furniture_condition": "new"|"very_good"|"good"|"used"|"to_restore","furniture_mode": "buyout"|"consignment","furniture_status": "new"|"info_requested"|"accepted"|"offer_sent"|"offer_accepted"|"pickup_scheduled"|"in_transit"|"received"|"non_conform"|"preparing"|"online"|"sold"|"done"|"refused"|"offer_declined"|"returned","non_conform_choice": "client_pickup"|"carrier_return","photo_kind": "deposit"|"certificate"|"conformity"|"listing","photo_slot": "front"|"back"|"side"|"detail"|"defect"|"other","refusal_reason": "out_of_selection"|"bad_condition"|"authenticity"|"bad_timing","sale_channel": "site"|"leboncoin"|"other","suggestion_status": "pending"|"added"|"dismissed","time_type": "cleaning"|"repair"|"photos"|"other"
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
            "activity_kind": ["email_prepared", "field_update", "note", "appointment", "photo", "ai_generation", "finance", "time"],"appointment_type": ["seller_pickup", "buyer_pickup", "client_return"],"day_period": ["morning", "afternoon"],"finance_category": ["extra_cost", "adjustment", "other"],"floor_level": ["ground", "1", "2", "3", "4_plus"],"furniture_category": ["seating", "storage", "tables_desks", "lighting_decor"],"furniture_condition": ["new", "very_good", "good", "used", "to_restore"],"furniture_mode": ["buyout", "consignment"],"furniture_status": ["new", "info_requested", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "non_conform", "preparing", "online", "sold", "done", "refused", "offer_declined", "returned"],"non_conform_choice": ["client_pickup", "carrier_return"],"photo_kind": ["deposit", "certificate", "conformity", "listing"],"photo_slot": ["front", "back", "side", "detail", "defect", "other"],"refusal_reason": ["out_of_selection", "bad_condition", "authenticity", "bad_timing"],"sale_channel": ["site", "leboncoin", "other"],"suggestion_status": ["pending", "added", "dismissed"],"time_type": ["cleaning", "repair", "photos", "other"]
          }
        }
} as const
