CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'navegador',
    'mentorado'
);


--
-- Name: audience_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audience_type AS ENUM (
    'todos',
    'turma',
    'produto',
    'mentorado'
);


--
-- Name: canal_atendimento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.canal_atendimento AS ENUM (
    'WhatsApp',
    'Ligação',
    'Email'
);


--
-- Name: faixa_premiacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.faixa_premiacao AS ENUM (
    'Bronze',
    'Prata',
    'Ouro',
    'Platina',
    'Diamante'
);


--
-- Name: pilar_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pilar_enum AS ENUM (
    'Empreendedor',
    'Estruturação',
    'Marketing',
    'Vendas',
    'Gestão',
    'Finanças'
);


--
-- Name: status_atendimento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_atendimento AS ENUM (
    'Aberto',
    'Resolvido',
    'Pendente'
);


--
-- Name: status_mentorado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_mentorado AS ENUM (
    'ativo',
    'inativo'
);


--
-- Name: tipo_conteudo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_conteudo AS ENUM (
    'Vídeo',
    'PDF',
    'Link',
    'Checklist'
);


--
-- Name: tipo_encontro; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_encontro AS ENUM (
    'Diagnóstico',
    'Mentoria Livre',
    'Imersão'
);


--
-- Name: tipo_material; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_material AS ENUM (
    'PDF',
    'Vídeo',
    'Planilha',
    'Link'
);


--
-- Name: tipo_mentoria; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_mentoria AS ENUM (
    'Mentoria',
    'Imersão',
    'Live Especial'
);


