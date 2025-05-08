export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          new_match: boolean
          new_message: boolean
          skill_interest: boolean
          timezone: string
          match_radius: number
          profile_privacy: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          new_match?: boolean
          new_message?: boolean
          skill_interest?: boolean
          timezone?: string
          match_radius?: number
          profile_privacy?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          new_match?: boolean
          new_message?: boolean
          skill_interest?: boolean
          timezone?: string
          match_radius?: number
          profile_privacy?: string
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables ...
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
  }
} 