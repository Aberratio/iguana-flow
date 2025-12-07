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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          icon: string
          id: string
          name: string
          points: number
          rule_type: string
          rule_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          rule_type: string
          rule_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          rule_type?: string
          rule_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_achievements: {
        Row: {
          achievement_id: string
          challenge_id: string
          created_at: string
          id: string
        }
        Insert: {
          achievement_id: string
          challenge_id: string
          created_at?: string
          id?: string
        }
        Update: {
          achievement_id?: string
          challenge_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_achievements_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_day_progress: {
        Row: {
          attempt_number: number
          challenge_id: string
          changed_status_at: string | null
          created_at: string
          exercises_completed: number | null
          id: string
          notes: string | null
          status: string
          total_exercises: number | null
          training_day_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_number?: number
          challenge_id: string
          changed_status_at?: string | null
          created_at?: string
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          status?: string
          total_exercises?: number | null
          training_day_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          challenge_id?: string
          changed_status_at?: string | null
          created_at?: string
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          status?: string
          total_exercises?: number | null
          training_day_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_challenge_day_progress_training_day"
            columns: ["training_day_id"]
            isOneToOne: false
            referencedRelation: "challenge_training_days"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean | null
          current_day_number: number | null
          id: string
          joined_at: string | null
          last_completed_day: number | null
          status: string | null
          updated_at: string
          user_id: string
          user_started_at: string | null
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          current_day_number?: number | null
          id?: string
          joined_at?: string | null
          last_completed_day?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          user_started_at?: string | null
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          current_day_number?: number | null
          id?: string
          joined_at?: string | null
          last_completed_day?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          user_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_redemption_codes: {
        Row: {
          challenge_id: string | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
        }
        Insert: {
          challenge_id?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Update: {
          challenge_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_redemption_codes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_training_days: {
        Row: {
          challenge_id: string
          created_at: string
          day_number: number
          description: string | null
          duration_seconds: number | null
          id: string
          is_rest_day: boolean | null
          title: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          day_number?: number
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_rest_day?: boolean | null
          title?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          day_number?: number
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_rest_day?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_training_days_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_new: boolean | null
          level: number | null
          premium: boolean
          price_pln: number | null
          price_usd: number | null
          series_name: string | null
          series_order: number | null
          start_date: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_new?: boolean | null
          level?: number | null
          premium?: boolean
          price_pln?: number | null
          price_usd?: number | null
          series_name?: string | null
          series_order?: number | null
          start_date?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_new?: boolean | null
          level?: number | null
          premium?: boolean
          price_pln?: number | null
          price_usd?: number | null
          series_name?: string | null
          series_order?: number | null
          start_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_difficulty_levels: {
        Row: {
          color_class: string | null
          created_at: string
          id: string
          key: string
          name_pl: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color_class?: string | null
          created_at?: string
          id?: string
          key: string
          name_pl: string
          order_index: number
          updated_at?: string
        }
        Update: {
          color_class?: string | null
          created_at?: string
          id?: string
          key?: string
          name_pl?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      figure_experts: {
        Row: {
          added_by: string
          created_at: string
          expert_user_id: string
          figure_id: string
          id: string
          updated_at: string
        }
        Insert: {
          added_by: string
          created_at?: string
          expert_user_id: string
          figure_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          expert_user_id?: string
          figure_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "figure_experts_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_experts_expert_user_id_fkey"
            columns: ["expert_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_experts_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_experts_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_progress: {
        Row: {
          created_at: string
          figure_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          figure_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          figure_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "figure_progress_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_progress_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_types: {
        Row: {
          created_at: string
          id: string
          key: string
          name_pl: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name_pl: string
          order_index: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name_pl?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      figures: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          hold_time_seconds: number | null
          id: string
          image_url: string | null
          instructions: string | null
          name: string
          play_video: boolean | null
          premium: boolean
          sport_category_id: string | null
          synonyms: string[] | null
          tags: string[] | null
          transition_from_figure_id: string | null
          transition_to_figure_id: string | null
          type: string | null
          updated_at: string | null
          video_position: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          hold_time_seconds?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          name: string
          play_video?: boolean | null
          premium?: boolean
          sport_category_id?: string | null
          synonyms?: string[] | null
          tags?: string[] | null
          transition_from_figure_id?: string | null
          transition_to_figure_id?: string | null
          type?: string | null
          updated_at?: string | null
          video_position?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          hold_time_seconds?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          name?: string
          play_video?: boolean | null
          premium?: boolean
          sport_category_id?: string | null
          synonyms?: string[] | null
          tags?: string[] | null
          transition_from_figure_id?: string | null
          transition_to_figure_id?: string | null
          type?: string | null
          updated_at?: string | null
          video_position?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "figures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figures_sport_category_id_fkey"
            columns: ["sport_category_id"]
            isOneToOne: false
            referencedRelation: "sport_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figures_transition_from_figure_id_fkey"
            columns: ["transition_from_figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figures_transition_from_figure_id_fkey"
            columns: ["transition_from_figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figures_transition_to_figure_id_fkey"
            columns: ["transition_to_figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figures_transition_to_figure_id_fkey"
            columns: ["transition_to_figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          rejected_at: string | null
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          rejected_at?: string | null
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          rejected_at?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_media: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          media_type: string
          media_url: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          media_type: string
          media_url: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          metadata: Json | null
          section_key: string
          section_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          metadata?: Json | null
          section_key: string
          section_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          metadata?: Json | null
          section_key?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      level_figures: {
        Row: {
          boss_description: string | null
          created_at: string
          created_by: string | null
          figure_id: string
          hold_time_seconds: number | null
          id: string
          is_boss: boolean | null
          level_id: string
          notes: string | null
          order_index: number
          reps: number | null
          sublevel: number
          sublevel_description: string | null
        }
        Insert: {
          boss_description?: string | null
          created_at?: string
          created_by?: string | null
          figure_id: string
          hold_time_seconds?: number | null
          id?: string
          is_boss?: boolean | null
          level_id: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          sublevel?: number
          sublevel_description?: string | null
        }
        Update: {
          boss_description?: string | null
          created_at?: string
          created_by?: string | null
          figure_id?: string
          hold_time_seconds?: number | null
          id?: string
          is_boss?: boolean | null
          level_id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          sublevel?: number
          sublevel_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "level_figures_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_figures_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_figures_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "sport_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      level_trainings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_required: boolean
          level_id: string
          notes: string | null
          order_index: number
          training_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          level_id: string
          notes?: string | null
          order_index?: number
          training_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          level_id?: string
          notes?: string | null
          order_index?: number
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_trainings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_trainings_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "sport_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_trainings_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          item_id: string | null
          order_type: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          item_id?: string | null
          order_type: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          item_id?: string | null
          order_type?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          figure_id: string | null
          id: string
          image_url: string | null
          privacy: string
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          figure_id?: string | null
          id?: string
          image_url?: string | null
          privacy?: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          figure_id?: string | null
          id?: string
          image_url?: string | null
          privacy?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prerequisite_figures: {
        Row: {
          created_at: string
          created_by: string | null
          figure_id: string
          id: string
          prerequisite_figure_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          figure_id: string
          id?: string
          prerequisite_figure_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          figure_id?: string
          id?: string
          prerequisite_figure_id?: string
        }
        Relationships: []
      }
      pricing_plan_features: {
        Row: {
          created_at: string
          display_order: number | null
          feature_key: string
          id: string
          is_included: boolean | null
          plan_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          feature_key: string
          id?: string
          is_included?: boolean | null
          plan_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          feature_key?: string
          id?: string
          is_included?: boolean | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_popular: boolean | null
          name: string
          plan_key: string
          price: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_popular?: boolean | null
          name: string
          plan_key: string
          price: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_popular?: boolean | null
          name?: string
          plan_key?: string
          price?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          last_login_at: string | null
          login_count: number | null
          role: Database["public"]["Enums"]["user_role"]
          sports: string[] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          last_login_at?: string | null
          login_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          sports?: string[] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          login_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          sports?: string[] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          achievement_date: string | null
          figure_id: string
          id: string
          notes: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          achievement_date?: string | null
          figure_id: string
          id?: string
          notes?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          achievement_date?: string | null
          figure_id?: string
          id?: string
          notes?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_tracking_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_tracking_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restore_ctd_stage: {
        Row: {
          challenge_id: string
          created_at: string
          day_number: number
          description: string | null
          duration_seconds: number | null
          id: string
          is_rest_day: boolean | null
          title: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          day_number?: number
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_rest_day?: boolean | null
          title?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          day_number?: number
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_rest_day?: boolean | null
          title?: string | null
        }
        Relationships: []
      }
      restore_tde_stage: {
        Row: {
          audio_url: string | null
          completion_mode: string | null
          created_at: string
          figure_id: string
          hold_time_seconds: number | null
          id: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_time_seconds: number | null
          sets: number | null
          training_day_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          completion_mode?: string | null
          created_at?: string
          figure_id: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_time_seconds?: number | null
          sets?: number | null
          training_day_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          completion_mode?: string | null
          created_at?: string
          figure_id?: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_time_seconds?: number | null
          sets?: number | null
          training_day_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      similar_figures: {
        Row: {
          created_at: string
          created_by: string | null
          figure_id: string
          id: string
          similar_figure_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          figure_id: string
          id?: string
          similar_figure_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          figure_id?: string
          id?: string
          similar_figure_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sport_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          image_file_url: string | null
          image_url: string | null
          is_published: boolean
          key_name: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_file_url?: string | null
          image_url?: string | null
          is_published?: boolean
          key_name: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_file_url?: string | null
          image_url?: string | null
          is_published?: boolean
          key_name?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sport_demo_users: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          sport_category: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          sport_category: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          sport_category?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_demo_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sport_demo_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_level_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          created_by: string | null
          id: string
          sport_level_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          sport_level_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sport_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_level_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sport_level_achievements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sport_level_achievements_sport_level_id_fkey"
            columns: ["sport_level_id"]
            isOneToOne: false
            referencedRelation: "sport_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_levels: {
        Row: {
          challenge_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          level_name: string
          level_number: number
          point_limit: number
          sport_category: string
          status: string
          updated_at: string
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level_name: string
          level_number: number
          point_limit?: number
          sport_category: string
          status?: string
          updated_at?: string
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level_name?: string
          level_number?: number
          point_limit?: number
          sport_category?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_levels_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      training_day_exercises: {
        Row: {
          completion_mode: string | null
          created_at: string
          figure_id: string
          hold_time_seconds: number | null
          id: string
          notes: string | null
          order_index: number
          play_video: boolean | null
          reps: number | null
          rest_time_seconds: number | null
          sets: number | null
          training_day_id: string
          video_position:
            | Database["public"]["Enums"]["video_position_type"]
            | null
        }
        Insert: {
          completion_mode?: string | null
          created_at?: string
          figure_id: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          play_video?: boolean | null
          reps?: number | null
          rest_time_seconds?: number | null
          sets?: number | null
          training_day_id: string
          video_position?:
            | Database["public"]["Enums"]["video_position_type"]
            | null
        }
        Update: {
          completion_mode?: string | null
          created_at?: string
          figure_id?: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          play_video?: boolean | null
          reps?: number | null
          rest_time_seconds?: number | null
          sets?: number | null
          training_day_id?: string
          video_position?:
            | Database["public"]["Enums"]["video_position_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "training_day_exercises_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_day_exercises_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_day_exercises_training_day_id_fkey"
            columns: ["training_day_id"]
            isOneToOne: false
            referencedRelation: "challenge_training_days"
            referencedColumns: ["id"]
          },
        ]
      }
      training_lessons: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          lesson_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          lesson_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          lesson_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_library: {
        Row: {
          category: string
          completions_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean | null
          premium: boolean | null
          sport_type: string[] | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          training_type: string
          updated_at: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          category: string
          completions_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean | null
          premium?: boolean | null
          sport_type?: string[] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          training_type: string
          updated_at?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          completions_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean | null
          premium?: boolean | null
          sport_type?: string[] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          training_type?: string
          updated_at?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_library_compositions: {
        Row: {
          child_training_id: string
          created_at: string | null
          id: string
          order_index: number
          parent_training_id: string
        }
        Insert: {
          child_training_id: string
          created_at?: string | null
          id?: string
          order_index: number
          parent_training_id: string
        }
        Update: {
          child_training_id?: string
          created_at?: string | null
          id?: string
          order_index?: number
          parent_training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_library_compositions_child_training_id_fkey"
            columns: ["child_training_id"]
            isOneToOne: false
            referencedRelation: "training_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_library_compositions_parent_training_id_fkey"
            columns: ["parent_training_id"]
            isOneToOne: false
            referencedRelation: "training_library"
            referencedColumns: ["id"]
          },
        ]
      }
      training_library_exercises: {
        Row: {
          audio_cue_url: string | null
          completion_mode: string
          created_at: string | null
          figure_id: string
          hold_time_seconds: number | null
          id: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_time_seconds: number | null
          sets: number | null
          target_completions: number | null
          training_id: string
        }
        Insert: {
          audio_cue_url?: string | null
          completion_mode: string
          created_at?: string | null
          figure_id: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index: number
          reps?: number | null
          rest_time_seconds?: number | null
          sets?: number | null
          target_completions?: number | null
          training_id: string
        }
        Update: {
          audio_cue_url?: string | null
          completion_mode?: string
          created_at?: string | null
          figure_id?: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_time_seconds?: number | null
          sets?: number | null
          target_completions?: number | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_library_exercises_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_library_exercises_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_library_exercises_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_library"
            referencedColumns: ["id"]
          },
        ]
      }
      training_redemption_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          training_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          training_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          training_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_redemption_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_redemption_codes_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_session_figures: {
        Row: {
          figure_id: string
          hold_time_seconds: number | null
          id: string
          notes: string | null
          order_index: number
          reps: number | null
          session_id: string
          sets: number | null
        }
        Insert: {
          figure_id: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index: number
          reps?: number | null
          session_id: string
          sets?: number | null
        }
        Update: {
          figure_id?: string
          hold_time_seconds?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          session_id?: string
          sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_figures_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_figures_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "figures_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_figures_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date_scheduled: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          figures: Json | null
          id: string
          playlist: string | null
          premium: boolean
          published: boolean | null
          stretching_exercises: Json | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
          warmup_exercises: Json | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date_scheduled?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          figures?: Json | null
          id?: string
          playlist?: string | null
          premium?: boolean
          published?: boolean | null
          stretching_exercises?: Json | null
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
          warmup_exercises?: Json | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date_scheduled?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          figures?: Json | null
          id?: string
          playlist?: string | null
          premium?: boolean
          published?: boolean | null
          stretching_exercises?: Json | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          warmup_exercises?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_user_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string | null
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_user_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: string
          lesson_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_order: number
          video_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          lesson_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_order?: number
          video_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          lesson_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_order?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          is_read: boolean | null
          points_awarded: number | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          points_awarded?: number | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          points_awarded?: number | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          day_number: number
          exercises_completed: number | null
          id: string
          notes: string | null
          status: string
          total_exercises: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          day_number: number
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          status?: string
          total_exercises?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          day_number?: number
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          status?: string
          total_exercises?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_purchases: {
        Row: {
          challenge_id: string
          created_at: string | null
          currency: string | null
          id: string
          payment_amount: number | null
          purchase_type: string
          purchased_at: string | null
          redemption_code: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_amount?: number | null
          purchase_type: string
          purchased_at?: string | null
          redemption_code?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_amount?: number | null
          purchase_type?: string
          purchased_at?: string | null
          redemption_code?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_purchases_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journeys: {
        Row: {
          badges_earned: string[]
          created_at: string
          current_streak: number
          experience_level: string
          goals: string[]
          id: string
          sport_type: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges_earned?: string[]
          created_at?: string
          current_streak?: number
          experience_level: string
          goals?: string[]
          id?: string
          sport_type: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges_earned?: string[]
          created_at?: string
          current_streak?: number
          experience_level?: string
          goals?: string[]
          id?: string
          sport_type?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_scores: {
        Row: {
          created_at: string
          id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sport_level_training_completions: {
        Row: {
          completed_at: string
          duration_seconds: number | null
          id: string
          notes: string | null
          sport_level_id: string
          training_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          sport_level_id: string
          training_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          sport_level_id?: string
          training_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sport_level_training_completions_sport_level_id_fkey"
            columns: ["sport_level_id"]
            isOneToOne: false
            referencedRelation: "sport_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sport_level_training_completions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sport_level_training_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          training_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          training_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          training_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_bookmarks_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_progress: {
        Row: {
          completed_at: string | null
          completed_exercises: Json | null
          created_at: string | null
          current_exercise_index: number | null
          id: string
          last_activity_at: string | null
          notes: string | null
          started_at: string | null
          status: string | null
          training_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_exercises?: Json | null
          created_at?: string | null
          current_exercise_index?: number | null
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          started_at?: string | null
          status?: string | null
          training_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_exercises?: Json | null
          created_at?: string | null
          current_exercise_index?: number | null
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          started_at?: string | null
          status?: string | null
          training_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_purchases: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          payment_amount: number | null
          purchase_type: string
          purchased_at: string | null
          redemption_code: string | null
          stripe_session_id: string | null
          training_session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_amount?: number | null
          purchase_type: string
          purchased_at?: string | null
          redemption_code?: string | null
          stripe_session_id?: string | null
          training_session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_amount?: number | null
          purchase_type?: string
          purchased_at?: string | null
          redemption_code?: string | null
          stripe_session_id?: string | null
          training_session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_purchases_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      figures_with_translations: {
        Row: {
          category: string | null
          category_key: string | null
          category_name_pl: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_color_class: string | null
          difficulty_level: string | null
          difficulty_name_pl: string | null
          difficulty_order: number | null
          hold_time_seconds: number | null
          id: string | null
          image_url: string | null
          instructions: string | null
          name: string | null
          premium: boolean | null
          sport_category_id: string | null
          synonyms: string[] | null
          tags: string[] | null
          type: string | null
          type_name_pl: string | null
          updated_at: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "figures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figures_sport_category_id_fkey"
            columns: ["sport_category_id"]
            isOneToOne: false
            referencedRelation: "sport_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_points_to_user: {
        Args: { points: number; user_id: string }
        Returns: undefined
      }
      admin_complete_challenge_day: {
        Args: {
          p_challenge_id: string
          p_day_number: number
          p_notes?: string
          p_user_id: string
        }
        Returns: undefined
      }
      are_users_friends: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      award_challenge_completion_points: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: undefined
      }
      award_sport_level_achievements: {
        Args: { p_sport_level_id: string; p_user_id: string }
        Returns: undefined
      }
      can_view_user_content: {
        Args: { content_owner_id: string; viewer_id: string }
        Returns: boolean
      }
      complete_challenge_day: {
        Args: {
          p_challenge_id: string
          p_day_number: number
          p_notes?: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_activity_with_points: {
        Args: {
          activity_data?: Json
          activity_type: string
          points?: number
          target_user_id?: string
          user_id: string
        }
        Returns: undefined
      }
      fix_completed_challenges: {
        Args: never
        Returns: {
          challenge_id: string
          completed_days: number
          total_days: number
          user_id: string
        }[]
      }
      friendship_user_pair: {
        Args: { user1_id: string; user2_id: string }
        Returns: string[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_next_available_challenge_day: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: {
          day_number: number
          description: string
          title: string
          total_exercises: number
          training_day_id: string
        }[]
      }
      get_user_available_challenge_days: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: {
          completed_at: string
          day_number: number
          description: string
          is_accessible: boolean
          status: string
          title: string
          total_exercises: number
          training_day_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_challenge_simple: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: undefined
      }
      unmark_old_challenges: { Args: never; Returns: undefined }
      update_user_login_tracking: {
        Args: { user_id: string }
        Returns: undefined
      }
      user_has_challenge_access: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "free" | "premium" | "trainer" | "admin"
      video_position_type: "center" | "top" | "bottom" | "left" | "right"
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
      user_role: ["free", "premium", "trainer", "admin"],
      video_position_type: ["center", "top", "bottom", "left", "right"],
    },
  },
} as const
