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
      acoes_informacao: {
        Row: {
          confianca: number | null
          criado_em: string
          criado_por: string | null
          custo: number
          equipa_id: string
          id: string
          lugar: string
          nivel: string | null
          resultado: Json | null
          ronda_id: string
          tipo: string
        }
        Insert: {
          confianca?: number | null
          criado_em?: string
          criado_por?: string | null
          custo?: number
          equipa_id: string
          id?: string
          lugar: string
          nivel?: string | null
          resultado?: Json | null
          ronda_id: string
          tipo: string
        }
        Update: {
          confianca?: number | null
          criado_em?: string
          criado_por?: string | null
          custo?: number
          equipa_id?: string
          id?: string
          lugar?: string
          nivel?: string | null
          resultado?: Json | null
          ronda_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_informacao_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_informacao_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          antiguidade: number
          aptidao_gestao: number
          arquetipo: string | null
          ativo: boolean
          atualizado_em: string
          avatar_variante: number
          competencia: number
          criado_em: string
          equipa_id: string
          id: string
          motivacao: number
          necessidades: Json
          nome: string
          papel_org: string
          produtividade_base: number
          resiliencia: number
          salario_mult: number
          stress_individual: number
        }
        Insert: {
          antiguidade?: number
          aptidao_gestao?: number
          arquetipo?: string | null
          ativo?: boolean
          atualizado_em?: string
          avatar_variante?: number
          competencia?: number
          criado_em?: string
          equipa_id: string
          id?: string
          motivacao?: number
          necessidades?: Json
          nome?: string
          papel_org?: string
          produtividade_base?: number
          resiliencia?: number
          salario_mult?: number
          stress_individual?: number
        }
        Update: {
          antiguidade?: number
          aptidao_gestao?: number
          arquetipo?: string | null
          ativo?: boolean
          atualizado_em?: string
          avatar_variante?: number
          competencia?: number
          criado_em?: string
          equipa_id?: string
          id?: string
          motivacao?: number
          necessidades?: Json
          nome?: string
          papel_org?: string
          produtividade_base?: number
          resiliencia?: number
          salario_mult?: number
          stress_individual?: number
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
        ]
      }
      competicoes: {
        Row: {
          ambito: string
          atualizado_em: string
          codigo: string | null
          criado_em: string
          criado_por: string | null
          desbloqueio_total: boolean
          duracao_turnos: number
          estado: string
          id: string
          industria: string
          instituicao_id: string | null
          nome: string
          params: Json
          politica_ausente: string
          seed: number
          tema: Json
          transparencia: string
        }
        Insert: {
          ambito?: string
          atualizado_em?: string
          codigo?: string | null
          criado_em?: string
          criado_por?: string | null
          desbloqueio_total?: boolean
          duracao_turnos?: number
          estado?: string
          id?: string
          industria?: string
          instituicao_id?: string | null
          nome: string
          params?: Json
          politica_ausente?: string
          seed: number
          tema?: Json
          transparencia?: string
        }
        Update: {
          ambito?: string
          atualizado_em?: string
          codigo?: string | null
          criado_em?: string
          criado_por?: string | null
          desbloqueio_total?: boolean
          duracao_turnos?: number
          estado?: string
          id?: string
          industria?: string
          instituicao_id?: string | null
          nome?: string
          params?: Json
          politica_ausente?: string
          seed?: number
          tema?: Json
          transparencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "competicoes_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_papel: {
        Row: {
          criado_em: string
          criado_por: string | null
          email: string
          instituicao_id: string | null
          papel: Database["public"]["Enums"]["papel_utilizador"]
          usado_em: string | null
          usado_por: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          email: string
          instituicao_id?: string | null
          papel: Database["public"]["Enums"]["papel_utilizador"]
          usado_em?: string | null
          usado_por?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          email?: string
          instituicao_id?: string | null
          papel?: Database["public"]["Enums"]["papel_utilizador"]
          usado_em?: string | null
          usado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_papel_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      decisoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          equipa_id: string
          id: string
          lugar: string
          payload: Json
          ronda_id: string
          submetido_em: string | null
          submetido_por: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          equipa_id: string
          id?: string
          lugar: string
          payload?: Json
          ronda_id: string
          submetido_em?: string | null
          submetido_por?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          equipa_id?: string
          id?: string
          lugar?: string
          payload?: Json
          ronda_id?: string
          submetido_em?: string | null
          submetido_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisoes_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisoes_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      economia_seed: {
        Row: {
          atualizado_em: string
          competicao_id: string
          criado_em: string
          dados: Json
        }
        Insert: {
          atualizado_em?: string
          competicao_id: string
          criado_em?: string
          dados?: Json
        }
        Update: {
          atualizado_em?: string
          competicao_id?: string
          criado_em?: string
          dados?: Json
        }
        Relationships: [
          {
            foreignKeyName: "economia_seed_competicao_id_fkey"
            columns: ["competicao_id"]
            isOneToOne: true
            referencedRelation: "competicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipas: {
        Row: {
          capitao_user_id: string | null
          criado_em: string
          id: string
          is_ia: boolean
          mercado_id: string
          nome: string
        }
        Insert: {
          capitao_user_id?: string | null
          criado_em?: string
          id?: string
          is_ia?: boolean
          mercado_id: string
          nome: string
        }
        Update: {
          capitao_user_id?: string | null
          criado_em?: string
          id?: string
          is_ia?: boolean
          mercado_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipas_mercado_id_fkey"
            columns: ["mercado_id"]
            isOneToOne: false
            referencedRelation: "mercados"
            referencedColumns: ["id"]
          },
        ]
      }
      estado_empresa: {
        Row: {
          criado_em: string
          equipa_id: string
          id: string
          ronda_id: string
          snapshot: Json
        }
        Insert: {
          criado_em?: string
          equipa_id: string
          id?: string
          ronda_id: string
          snapshot?: Json
        }
        Update: {
          criado_em?: string
          equipa_id?: string
          id?: string
          ronda_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "estado_empresa_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_empresa_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          criado_em: string
          efeito: Json
          equipa_id: string
          id: string
          payload: Json
          ronda_id: string
          timing: string | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          efeito?: Json
          equipa_id: string
          id?: string
          payload?: Json
          ronda_id: string
          timing?: string | null
          tipo: string
        }
        Update: {
          criado_em?: string
          efeito?: Json
          equipa_id?: string
          id?: string
          payload?: Json
          ronda_id?: string
          timing?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      instituicoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
          tema: Json
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome: string
          tema?: Json
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          tema?: Json
        }
        Relationships: []
      }
      log_auditoria: {
        Row: {
          acao: string
          alvo: string | null
          ator_user_id: string | null
          id: string
          payload: Json
          ts: string
        }
        Insert: {
          acao: string
          alvo?: string | null
          ator_user_id?: string | null
          id?: string
          payload?: Json
          ts?: string
        }
        Update: {
          acao?: string
          alvo?: string | null
          ator_user_id?: string | null
          id?: string
          payload?: Json
          ts?: string
        }
        Relationships: []
      }
      membros_equipa: {
        Row: {
          criado_em: string
          email_convite: string | null
          equipa_id: string
          lugar: string
          user_id: string | null
        }
        Insert: {
          criado_em?: string
          email_convite?: string | null
          equipa_id: string
          lugar: string
          user_id?: string | null
        }
        Update: {
          criado_em?: string
          email_convite?: string | null
          equipa_id?: string
          lugar?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_equipa_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_equipa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      mercados: {
        Row: {
          competicao_id: string
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          competicao_id: string
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          competicao_id?: string
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "mercados_competicao_id_fkey"
            columns: ["competicao_id"]
            isOneToOne: false
            referencedRelation: "competicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          instituicao_id: string | null
          nome: string
          papel: Database["public"]["Enums"]["papel_utilizador"]
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          instituicao_id?: string | null
          nome?: string
          papel?: Database["public"]["Enums"]["papel_utilizador"]
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          instituicao_id?: string | null
          nome?: string
          papel?: Database["public"]["Enums"]["papel_utilizador"]
        }
        Relationships: []
      }
      resultados: {
        Row: {
          criado_em: string
          equipa_id: string
          posicao: number | null
          ronda_id: string
          valor: number
        }
        Insert: {
          criado_em?: string
          equipa_id: string
          posicao?: number | null
          ronda_id: string
          valor: number
        }
        Update: {
          criado_em?: string
          equipa_id?: string
          posicao?: number | null
          ronda_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "resultados_equipa_id_fkey"
            columns: ["equipa_id"]
            isOneToOne: false
            referencedRelation: "equipas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      rondas: {
        Row: {
          abre_em: string | null
          competicao_id: string
          criado_em: string
          estado: string
          id: string
          indice: number
          prazo_em: string | null
        }
        Insert: {
          abre_em?: string | null
          competicao_id: string
          criado_em?: string
          estado?: string
          id?: string
          indice: number
          prazo_em?: string | null
        }
        Update: {
          abre_em?: string | null
          competicao_id?: string
          criado_em?: string
          estado?: string
          id?: string
          indice?: number
          prazo_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rondas_competicao_id_fkey"
            columns: ["competicao_id"]
            isOneToOne: false
            referencedRelation: "competicoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      competicao_da_equipa: { Args: { _equipa: string }; Returns: string }
      e_membro_equipa: { Args: { _equipa: string }; Returns: boolean }
      instituicao_da_equipa: { Args: { _equipa: string }; Returns: string }
      meu_lugar_na_equipa: { Args: { _equipa: string }; Returns: string }
      minha_instituicao: { Args: never; Returns: string }
      professor_da_competicao: {
        Args: { _competicao: string }
        Returns: boolean
      }
      reclamar_convites_por_email: { Args: never; Returns: number }
      ronda_esta_aberta: { Args: { _ronda: string }; Returns: boolean }
      tem_papel: {
        Args: { _papel: Database["public"]["Enums"]["papel_utilizador"] }
        Returns: boolean
      }
    }
    Enums: {
      papel_utilizador:
        | "super_admin"
        | "admin_escolar"
        | "professor"
        | "jogador"
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
      papel_utilizador: [
        "super_admin",
        "admin_escolar",
        "professor",
        "jogador",
      ],
    },
  },
} as const
