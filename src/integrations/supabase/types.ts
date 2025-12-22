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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agenda_mentoria: {
        Row: {
          created_at: string
          data_fim_recorrencia: string | null
          data_hora: string
          descricao: string | null
          evento_pai_id: string | null
          id: string
          link_zoom: string | null
          recorrencia: string
          tipo: Database["public"]["Enums"]["tipo_mentoria"]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim_recorrencia?: string | null
          data_hora: string
          descricao?: string | null
          evento_pai_id?: string | null
          id?: string
          link_zoom?: string | null
          recorrencia?: string
          tipo: Database["public"]["Enums"]["tipo_mentoria"]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim_recorrencia?: string | null
          data_hora?: string
          descricao?: string | null
          evento_pai_id?: string | null
          id?: string
          link_zoom?: string | null
          recorrencia?: string
          tipo?: Database["public"]["Enums"]["tipo_mentoria"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_mentoria_evento_pai_id_fkey"
            columns: ["evento_pai_id"]
            isOneToOne: false
            referencedRelation: "agenda_mentoria"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos_navegador: {
        Row: {
          assunto: string | null
          avaliacao: number | null
          canal: Database["public"]["Enums"]["canal_atendimento"]
          comentario_avaliacao: string | null
          created_at: string
          data_hora: string
          id: string
          mentorado_id: string
          navegador_id: string
          nota: string | null
          status: Database["public"]["Enums"]["status_atendimento"] | null
          updated_at: string
        }
        Insert: {
          assunto?: string | null
          avaliacao?: number | null
          canal: Database["public"]["Enums"]["canal_atendimento"]
          comentario_avaliacao?: string | null
          created_at?: string
          data_hora?: string
          id?: string
          mentorado_id: string
          navegador_id: string
          nota?: string | null
          status?: Database["public"]["Enums"]["status_atendimento"] | null
          updated_at?: string
        }
        Update: {
          assunto?: string | null
          avaliacao?: number | null
          canal?: Database["public"]["Enums"]["canal_atendimento"]
          comentario_avaliacao?: string | null
          created_at?: string
          data_hora?: string
          id?: string
          mentorado_id?: string
          navegador_id?: string
          nota?: string | null
          status?: Database["public"]["Enums"]["status_atendimento"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_navegador_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_navegador_navegador_id_fkey"
            columns: ["navegador_id"]
            isOneToOne: false
            referencedRelation: "navegadores"
            referencedColumns: ["id"]
          },
        ]
      }
      atribuicoes_conteudo: {
        Row: {
          audience_type: Database["public"]["Enums"]["audience_type"]
          conteudo_id: string
          criado_em: string
          criado_por: string | null
          id: string
          mentorado_id: string | null
          nota_privada: string | null
          produto: string | null
          turma: string | null
        }
        Insert: {
          audience_type: Database["public"]["Enums"]["audience_type"]
          conteudo_id: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          mentorado_id?: string | null
          nota_privada?: string | null
          produto?: string | null
          turma?: string | null
        }
        Update: {
          audience_type?: Database["public"]["Enums"]["audience_type"]
          conteudo_id?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          mentorado_id?: string | null
          nota_privada?: string | null
          produto?: string | null
          turma?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atribuicoes_conteudo_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudo_direcionado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicoes_conteudo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicoes_conteudo_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_pilares: {
        Row: {
          created_at: string
          id: string
          mentorado_id: string
          nota: number
          pilar: Database["public"]["Enums"]["pilar_avaliacao"]
          trimestre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentorado_id: string
          nota: number
          pilar: Database["public"]["Enums"]["pilar_avaliacao"]
          trimestre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentorado_id?: string
          nota?: number
          pilar?: Database["public"]["Enums"]["pilar_avaliacao"]
          trimestre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_pilares_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_direcionado: {
        Row: {
          arquivo_id: string | null
          ativo: boolean | null
          created_at: string
          data_publicacao: string
          descricao: string | null
          expira_em: string | null
          id: string
          pilar: Database["public"]["Enums"]["pilar_enum"] | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["tipo_conteudo"]
          titulo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          arquivo_id?: string | null
          ativo?: boolean | null
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          expira_em?: string | null
          id?: string
          pilar?: Database["public"]["Enums"]["pilar_enum"] | null
          tags?: string[] | null
          tipo: Database["public"]["Enums"]["tipo_conteudo"]
          titulo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          arquivo_id?: string | null
          ativo?: boolean | null
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          expira_em?: string | null
          id?: string
          pilar?: Database["public"]["Enums"]["pilar_enum"] | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["tipo_conteudo"]
          titulo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      desempenho_mensal: {
        Row: {
          clientes_mes: number | null
          contratos_fechados: number | null
          created_at: string
          faturamento_mensal: number | null
          id: string
          mentorado_id: string
          mes_ano: string
          meta_mensal: number | null
          qtd_propostas: number | null
          updated_at: string
        }
        Insert: {
          clientes_mes?: number | null
          contratos_fechados?: number | null
          created_at?: string
          faturamento_mensal?: number | null
          id?: string
          mentorado_id: string
          mes_ano: string
          meta_mensal?: number | null
          qtd_propostas?: number | null
          updated_at?: string
        }
        Update: {
          clientes_mes?: number | null
          contratos_fechados?: number | null
          created_at?: string
          faturamento_mensal?: number | null
          id?: string
          mentorado_id?: string
          mes_ano?: string
          meta_mensal?: number | null
          qtd_propostas?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "desempenho_mensal_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_bordo: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string
          id: string
          lancamento: string | null
          mentorado_id: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string
          id?: string
          lancamento?: string | null
          mentorado_id: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          lancamento?: string | null
          mentorado_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_bordo_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_bordo_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      encontros: {
        Row: {
          created_at: string
          data_hora: string
          descricao: string | null
          id: string
          link_zoom: string | null
          materiais_urls: string[] | null
          tipo: Database["public"]["Enums"]["tipo_encontro"]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_hora: string
          descricao?: string | null
          id?: string
          link_zoom?: string | null
          materiais_urls?: string[] | null
          tipo: Database["public"]["Enums"]["tipo_encontro"]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          link_zoom?: string | null
          materiais_urls?: string[] | null
          tipo?: Database["public"]["Enums"]["tipo_encontro"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      gravacoes_encontros: {
        Row: {
          ai_resumo: string | null
          ativo: boolean | null
          created_at: string
          data_publicacao: string
          descricao: string | null
          duracao_seg: number | null
          encontro_id: string
          expira_em: string | null
          id: string
          tags: string[] | null
          thumbnail_url: string | null
          titulo: string
          transcript_url: string | null
          updated_at: string
          url_video: string
          visibilidade: string | null
        }
        Insert: {
          ai_resumo?: string | null
          ativo?: boolean | null
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          duracao_seg?: number | null
          encontro_id: string
          expira_em?: string | null
          id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          titulo: string
          transcript_url?: string | null
          updated_at?: string
          url_video: string
          visibilidade?: string | null
        }
        Update: {
          ai_resumo?: string | null
          ativo?: boolean | null
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          duracao_seg?: number | null
          encontro_id?: string
          expira_em?: string | null
          id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          titulo?: string
          transcript_url?: string | null
          updated_at?: string
          url_video?: string
          visibilidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacoes_encontros_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacoes_individuais: {
        Row: {
          ai_resumo: string | null
          ativo: boolean | null
          created_at: string
          data_gravacao: string
          data_publicacao: string
          descricao: string | null
          duracao_seg: number | null
          expira_em: string | null
          id: string
          mentorado_id: string
          navegador_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          titulo: string
          transcript_url: string | null
          updated_at: string
          url_video: string
        }
        Insert: {
          ai_resumo?: string | null
          ativo?: boolean | null
          created_at?: string
          data_gravacao?: string
          data_publicacao?: string
          descricao?: string | null
          duracao_seg?: number | null
          expira_em?: string | null
          id?: string
          mentorado_id: string
          navegador_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          titulo: string
          transcript_url?: string | null
          updated_at?: string
          url_video: string
        }
        Update: {
          ai_resumo?: string | null
          ativo?: boolean | null
          created_at?: string
          data_gravacao?: string
          data_publicacao?: string
          descricao?: string | null
          duracao_seg?: number | null
          expira_em?: string | null
          id?: string
          mentorado_id?: string
          navegador_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          titulo?: string
          transcript_url?: string | null
          updated_at?: string
          url_video?: string
        }
        Relationships: [
          {
            foreignKeyName: "gravacoes_individuais_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacoes_individuais_navegador_id_fkey"
            columns: ["navegador_id"]
            isOneToOne: false
            referencedRelation: "navegadores"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_trilha: {
        Row: {
          concluido: boolean | null
          concluido_em: string | null
          created_at: string | null
          descricao: string | null
          duracao_min: number | null
          id: string
          ordem: number | null
          tipo: string
          titulo: string
          trilha_id: string
          url: string | null
        }
        Insert: {
          concluido?: boolean | null
          concluido_em?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          ordem?: number | null
          tipo: string
          titulo: string
          trilha_id: string
          url?: string | null
        }
        Update: {
          concluido?: boolean | null
          concluido_em?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          ordem?: number | null
          tipo?: string
          titulo?: string
          trilha_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_trilha_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas_mentorado"
            referencedColumns: ["id"]
          },
        ]
      }
      livros_recomendados: {
        Row: {
          autor: string
          capa_url: string | null
          created_at: string
          descricao_curta: string | null
          id: string
          titulo: string
          url_compra: string | null
        }
        Insert: {
          autor: string
          capa_url?: string | null
          created_at?: string
          descricao_curta?: string | null
          id?: string
          titulo: string
          url_compra?: string | null
        }
        Update: {
          autor?: string
          capa_url?: string | null
          created_at?: string
          descricao_curta?: string | null
          id?: string
          titulo?: string
          url_compra?: string | null
        }
        Relationships: []
      }
      marketing_metrics: {
        Row: {
          created_at: string | null
          id: string
          investimento_marketing: number
          leads_qualificados: number
          leads_totais: number
          mentorado_id: string
          mes_ano: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          investimento_marketing?: number
          leads_qualificados?: number
          leads_totais?: number
          mentorado_id: string
          mes_ano: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          investimento_marketing?: number
          leads_qualificados?: number
          leads_totais?: number
          mentorado_id?: string
          mes_ano?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_metrics_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_complementares: {
        Row: {
          created_at: string
          data_publicacao: string
          descricao: string | null
          id: string
          pilar: Database["public"]["Enums"]["pilar_enum"]
          tipo: Database["public"]["Enums"]["tipo_material"]
          titulo: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          id?: string
          pilar: Database["public"]["Enums"]["pilar_enum"]
          tipo: Database["public"]["Enums"]["tipo_material"]
          titulo: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string
          descricao?: string | null
          id?: string
          pilar?: Database["public"]["Enums"]["pilar_enum"]
          tipo?: Database["public"]["Enums"]["tipo_material"]
          titulo?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      mentorados: {
        Row: {
          created_at: string
          data_ingresso: string
          email: string | null
          id: string
          instagram: string | null
          meta_clientes: number | null
          status: Database["public"]["Enums"]["status_mentorado"] | null
          turma: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          data_ingresso?: string
          email?: string | null
          id?: string
          instagram?: string | null
          meta_clientes?: number | null
          status?: Database["public"]["Enums"]["status_mentorado"] | null
          turma?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          data_ingresso?: string
          email?: string | null
          id?: string
          instagram?: string | null
          meta_clientes?: number | null
          status?: Database["public"]["Enums"]["status_mentorado"] | null
          turma?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          cor: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          mentorado_id: string
          progresso: number
          status: Database["public"]["Enums"]["status_meta"]
          titulo: string
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          mentorado_id: string
          progresso?: number
          status?: Database["public"]["Enums"]["status_meta"]
          titulo: string
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          mentorado_id?: string
          progresso?: number
          status?: Database["public"]["Enums"]["status_meta"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_mensais: {
        Row: {
          created_at: string
          id: string
          mentorado_id: string
          mes_ano: string
          qtd_colaboradores: number | null
          seguidores_instagram: number | null
          seguidores_linkedin: number | null
          seguidores_tiktok: number | null
          seguidores_youtube: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentorado_id: string
          mes_ano: string
          qtd_colaboradores?: number | null
          seguidores_instagram?: number | null
          seguidores_linkedin?: number | null
          seguidores_tiktok?: number | null
          seguidores_youtube?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentorado_id?: string
          mes_ano?: string
          qtd_colaboradores?: number | null
          seguidores_instagram?: number | null
          seguidores_linkedin?: number | null
          seguidores_tiktok?: number | null
          seguidores_youtube?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metricas_mensais_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      navegadores: {
        Row: {
          ativo: boolean | null
          bio_curta: string | null
          cargo: string | null
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          nome: string | null
          updated_at: string
          user_id: string | null
          whatsapp_url: string | null
        }
        Insert: {
          ativo?: boolean | null
          bio_curta?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          ativo?: boolean | null
          bio_curta?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navegadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          message: string
          priority: string
          read_by: string[] | null
          title: string
          type: string
          visible_to: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          message: string
          priority?: string
          read_by?: string[] | null
          title: string
          type?: string
          visible_to?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          message?: string
          priority?: string
          read_by?: string[] | null
          title?: string
          type?: string
          visible_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objetivos: {
        Row: {
          concluido: boolean
          created_at: string
          descricao: string | null
          id: string
          meta_id: string
          ordem: number
          status: Database["public"]["Enums"]["status_objetivo"]
          tipo: string
          titulo: string
          unidade: string | null
          updated_at: string
          valor_atual: number | null
          valor_meta: number | null
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          meta_id: string
          ordem?: number
          status?: Database["public"]["Enums"]["status_objetivo"]
          tipo: string
          titulo: string
          unidade?: string | null
          updated_at?: string
          valor_atual?: number | null
          valor_meta?: number | null
        }
        Update: {
          concluido?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          meta_id?: string
          ordem?: number
          status?: Database["public"]["Enums"]["status_objetivo"]
          tipo?: string
          titulo?: string
          unidade?: string | null
          updated_at?: string
          valor_atual?: number | null
          valor_meta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objetivos_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      pilares_desempenho: {
        Row: {
          created_at: string
          id: string
          mentorado_id: string
          mes_ano: string
          nota_0_100: number | null
          pilar: Database["public"]["Enums"]["pilar_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentorado_id: string
          mes_ano: string
          nota_0_100?: number | null
          pilar: Database["public"]["Enums"]["pilar_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentorado_id?: string
          mes_ano?: string
          nota_0_100?: number | null
          pilar?: Database["public"]["Enums"]["pilar_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilares_desempenho_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      posto_ipiranga_links: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
          updated_at: string
          url: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
          url: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      premiacoes: {
        Row: {
          badge_url: string | null
          created_at: string
          descricao: string | null
          faixa: Database["public"]["Enums"]["faixa_premiacao"]
          id: string
          max_faturamento: number | null
          min_faturamento: number
        }
        Insert: {
          badge_url?: string | null
          created_at?: string
          descricao?: string | null
          faixa: Database["public"]["Enums"]["faixa_premiacao"]
          id?: string
          max_faturamento?: number | null
          min_faturamento: number
        }
        Update: {
          badge_url?: string | null
          created_at?: string
          descricao?: string | null
          faixa?: Database["public"]["Enums"]["faixa_premiacao"]
          id?: string
          max_faturamento?: number | null
          min_faturamento?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: Database["public"]["Enums"]["categoria_produto"]
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          updated_at: string
          url_compra: string | null
        }
        Insert: {
          ativo?: boolean
          categoria: Database["public"]["Enums"]["categoria_produto"]
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          updated_at?: string
          url_compra?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["categoria_produto"]
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          updated_at?: string
          url_compra?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apelido: string | null
          created_at: string
          foto_url: string | null
          id: string
          nome_completo: string
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          created_at?: string
          foto_url?: string | null
          id: string
          nome_completo: string
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nome_completo?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes_agendamento: {
        Row: {
          assunto: string | null
          canal: Database["public"]["Enums"]["canal_atendimento"]
          created_at: string
          data_hora: string
          id: string
          mentorado_id: string
          navegador_id: string
          observacoes: string | null
          status: string
          tipo_atendimento: string
          updated_at: string
        }
        Insert: {
          assunto?: string | null
          canal: Database["public"]["Enums"]["canal_atendimento"]
          created_at?: string
          data_hora: string
          id?: string
          mentorado_id: string
          navegador_id: string
          observacoes?: string | null
          status?: string
          tipo_atendimento: string
          updated_at?: string
        }
        Update: {
          assunto?: string | null
          canal?: Database["public"]["Enums"]["canal_atendimento"]
          created_at?: string
          data_hora?: string
          id?: string
          mentorado_id?: string
          navegador_id?: string
          observacoes?: string | null
          status?: string
          tipo_atendimento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_agendamento_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_agendamento_navegador_id_fkey"
            columns: ["navegador_id"]
            isOneToOne: false
            referencedRelation: "navegadores"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_aceleracao: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          pilar: Database["public"]["Enums"]["pilar_enum"]
          thumbnail_url: string | null
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          pilar: Database["public"]["Enums"]["pilar_enum"]
          thumbnail_url?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          pilar?: Database["public"]["Enums"]["pilar_enum"]
          thumbnail_url?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      trilhas_mentorado: {
        Row: {
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          mentorado_id: string
          prazo: string | null
          prioridade: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          mentorado_id: string
          prazo?: string | null
          prioridade?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          mentorado_id?: string
          prazo?: string | null
          prioridade?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trilhas_mentorado_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trilhas_mentorado_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zoom_info: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          instrucoes_html: string | null
          senha_acesso: string | null
          titulo: string
          tutorial_url: string | null
          updated_at: string
          url_zoom: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          instrucoes_html?: string | null
          senha_acesso?: string | null
          titulo: string
          tutorial_url?: string | null
          updated_at?: string
          url_zoom: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          instrucoes_html?: string | null
          senha_acesso?: string | null
          titulo?: string
          tutorial_url?: string | null
          updated_at?: string
          url_zoom?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mentorado_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "navegador" | "mentorado"
      audience_type: "todos" | "turma" | "produto" | "mentorado"
      canal_atendimento: "WhatsApp" | "Ligação" | "Email"
      categoria_produto: "livros" | "vestuario" | "acessorios" | "canecas"
      faixa_premiacao: "Bronze" | "Prata" | "Ouro" | "Platina" | "Diamante"
      pilar_avaliacao:
        | "eu_empreendedor"
        | "estruturacao_empresa"
        | "processos"
        | "posicionamento"
        | "marketing"
        | "vendas"
        | "construcao_equipe"
        | "gestao_equipe"
        | "experiencia_cliente"
      pilar_enum:
        | "Empreendedor"
        | "Estruturação"
        | "Marketing"
        | "Vendas"
        | "Gestão"
        | "Finanças"
      status_atendimento: "Aberto" | "Resolvido" | "Pendente"
      status_mentorado: "ativo" | "inativo"
      status_meta: "ativa" | "concluida" | "arquivada"
      status_objetivo: "pendente" | "em_progresso" | "concluido"
      tipo_conteudo: "Vídeo" | "PDF" | "Link" | "Checklist"
      tipo_encontro: "Diagnóstico" | "Mentoria Livre" | "Imersão"
      tipo_material: "PDF" | "Vídeo" | "Planilha" | "Link"
      tipo_mentoria: "Mentoria" | "Imersão" | "Live Especial"
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
      app_role: ["admin", "navegador", "mentorado"],
      audience_type: ["todos", "turma", "produto", "mentorado"],
      canal_atendimento: ["WhatsApp", "Ligação", "Email"],
      categoria_produto: ["livros", "vestuario", "acessorios", "canecas"],
      faixa_premiacao: ["Bronze", "Prata", "Ouro", "Platina", "Diamante"],
      pilar_avaliacao: [
        "eu_empreendedor",
        "estruturacao_empresa",
        "processos",
        "posicionamento",
        "marketing",
        "vendas",
        "construcao_equipe",
        "gestao_equipe",
        "experiencia_cliente",
      ],
      pilar_enum: [
        "Empreendedor",
        "Estruturação",
        "Marketing",
        "Vendas",
        "Gestão",
        "Finanças",
      ],
      status_atendimento: ["Aberto", "Resolvido", "Pendente"],
      status_mentorado: ["ativo", "inativo"],
      status_meta: ["ativa", "concluida", "arquivada"],
      status_objetivo: ["pendente", "em_progresso", "concluido"],
      tipo_conteudo: ["Vídeo", "PDF", "Link", "Checklist"],
      tipo_encontro: ["Diagnóstico", "Mentoria Livre", "Imersão"],
      tipo_material: ["PDF", "Vídeo", "Planilha", "Link"],
      tipo_mentoria: ["Mentoria", "Imersão", "Live Especial"],
    },
  },
} as const
