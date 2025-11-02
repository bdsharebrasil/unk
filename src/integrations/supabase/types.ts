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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      action_plans: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          progress: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          progress?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          progress?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agenda_items: {
        Row: {
          category: string
          created_at: string | null
          date: string
          description: string | null
          dj_id: string | null
          end_date: string | null
          id: string
          image_url: string | null
          priority: string
          shared_with_dj: boolean | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          dj_id?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          priority?: string
          shared_with_dj?: boolean | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          dj_id?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          priority?: string
          shared_with_dj?: boolean | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_items_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_action_plans: {
        Row: {
          created_at: string
          description: string | null
          goals: string | null
          id: string
          metrics: string | null
          strategies: string | null
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goals?: string | null
          id?: string
          metrics?: string | null
          strategies?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goals?: string | null
          id?: string
          metrics?: string | null
          strategies?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      branding_configs: {
        Row: {
          brand_colors: Json | null
          communication_traits: Json | null
          core_values: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          mission: string | null
          personality_traits: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_colors?: Json | null
          communication_traits?: Json | null
          core_values?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          personality_traits?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_colors?: Json | null
          communication_traits?: Json | null
          core_values?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          personality_traits?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      branding_settings: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          section: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          section: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          section?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      daily_quotes: {
        Row: {
          created_at: string | null
          date: string
          id: string
          quote_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          quote_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quotes_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "inspirational_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      djs: {
        Row: {
          artist_name: string | null
          auth_user_id: string | null
          background_image_url: string | null
          base_price: number | null
          bio: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          genre: string | null
          id: string
          instagram_url: string | null
          location: string | null
          password: string
          pix_key: string | null
          portfolio_url: string | null
          real_name: string | null
          soundcloud_url: string | null
          tiktok_url: string | null
          updated_at: string | null
          whatsapp: number | null
          youtube_url: string | null
        }
        Insert: {
          artist_name?: string | null
          auth_user_id?: string | null
          background_image_url?: string | null
          base_price?: number | null
          bio?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          genre?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          password: string
          pix_key?: string | null
          portfolio_url?: string | null
          real_name?: string | null
          soundcloud_url?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          whatsapp?: number | null
          youtube_url?: string | null
        }
        Update: {
          artist_name?: string | null
          auth_user_id?: string | null
          background_image_url?: string | null
          base_price?: number | null
          bio?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          genre?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          password?: string
          pix_key?: string | null
          portfolio_url?: string | null
          real_name?: string | null
          soundcloud_url?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          whatsapp?: number | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          shared_with_admin: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          shared_with_admin?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          shared_with_admin?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_djs: {
        Row: {
          created_at: string | null
          dj_id: string
          event_id: string
          fee: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dj_id: string
          event_id: string
          fee?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dj_id?: string
          event_id?: string
          fee?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_djs_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_djs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_shares: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          shared_with_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          shared_with_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cache: number | null
          cache_value: number | null
          city: string | null
          commission_rate: number | null
          contract_attached: boolean | null
          contract_type: string | null
          created_at: string | null
          created_by_role: string | null
          description: string | null
          event_date: string
          event_name: string
          event_time: string | null
          id: string
          location: string | null
          payment_proof_url: string | null
          payment_status: string | null
          producer_contact: string | null
          producer_id: string | null
          producer_name: string | null
          shared_with_admin: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cache?: number | null
          cache_value?: number | null
          city?: string | null
          commission_rate?: number | null
          contract_attached?: boolean | null
          contract_type?: string | null
          created_at?: string | null
          created_by_role?: string | null
          description?: string | null
          event_date: string
          event_name: string
          event_time?: string | null
          id?: string
          location?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          producer_contact?: string | null
          producer_id?: string | null
          producer_name?: string | null
          shared_with_admin?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cache?: number | null
          cache_value?: number | null
          city?: string | null
          commission_rate?: number | null
          contract_attached?: boolean | null
          contract_type?: string | null
          created_at?: string | null
          created_by_role?: string | null
          description?: string | null
          event_date?: string
          event_name?: string
          event_time?: string | null
          id?: string
          location?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          producer_contact?: string | null
          producer_id?: string | null
          producer_name?: string | null
          shared_with_admin?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          category: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          id: string
          target_amount: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          target_amount: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          target_amount?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      folder_shares: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          shared_by_user_id: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          shared_by_user_id: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          shared_by_user_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_shares_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "link_music_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current: number | null
          deadline: string | null
          description: string | null
          id: string
          priority: string | null
          shared_with_admin: boolean | null
          target: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          shared_with_admin?: boolean | null
          target: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          shared_with_admin?: boolean | null
          target?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inspirational_quotes: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          quote: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quote: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quote?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      instagram_feed: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          idea_id: string | null
          image_url: string
          likes_count: number | null
          published_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          idea_id?: string | null
          image_url: string
          likes_count?: number | null
          published_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          idea_id?: string | null
          image_url?: string
          likes_count?: number | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_feed_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "instagram_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_ideas: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_admin_idea: boolean | null
          observations: string | null
          post_type: string | null
          sent_by_admin_to_user: string | null
          shared_with_admin: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin_idea?: boolean | null
          observations?: string | null
          post_type?: string | null
          sent_by_admin_to_user?: string | null
          shared_with_admin?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin_idea?: boolean | null
          observations?: string | null
          post_type?: string | null
          sent_by_admin_to_user?: string | null
          shared_with_admin?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          approved_at: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_admin_idea: boolean | null
          name: string | null
          observations: string | null
          owner_id: string
          post_date: string | null
          post_type: string | null
          publishing_date: string | null
          sent_by_admin_to_user: string | null
          shared_by: string | null
          shared_status: string | null
          shared_with_admin: boolean | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin_idea?: boolean | null
          name?: string | null
          observations?: string | null
          owner_id: string
          post_date?: string | null
          post_type?: string | null
          publishing_date?: string | null
          sent_by_admin_to_user?: string | null
          shared_by?: string | null
          shared_status?: string | null
          shared_with_admin?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin_idea?: boolean | null
          name?: string | null
          observations?: string | null
          owner_id?: string
          post_date?: string | null
          post_type?: string | null
          publishing_date?: string | null
          sent_by_admin_to_user?: string | null
          shared_by?: string | null
          shared_status?: string | null
          shared_with_admin?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_posts_sent_by_admin_to_user_fkey"
            columns: ["sent_by_admin_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_music: {
        Row: {
          created_at: string | null
          favorite: boolean | null
          folder_id: string | null
          id: string
          name: string | null
          provider: string | null
          title: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          favorite?: boolean | null
          folder_id?: string | null
          id?: string
          name?: string | null
          provider?: string | null
          title?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          favorite?: boolean | null
          folder_id?: string | null
          id?: string
          name?: string | null
          provider?: string | null
          title?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_music_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "link_music_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      link_music_folders: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          id: string
          name: string
          shared_with_admin: boolean | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          name: string
          shared_with_admin?: boolean | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          shared_with_admin?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      media_files: {
        Row: {
          created_at: string | null
          dj_id: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dj_id: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dj_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          activities: string[] | null
          created_at: string | null
          date: string
          id: string
          mood: number
          note: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities?: string[] | null
          created_at?: string | null
          date?: string
          id?: string
          mood: number
          note?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities?: string[] | null
          created_at?: string | null
          date?: string
          id?: string
          mood?: number
          note?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      music_projects: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          is_admin_idea: boolean | null
          name: string
          participants: string | null
          progress: number | null
          project_type: string | null
          sent_by_admin_to_user: string | null
          shared_with_admin: boolean | null
          status: string | null
          tracks: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_admin_idea?: boolean | null
          name: string
          participants?: string | null
          progress?: number | null
          project_type?: string | null
          sent_by_admin_to_user?: string | null
          shared_with_admin?: boolean | null
          status?: string | null
          tracks?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_admin_idea?: boolean | null
          name?: string
          participants?: string | null
          progress?: number | null
          project_type?: string | null
          sent_by_admin_to_user?: string | null
          shared_with_admin?: boolean | null
          status?: string | null
          tracks?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_projects_sent_by_admin_to_user_fkey"
            columns: ["sent_by_admin_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          event_shares_enabled: boolean
          id: string
          overdue_goals_enabled: boolean
          overdue_tasks_enabled: boolean
          project_shares_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_shares_enabled?: boolean
          id?: string
          overdue_goals_enabled?: boolean
          overdue_tasks_enabled?: boolean
          project_shares_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_shares_enabled?: boolean
          id?: string
          overdue_goals_enabled?: boolean
          overdue_tasks_enabled?: boolean
          project_shares_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          related_id: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          related_id?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          related_id?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_proof_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          amount: number
          created_at: string | null
          dj_id: string
          due_date: string | null
          event_id: string
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          dj_id: string
          due_date?: string | null
          event_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          dj_id?: string
          due_date?: string | null
          event_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_payments_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      producers: {
        Row: {
          address: string | null
          admin_notes: string | null
          avatar_url: string | null
          cep: string | null
          city: string
          cnpj: string | null
          commercial_phone: string | null
          company_name: string
          contact_person: string
          contact_phone: string | null
          created_at: string | null
          email: string | null
          fantasy_name: string
          id: string
          name: string | null
          owner_name: string | null
          profile_id: string
          rating: number | null
          state: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          avatar_url?: string | null
          cep?: string | null
          city: string
          cnpj?: string | null
          commercial_phone?: string | null
          company_name: string
          contact_person: string
          contact_phone?: string | null
          created_at?: string | null
          email?: string | null
          fantasy_name: string
          id?: string
          name?: string | null
          owner_name?: string | null
          profile_id: string
          rating?: number | null
          state: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          commercial_phone?: string | null
          company_name?: string
          contact_person?: string
          contact_phone?: string | null
          created_at?: string | null
          email?: string | null
          fantasy_name?: string
          id?: string
          name?: string | null
          owner_name?: string | null
          profile_id?: string
          rating?: number | null
          state?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          artist_name: string | null
          avatar_url: string | null
          base_price: number | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          genre: string | null
          id: string
          instagram_url: string | null
          instagram_url_unk: string | null
          is_admin: boolean | null
          location: string | null
          phone: string | null
          pix_key: string | null
          portfolio_url: string | null
          rating: number | null
          real_name: string | null
          rider_requirements: string | null
          role: string | null
          soundcloud_url: string | null
          status: string | null
          tiktok_url: string | null
          updated_at: string | null
          video1_url: string | null
          whatsapp: string | null
          youtube_url: string | null
        }
        Insert: {
          artist_name?: string | null
          avatar_url?: string | null
          base_price?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          genre?: string | null
          id: string
          instagram_url?: string | null
          instagram_url_unk?: string | null
          is_admin?: boolean | null
          location?: string | null
          phone?: string | null
          pix_key?: string | null
          portfolio_url?: string | null
          rating?: number | null
          real_name?: string | null
          rider_requirements?: string | null
          role?: string | null
          soundcloud_url?: string | null
          status?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          video1_url?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist_name?: string | null
          avatar_url?: string | null
          base_price?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          genre?: string | null
          id?: string
          instagram_url?: string | null
          instagram_url_unk?: string | null
          is_admin?: boolean | null
          location?: string | null
          phone?: string | null
          pix_key?: string | null
          portfolio_url?: string | null
          rating?: number | null
          real_name?: string | null
          rider_requirements?: string | null
          role?: string | null
          soundcloud_url?: string | null
          status?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          video1_url?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      project_shares: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          project_type: string
          shared_by: string
          shared_with: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          project_type: string
          shared_by: string
          shared_with: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          project_type?: string
          shared_by?: string
          shared_with?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assignee: string | null
          category: string
          content: Json | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          progress: number | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignee?: string | null
          category: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignee?: string | null
          category?: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prospeccoes: {
        Row: {
          budget: number | null
          client_contact: string | null
          client_name: string | null
          created_at: string | null
          data: string | null
          description: string | null
          dj_id: string | null
          dj_name: string | null
          id: string
          location: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_contact?: string | null
          client_name?: string | null
          created_at?: string | null
          data?: string | null
          description?: string | null
          dj_id?: string | null
          dj_name?: string | null
          id?: string
          location?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_contact?: string | null
          client_name?: string | null
          created_at?: string | null
          data?: string | null
          description?: string | null
          dj_id?: string | null
          dj_name?: string | null
          id?: string
          location?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_bills: {
        Row: {
          amount: number
          category: string
          created_at: string
          due_day: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          due_day: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          due_day?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      self_care_activities: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      self_care_habits: {
        Row: {
          category: string
          completed: boolean | null
          created_at: string | null
          date: string
          icon: string | null
          id: string
          name: string
          streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          icon?: string | null
          id?: string
          name: string
          streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          icon?: string | null
          id?: string
          name?: string
          streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      self_care_metrics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          nutrition_score: number | null
          sleep_hours: number | null
          updated_at: string | null
          user_id: string
          water_intake: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          nutrition_score?: number | null
          sleep_hours?: number | null
          updated_at?: string | null
          user_id: string
          water_intake?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          nutrition_score?: number | null
          sleep_hours?: number | null
          updated_at?: string | null
          user_id?: string
          water_intake?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string | null
          deadline: string | null
          id: string
          priority: string | null
          shared_with_admin: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          priority?: string | null
          shared_with_admin?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          priority?: string | null
          shared_with_admin?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          gig_id: string | null
          id: string
          is_recurring: boolean | null
          month: number | null
          type: string
          user_id: string
          year: number | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          gig_id?: string | null
          id?: string
          is_recurring?: boolean | null
          month?: number | null
          type: string
          user_id: string
          year?: number | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          gig_id?: string | null
          id?: string
          is_recurring?: boolean | null
          month?: number | null
          type?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          password_hash: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_quote: {
        Args: never
        Returns: {
          author: string
          category: string
          id: string
          quote: string
        }[]
      }
      get_random_quote: {
        Args: never
        Returns: {
          author: string
          category: string
          id: string
          quote: string
        }[]
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id?: string }; Returns: boolean }
      is_admin_v2: { Args: { user_id: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      payment_status: "pending" | "processing" | "paid" | "overdue"
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
      payment_status: ["pending", "processing", "paid", "overdue"],
    },
  },
} as const
