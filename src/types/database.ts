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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_recovery_attempts: {
        Row: {
          created_at: string
          email_hash: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          email_hash: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          email_hash?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      account_recovery_pins: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          locked_until: string | null
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      account_signup_attempts: {
        Row: {
          created_at: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      activity_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          title: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          title?: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      council_criteria: {
        Row: {
          created_at: string
          created_by: string
          id: string
          proposal_id: string
          title: string
          weight: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          proposal_id: string
          title: string
          weight?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          proposal_id?: string
          title?: string
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_criteria_proposal_id_workspace_id_fkey"
            columns: ["proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_proposals"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      council_option_scores: {
        Row: {
          comment: string
          created_at: string
          criterion_id: string
          option_id: string
          proposal_id: string
          score: number
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          criterion_id: string
          option_id: string
          proposal_id: string
          score: number
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          criterion_id?: string
          option_id?: string
          proposal_id?: string
          score?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_option_scores_criterion_id_proposal_id_workspace_id_fkey"
            columns: ["criterion_id", "proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_criteria"
            referencedColumns: ["id", "proposal_id", "workspace_id"]
          },
          {
            foreignKeyName: "council_option_scores_option_id_proposal_id_workspace_id_fkey"
            columns: ["option_id", "proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_options"
            referencedColumns: ["id", "proposal_id", "workspace_id"]
          },
        ]
      }
      council_decisions: {
        Row: {
          chosen_option_id: string | null
          decided_at: string
          decided_by: string
          id: string
          proposal_id: string
          rationale: string
          workspace_id: string
        }
        Insert: {
          chosen_option_id?: string | null
          decided_at?: string
          decided_by: string
          id?: string
          proposal_id: string
          rationale: string
          workspace_id: string
        }
        Update: {
          chosen_option_id?: string | null
          decided_at?: string
          decided_by?: string
          id?: string
          proposal_id?: string
          rationale?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_decisions_chosen_option_id_proposal_id_workspace_i_fkey"
            columns: ["chosen_option_id", "proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_options"
            referencedColumns: ["id", "proposal_id", "workspace_id"]
          },
          {
            foreignKeyName: "council_decisions_proposal_id_workspace_id_fkey"
            columns: ["proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_proposals"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      council_options: {
        Row: {
          created_at: string
          description: string
          id: string
          proposal_id: string
          title: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          proposal_id: string
          title: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          proposal_id?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_options_proposal_id_workspace_id_fkey"
            columns: ["proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_proposals"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      council_proposals: {
        Row: {
          closes_at: string | null
          context: string
          created_at: string
          created_by: string
          id: string
          status: string
          title: string
          updated_at: string
          voting_mode: string
          workspace_id: string
        }
        Insert: {
          closes_at?: string | null
          context?: string
          created_at?: string
          created_by: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          voting_mode?: string
          workspace_id: string
        }
        Update: {
          closes_at?: string | null
          context?: string
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          voting_mode?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      council_votes: {
        Row: {
          created_at: string
          option_id: string
          proposal_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          proposal_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          proposal_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_votes_option_id_proposal_id_workspace_id_fkey"
            columns: ["option_id", "proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_options"
            referencedColumns: ["id", "proposal_id", "workspace_id"]
          },
          {
            foreignKeyName: "council_votes_proposal_id_workspace_id_fkey"
            columns: ["proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_proposals"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      goals: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string
          id?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          archived_at: string | null
          content: string
          council_proposal_id: string | null
          created_at: string
          created_by: string
          goal_id: string | null
          id: string
          search_vector: string
          tags: string[]
          title: string
          updated_at: string
          workspace_id: string
          quest_id: string | null
        }
        Insert: {
          archived_at?: string | null
          content?: string
          council_proposal_id?: string | null
          created_at?: string
          created_by: string
          goal_id?: string | null
          id?: string
          search_vector?: unknown
          tags?: string[]
          title: string
          updated_at?: string
          workspace_id: string
          quest_id?: string | null
        }
        Update: {
          archived_at?: string | null
          content?: string
          council_proposal_id?: string | null
          created_at?: string
          created_by?: string
          goal_id?: string | null
          id?: string
          search_vector?: unknown
          tags?: string[]
          title?: string
          updated_at?: string
          workspace_id?: string
          quest_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_goal_same_workspace_fk"
            columns: ["goal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "notes_quest_same_workspace_fk"
            columns: ["quest_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "notes_council_same_workspace_fk"
            columns: ["council_proposal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "council_proposals"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quest_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string
          quest_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          quest_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          quest_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_assignees_quest_id_workspace_id_fkey"
            columns: ["quest_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "quest_assignees_workspace_id_user_id_fkey"
            columns: ["workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      quest_check_ins: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          progress: number | null
          quest_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          progress?: number | null
          quest_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          progress?: number | null
          quest_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_check_ins_quest_id_workspace_id_fkey"
            columns: ["quest_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      quest_dependencies: {
        Row: {
          created_at: string
          created_by: string
          depends_on_quest_id: string
          quest_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          depends_on_quest_id: string
          quest_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          depends_on_quest_id?: string
          quest_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_dependencies_depends_on_quest_id_workspace_id_fkey"
            columns: ["depends_on_quest_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "quest_dependencies_quest_id_workspace_id_fkey"
            columns: ["quest_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      quests: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          goal_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_goal_same_workspace_fk"
            columns: ["goal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "quests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: string
          token_hash: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role: string
          token_hash: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: string
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          joined_at: string
          role: string
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          joined_at?: string
          role: string
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cast_council_vote: {
        Args: { p_option_id: string; p_proposal_id: string; p_workspace_id: string }
        Returns: undefined
      }
      list_council_vote_summary: {
        Args: { p_workspace_id: string }
        Returns: {
          has_my_vote: boolean
          option_id: string
          proposal_id: string
          vote_count: number
        }[]
      }
      accept_workspace_invitation: {
        Args: { p_token_hash: string }
        Returns: string
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          email_confirmed_at: string
          is_suspended: boolean
          last_sign_in_at: string
          platform_role: string
          suspension_reason: string
          user_id: string
        }[]
      }
      admin_list_workspace_members: {
        Args: { p_workspace_id: string }
        Returns: {
          display_name: string
          email: string
          is_suspended: boolean
          joined_at: string
          membership_status: string
          user_id: string
          workspace_role: string
        }[]
      }
      admin_list_workspaces: {
        Args: never
        Returns: {
          active_member_count: number
          created_at: string
          created_by: string
          creator_email: string
          description: string
          is_archived: boolean
          name: string
          slug: string
          workspace_id: string
        }[]
      }
      admin_set_user_suspension: {
        Args: { p_is_suspended: boolean; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      admin_set_workspace_archived: {
        Args: { p_is_archived: boolean; p_workspace_id: string }
        Returns: undefined
      }
      allow_account_signup: { Args: { p_ip: string }; Returns: boolean }
      create_workspace_invitation: {
        Args: {
          p_email: string
          p_role: string
          p_token_hash: string
          p_workspace_id: string
        }
        Returns: string
      }
      current_user_access: {
        Args: never
        Returns: {
          is_active: boolean
          is_admin: boolean
        }[]
      }
      has_own_account_recovery_pin: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_platform_user_active: { Args: never; Returns: boolean }
      leave_workspace: { Args: { p_workspace_id: string }; Returns: undefined }
      list_workspace_activity: {
        Args: { p_workspace_id: string }
        Returns: {
          action: string
          actor_display_name: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          title: string
        }[]
      }
      list_workspace_invitations: {
        Args: { p_workspace_id: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          role: string
        }[]
      }
      list_workspace_members: {
        Args: { p_workspace_id: string }
        Returns: {
          display_name: string
          email: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }[]
      }
      remove_workspace_member: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: undefined
      }
      revoke_workspace_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      set_own_account_recovery_pin: {
        Args: { p_pin: string }
        Returns: boolean
      }
      update_workspace_member_role: {
        Args: { p_role: string; p_user_id: string; p_workspace_id: string }
        Returns: undefined
      }
      verify_account_recovery_pin: {
        Args: { p_email: string; p_ip: string; p_pin: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