--
-- Name: get_mentorado_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_mentorado_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.mentorados WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, apelido, foto_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email), NEW.raw_user_meta_data->>'apelido', NEW.raw_user_meta_data->>'foto_url');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agenda_mentoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_mentoria (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data_hora timestamp with time zone NOT NULL,
    tipo public.tipo_mentoria NOT NULL,
    link_zoom text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atendimentos_navegador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimentos_navegador (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    mentorado_id uuid NOT NULL,
    navegador_id uuid NOT NULL,
    data_hora timestamp with time zone DEFAULT now() NOT NULL,
    canal public.canal_atendimento NOT NULL,
    assunto text,
    nota text,
    status public.status_atendimento DEFAULT 'Aberto'::public.status_atendimento,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atribuicoes_conteudo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atribuicoes_conteudo (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    conteudo_id uuid NOT NULL,
    audience_type public.audience_type NOT NULL,
    turma text,
    produto text,
    mentorado_id uuid,
    nota_privada text,
    criado_por uuid,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conteudo_direcionado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conteudo_direcionado (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tipo public.tipo_conteudo NOT NULL,
    titulo text NOT NULL,
    descricao text,
    url text,
    arquivo_id text,
    pilar public.pilar_enum,
    tags text[],
    data_publicacao timestamp with time zone DEFAULT now() NOT NULL,
    expira_em timestamp with time zone,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: desempenho_mensal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desempenho_mensal (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    mentorado_id uuid NOT NULL,
    mes_ano text NOT NULL,
    faturamento_mensal numeric(15,2) DEFAULT 0,
    clientes_mes integer DEFAULT 0,
    qtd_propostas integer DEFAULT 0,
    contratos_fechados integer DEFAULT 0,
    meta_mensal numeric(15,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: encontros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encontros (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data_hora timestamp with time zone NOT NULL,
    tipo public.tipo_encontro NOT NULL,
    link_zoom text,
    materiais_urls text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gravacoes_encontros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gravacoes_encontros (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    encontro_id uuid NOT NULL,
    titulo text NOT NULL,
    url_video text NOT NULL,
    duracao_seg integer,
    thumbnail_url text,
    descricao text,
    transcript_url text,
    ai_resumo text,
    tags text[],
    visibilidade text DEFAULT 'todos'::text,
    data_publicacao timestamp with time zone DEFAULT now() NOT NULL,
    expira_em timestamp with time zone,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gravacoes_individuais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gravacoes_individuais (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    mentorado_id uuid NOT NULL,
    navegador_id uuid,
    titulo text NOT NULL,
    url_video text NOT NULL,
    duracao_seg integer,
    thumbnail_url text,
    descricao text,
    transcript_url text,
    ai_resumo text,
    tags text[],
    data_gravacao date DEFAULT CURRENT_DATE NOT NULL,
    data_publicacao timestamp with time zone DEFAULT now() NOT NULL,
    expira_em timestamp with time zone,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: livros_recomendados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.livros_recomendados (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    titulo text NOT NULL,
    autor text NOT NULL,
    descricao_curta text,
    url_compra text,
    capa_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: materiais_complementares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materiais_complementares (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pilar public.pilar_enum NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo public.tipo_material NOT NULL,
    url text NOT NULL,
    data_publicacao date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mentorados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentorados (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    whatsapp text,
    email text,
    instagram text,
    data_ingresso date DEFAULT CURRENT_DATE NOT NULL,
    turma text,
    meta_clientes integer DEFAULT 0,
    status public.status_mentorado DEFAULT 'ativo'::public.status_mentorado,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: navegadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.navegadores (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    cargo text,
    bio_curta text,
    whatsapp_url text,
    email text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pilares_desempenho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pilares_desempenho (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    mentorado_id uuid NOT NULL,
    pilar public.pilar_enum NOT NULL,
    mes_ano text NOT NULL,
    nota_0_100 integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pilares_desempenho_nota_0_100_check CHECK (((nota_0_100 >= 0) AND (nota_0_100 <= 100)))
);


--
-- Name: premiacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.premiacoes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    faixa public.faixa_premiacao NOT NULL,
    min_faturamento numeric(15,2) NOT NULL,
    max_faturamento numeric(15,2),
    descricao text,
    badge_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    nome_completo text NOT NULL,
    apelido text,
    foto_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trilha_aceleracao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trilha_aceleracao (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pilar public.pilar_enum NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    url text,
    ordem integer DEFAULT 0 NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: zoom_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoom_info (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    titulo text NOT NULL,
    url_zoom text NOT NULL,
    senha_acesso text,
    tutorial_url text,
    instrucoes_html text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agenda_mentoria agenda_mentoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_mentoria
    ADD CONSTRAINT agenda_mentoria_pkey PRIMARY KEY (id);


--
-- Name: atendimentos_navegador atendimentos_navegador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_navegador
    ADD CONSTRAINT atendimentos_navegador_pkey PRIMARY KEY (id);


--
-- Name: atribuicoes_conteudo atribuicoes_conteudo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atribuicoes_conteudo
    ADD CONSTRAINT atribuicoes_conteudo_pkey PRIMARY KEY (id);


--
-- Name: conteudo_direcionado conteudo_direcionado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteudo_direcionado
    ADD CONSTRAINT conteudo_direcionado_pkey PRIMARY KEY (id);


--
-- Name: desempenho_mensal desempenho_mensal_mentorado_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desempenho_mensal
    ADD CONSTRAINT desempenho_mensal_mentorado_id_mes_ano_key UNIQUE (mentorado_id, mes_ano);


--
-- Name: desempenho_mensal desempenho_mensal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desempenho_mensal
    ADD CONSTRAINT desempenho_mensal_pkey PRIMARY KEY (id);


--
-- Name: encontros encontros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encontros
    ADD CONSTRAINT encontros_pkey PRIMARY KEY (id);


--
-- Name: gravacoes_encontros gravacoes_encontros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gravacoes_encontros
    ADD CONSTRAINT gravacoes_encontros_pkey PRIMARY KEY (id);


--
-- Name: gravacoes_individuais gravacoes_individuais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gravacoes_individuais
    ADD CONSTRAINT gravacoes_individuais_pkey PRIMARY KEY (id);


--
-- Name: livros_recomendados livros_recomendados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livros_recomendados
    ADD CONSTRAINT livros_recomendados_pkey PRIMARY KEY (id);


--
-- Name: materiais_complementares materiais_complementares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiais_complementares
    ADD CONSTRAINT materiais_complementares_pkey PRIMARY KEY (id);


--
-- Name: mentorados mentorados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorados
    ADD CONSTRAINT mentorados_pkey PRIMARY KEY (id);


--
-- Name: mentorados mentorados_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorados
    ADD CONSTRAINT mentorados_user_id_key UNIQUE (user_id);


--
-- Name: navegadores navegadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navegadores
    ADD CONSTRAINT navegadores_pkey PRIMARY KEY (id);


--
-- Name: navegadores navegadores_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navegadores
    ADD CONSTRAINT navegadores_user_id_key UNIQUE (user_id);


--
-- Name: pilares_desempenho pilares_desempenho_mentorado_id_pilar_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilares_desempenho
    ADD CONSTRAINT pilares_desempenho_mentorado_id_pilar_mes_ano_key UNIQUE (mentorado_id, pilar, mes_ano);


--
-- Name: pilares_desempenho pilares_desempenho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilares_desempenho
    ADD CONSTRAINT pilares_desempenho_pkey PRIMARY KEY (id);


--
-- Name: premiacoes premiacoes_faixa_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premiacoes
    ADD CONSTRAINT premiacoes_faixa_key UNIQUE (faixa);


--
-- Name: premiacoes premiacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premiacoes
    ADD CONSTRAINT premiacoes_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: trilha_aceleracao trilha_aceleracao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trilha_aceleracao
    ADD CONSTRAINT trilha_aceleracao_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: zoom_info zoom_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoom_info
    ADD CONSTRAINT zoom_info_pkey PRIMARY KEY (id);


--
-- Name: agenda_mentoria update_agenda_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON public.agenda_mentoria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: atendimentos_navegador update_atendimentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON public.atendimentos_navegador FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conteudo_direcionado update_conteudo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conteudo_updated_at BEFORE UPDATE ON public.conteudo_direcionado FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: desempenho_mensal update_desempenho_mensal_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_desempenho_mensal_updated_at BEFORE UPDATE ON public.desempenho_mensal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: encontros update_encontros_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_encontros_updated_at BEFORE UPDATE ON public.encontros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gravacoes_encontros update_gravacoes_encontros_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gravacoes_encontros_updated_at BEFORE UPDATE ON public.gravacoes_encontros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gravacoes_individuais update_gravacoes_individuais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gravacoes_individuais_updated_at BEFORE UPDATE ON public.gravacoes_individuais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: materiais_complementares update_materiais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais_complementares FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mentorados update_mentorados_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mentorados_updated_at BEFORE UPDATE ON public.mentorados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: navegadores update_navegadores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_navegadores_updated_at BEFORE UPDATE ON public.navegadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pilares_desempenho update_pilares_desempenho_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pilares_desempenho_updated_at BEFORE UPDATE ON public.pilares_desempenho FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trilha_aceleracao update_trilha_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trilha_updated_at BEFORE UPDATE ON public.trilha_aceleracao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: zoom_info update_zoom_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_zoom_updated_at BEFORE UPDATE ON public.zoom_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: atendimentos_navegador atendimentos_navegador_mentorado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_navegador
    ADD CONSTRAINT atendimentos_navegador_mentorado_id_fkey FOREIGN KEY (mentorado_id) REFERENCES public.mentorados(id) ON DELETE CASCADE;


--
-- Name: atendimentos_navegador atendimentos_navegador_navegador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_navegador
    ADD CONSTRAINT atendimentos_navegador_navegador_id_fkey FOREIGN KEY (navegador_id) REFERENCES public.navegadores(id) ON DELETE CASCADE;


--
-- Name: atribuicoes_conteudo atribuicoes_conteudo_conteudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atribuicoes_conteudo
    ADD CONSTRAINT atribuicoes_conteudo_conteudo_id_fkey FOREIGN KEY (conteudo_id) REFERENCES public.conteudo_direcionado(id) ON DELETE CASCADE;


--
-- Name: atribuicoes_conteudo atribuicoes_conteudo_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atribuicoes_conteudo
    ADD CONSTRAINT atribuicoes_conteudo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: atribuicoes_conteudo atribuicoes_conteudo_mentorado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atribuicoes_conteudo
    ADD CONSTRAINT atribuicoes_conteudo_mentorado_id_fkey FOREIGN KEY (mentorado_id) REFERENCES public.mentorados(id) ON DELETE CASCADE;


--
-- Name: desempenho_mensal desempenho_mensal_mentorado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desempenho_mensal
    ADD CONSTRAINT desempenho_mensal_mentorado_id_fkey FOREIGN KEY (mentorado_id) REFERENCES public.mentorados(id) ON DELETE CASCADE;


--
-- Name: gravacoes_encontros gravacoes_encontros_encontro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gravacoes_encontros
    ADD CONSTRAINT gravacoes_encontros_encontro_id_fkey FOREIGN KEY (encontro_id) REFERENCES public.encontros(id) ON DELETE CASCADE;


--
-- Name: gravacoes_individuais gravacoes_individuais_mentorado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gravacoes_individuais
    ADD CONSTRAINT gravacoes_individuais_mentorado_id_fkey FOREIGN KEY (mentorado_id) REFERENCES public.mentorados(id) ON DELETE CASCADE;


--
-- Name: gravacoes_individuais gravacoes_individuais_navegador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gravacoes_individuais
    ADD CONSTRAINT gravacoes_individuais_navegador_id_fkey FOREIGN KEY (navegador_id) REFERENCES public.navegadores(id) ON DELETE SET NULL;


--
-- Name: mentorados mentorados_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentorados
    ADD CONSTRAINT mentorados_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: navegadores navegadores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.navegadores
    ADD CONSTRAINT navegadores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pilares_desempenho pilares_desempenho_mentorado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilares_desempenho
    ADD CONSTRAINT pilares_desempenho_mentorado_id_fkey FOREIGN KEY (mentorado_id) REFERENCES public.mentorados(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: agenda_mentoria Admins manage agenda; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage agenda" ON public.agenda_mentoria USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: desempenho_mensal Admins manage all performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all performance" ON public.desempenho_mensal USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: atribuicoes_conteudo Admins manage atribuicoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage atribuicoes" ON public.atribuicoes_conteudo USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conteudo_direcionado Admins manage conteudo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage conteudo" ON public.conteudo_direcionado USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: encontros Admins manage encontros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage encontros" ON public.encontros USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gravacoes_encontros Admins manage gravacoes encontros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage gravacoes encontros" ON public.gravacoes_encontros USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gravacoes_individuais Admins manage gravacoes individuais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage gravacoes individuais" ON public.gravacoes_individuais USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: livros_recomendados Admins manage livros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage livros" ON public.livros_recomendados USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: materiais_complementares Admins manage materiais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage materiais" ON public.materiais_complementares USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mentorados Admins manage mentorados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage mentorados" ON public.mentorados USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: navegadores Admins manage navegadores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage navegadores" ON public.navegadores USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pilares_desempenho Admins manage pilares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage pilares" ON public.pilares_desempenho USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: premiacoes Admins manage premiacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage premiacoes" ON public.premiacoes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: trilha_aceleracao Admins manage trilha; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage trilha" ON public.trilha_aceleracao USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: zoom_info Admins manage zoom; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage zoom" ON public.zoom_info USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: agenda_mentoria Auth users view agenda; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view agenda" ON public.agenda_mentoria FOR SELECT TO authenticated USING (true);


--
-- Name: encontros Auth users view encontros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view encontros" ON public.encontros FOR SELECT TO authenticated USING (true);


--
-- Name: livros_recomendados Auth users view livros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view livros" ON public.livros_recomendados FOR SELECT TO authenticated USING (true);


--
-- Name: materiais_complementares Auth users view materiais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view materiais" ON public.materiais_complementares FOR SELECT TO authenticated USING (true);


--
-- Name: premiacoes Auth users view premiacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view premiacoes" ON public.premiacoes FOR SELECT TO authenticated USING (true);


--
-- Name: trilha_aceleracao Auth users view trilha; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view trilha" ON public.trilha_aceleracao FOR SELECT TO authenticated USING (true);


--
-- Name: zoom_info Auth users view zoom; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users view zoom" ON public.zoom_info FOR SELECT TO authenticated USING ((ativo = true));


--
-- Name: atendimentos_navegador Create atendimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Create atendimentos" ON public.atendimentos_navegador FOR INSERT WITH CHECK (((mentorado_id = public.get_mentorado_id(auth.uid())) OR public.has_role(auth.uid(), 'navegador'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: desempenho_mensal Mentorados insert own performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados insert own performance" ON public.desempenho_mensal FOR INSERT WITH CHECK ((mentorado_id = public.get_mentorado_id(auth.uid())));


--
-- Name: mentorados Mentorados update own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados update own data" ON public.mentorados FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: desempenho_mensal Mentorados update own performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados update own performance" ON public.desempenho_mensal FOR UPDATE USING ((mentorado_id = public.get_mentorado_id(auth.uid())));


--
-- Name: atendimentos_navegador Mentorados view own atendimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados view own atendimentos" ON public.atendimentos_navegador FOR SELECT USING (((mentorado_id = public.get_mentorado_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'navegador'::public.app_role)));


--
-- Name: mentorados Mentorados view own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados view own data" ON public.mentorados FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'navegador'::public.app_role)));


--
-- Name: gravacoes_individuais Mentorados view own gravacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados view own gravacoes" ON public.gravacoes_individuais FOR SELECT USING (((mentorado_id = public.get_mentorado_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'navegador'::public.app_role)));


--
-- Name: desempenho_mensal Mentorados view own performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados view own performance" ON public.desempenho_mensal FOR SELECT USING (((mentorado_id = public.get_mentorado_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'navegador'::public.app_role)));


--
-- Name: pilares_desempenho Mentorados view own pilares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentorados view own pilares" ON public.pilares_desempenho FOR SELECT USING (((mentorado_id = public.get_mentorado_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'navegador'::public.app_role)));


--
-- Name: atendimentos_navegador Navegadores manage atendimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Navegadores manage atendimentos" ON public.atendimentos_navegador USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'navegador'::public.app_role)));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conteudo_direcionado View active conteudo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View active conteudo" ON public.conteudo_direcionado FOR SELECT TO authenticated USING (((ativo = true) AND ((expira_em IS NULL) OR (expira_em > now()))));


--
-- Name: gravacoes_encontros View active gravacoes encontros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View active gravacoes encontros" ON public.gravacoes_encontros FOR SELECT TO authenticated USING (((ativo = true) AND ((expira_em IS NULL) OR (expira_em > now()))));


--
-- Name: navegadores View active navegadores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View active navegadores" ON public.navegadores FOR SELECT USING (((ativo = true) OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: atribuicoes_conteudo View assigned content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View assigned content" ON public.atribuicoes_conteudo FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (mentorado_id = public.get_mentorado_id(auth.uid()))));


--
-- Name: agenda_mentoria; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agenda_mentoria ENABLE ROW LEVEL SECURITY;

--
-- Name: atendimentos_navegador; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atendimentos_navegador ENABLE ROW LEVEL SECURITY;

--
-- Name: atribuicoes_conteudo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atribuicoes_conteudo ENABLE ROW LEVEL SECURITY;

--
-- Name: conteudo_direcionado; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conteudo_direcionado ENABLE ROW LEVEL SECURITY;

--
-- Name: desempenho_mensal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.desempenho_mensal ENABLE ROW LEVEL SECURITY;

--
-- Name: encontros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;

--
-- Name: gravacoes_encontros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gravacoes_encontros ENABLE ROW LEVEL SECURITY;

--
-- Name: gravacoes_individuais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gravacoes_individuais ENABLE ROW LEVEL SECURITY;

--
-- Name: livros_recomendados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.livros_recomendados ENABLE ROW LEVEL SECURITY;

--
-- Name: materiais_complementares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.materiais_complementares ENABLE ROW LEVEL SECURITY;

--
-- Name: mentorados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentorados ENABLE ROW LEVEL SECURITY;

--
-- Name: navegadores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.navegadores ENABLE ROW LEVEL SECURITY;

--
-- Name: pilares_desempenho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pilares_desempenho ENABLE ROW LEVEL SECURITY;

--
-- Name: premiacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.premiacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: trilha_aceleracao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trilha_aceleracao ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: zoom_info; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zoom_info ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


