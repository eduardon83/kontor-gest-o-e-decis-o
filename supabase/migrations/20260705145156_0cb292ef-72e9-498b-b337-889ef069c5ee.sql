
-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.tem_papel(_papel public.papel_utilizador)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND papel = _papel); $$;

CREATE OR REPLACE FUNCTION public.minha_instituicao()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT instituicao_id FROM public.perfis WHERE id = auth.uid(); $$;

-- instituicoes
CREATE TABLE public.instituicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tema jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instituicoes TO authenticated;
GRANT ALL ON public.instituicoes TO service_role;
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

-- competicoes
CREATE TABLE public.competicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  seed bigint NOT NULL,
  industria text NOT NULL DEFAULT 'mobiliario',
  ambito text NOT NULL DEFAULT 'intra_turma' CHECK (ambito IN ('inter_escola','intra_escola','intra_turma')),
  duracao_turnos int NOT NULL DEFAULT 10,
  transparencia text NOT NULL DEFAULT 'total',
  politica_ausente text NOT NULL DEFAULT 'status_quo',
  desbloqueio_total bool NOT NULL DEFAULT false,
  tema jsonb NOT NULL DEFAULT '{}'::jsonb,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'rascunho',
  codigo text UNIQUE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competicoes TO authenticated;
GRANT ALL ON public.competicoes TO service_role;
ALTER TABLE public.competicoes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.professor_da_competicao(_competicao uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.competicoes WHERE id = _competicao AND criado_por = auth.uid()); $$;

-- mercados
CREATE TABLE public.mercados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competicao_id uuid NOT NULL REFERENCES public.competicoes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mercados TO authenticated;
GRANT ALL ON public.mercados TO service_role;
ALTER TABLE public.mercados ENABLE ROW LEVEL SECURITY;

-- equipas
CREATE TABLE public.equipas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mercado_id uuid NOT NULL REFERENCES public.mercados(id) ON DELETE CASCADE,
  nome text NOT NULL,
  capitao_user_id uuid,
  is_ia bool NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipas TO authenticated;
GRANT ALL ON public.equipas TO service_role;
ALTER TABLE public.equipas ENABLE ROW LEVEL SECURITY;

-- membros_equipa
CREATE TABLE public.membros_equipa (
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  lugar text NOT NULL CHECK (lugar IN ('CEO','CFO','COO','CMO','CHRO')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (equipa_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membros_equipa TO authenticated;
GRANT ALL ON public.membros_equipa TO service_role;
ALTER TABLE public.membros_equipa ENABLE ROW LEVEL SECURITY;

-- rondas
CREATE TABLE public.rondas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competicao_id uuid NOT NULL REFERENCES public.competicoes(id) ON DELETE CASCADE,
  indice int NOT NULL,
  abre_em timestamptz,
  prazo_em timestamptz,
  estado text NOT NULL DEFAULT 'aberta' CHECK (estado IN ('aberta','fechada','resolvida')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competicao_id, indice)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rondas TO authenticated;
GRANT ALL ON public.rondas TO service_role;
ALTER TABLE public.rondas ENABLE ROW LEVEL SECURITY;

-- decisoes
CREATE TABLE public.decisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ronda_id uuid NOT NULL REFERENCES public.rondas(id) ON DELETE CASCADE,
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  lugar text NOT NULL CHECK (lugar IN ('CEO','CFO','COO','CMO','CHRO')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submetido_em timestamptz,
  submetido_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ronda_id, equipa_id, lugar)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decisoes TO authenticated;
GRANT ALL ON public.decisoes TO service_role;
ALTER TABLE public.decisoes ENABLE ROW LEVEL SECURITY;

-- acoes_informacao
CREATE TABLE public.acoes_informacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ronda_id uuid NOT NULL REFERENCES public.rondas(id) ON DELETE CASCADE,
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  lugar text NOT NULL CHECK (lugar IN ('CEO','CFO','COO','CMO','CHRO')),
  tipo text NOT NULL,
  nivel text,
  custo numeric NOT NULL DEFAULT 0,
  confianca numeric,
  resultado jsonb,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acoes_informacao TO authenticated;
GRANT ALL ON public.acoes_informacao TO service_role;
ALTER TABLE public.acoes_informacao ENABLE ROW LEVEL SECURITY;

-- estado_empresa
CREATE TABLE public.estado_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  ronda_id uuid NOT NULL REFERENCES public.rondas(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipa_id, ronda_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estado_empresa TO authenticated;
GRANT ALL ON public.estado_empresa TO service_role;
ALTER TABLE public.estado_empresa ENABLE ROW LEVEL SECURITY;

-- colaboradores
CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  papel_org text NOT NULL DEFAULT 'trabalhador' CHECK (papel_org IN ('trabalhador','supervisor','gestor_linha','investigador')),
  competencia numeric NOT NULL DEFAULT 1.0,
  motivacao numeric NOT NULL DEFAULT 60,
  stress_individual numeric NOT NULL DEFAULT 30,
  resiliencia numeric NOT NULL DEFAULT 50,
  aptidao_gestao numeric NOT NULL DEFAULT 40,
  produtividade_base numeric NOT NULL DEFAULT 1.0,
  arquetipo text CHECK (arquetipo IN ('Veterano','Talento','Esteio','Inquieto','Aprendiz')),
  avatar_variante int NOT NULL DEFAULT 1,
  necessidades jsonb NOT NULL DEFAULT '{}'::jsonb,
  antiguidade int NOT NULL DEFAULT 0,
  salario_mult numeric NOT NULL DEFAULT 1.0,
  ativo bool NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- eventos
CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  ronda_id uuid NOT NULL REFERENCES public.rondas(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  efeito jsonb NOT NULL DEFAULT '{}'::jsonb,
  timing text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- resultados
CREATE TABLE public.resultados (
  ronda_id uuid NOT NULL REFERENCES public.rondas(id) ON DELETE CASCADE,
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  posicao int,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ronda_id, equipa_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultados TO authenticated;
GRANT ALL ON public.resultados TO service_role;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

-- economia_seed (só service_role)
CREATE TABLE public.economia_seed (
  competicao_id uuid PRIMARY KEY REFERENCES public.competicoes(id) ON DELETE CASCADE,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.economia_seed TO service_role;
ALTER TABLE public.economia_seed ENABLE ROW LEVEL SECURITY;

-- log_auditoria
CREATE TABLE public.log_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ator_user_id uuid,
  acao text NOT NULL,
  alvo text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.log_auditoria TO authenticated;
GRANT ALL ON public.log_auditoria TO service_role;
ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Funções auxiliares que dependem de várias tabelas
-- ============================================================
CREATE OR REPLACE FUNCTION public.e_membro_equipa(_equipa uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.membros_equipa WHERE equipa_id = _equipa AND user_id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.meu_lugar_na_equipa(_equipa uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT lugar FROM public.membros_equipa WHERE equipa_id = _equipa AND user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.competicao_da_equipa(_equipa uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT m.competicao_id FROM public.equipas e JOIN public.mercados m ON m.id = e.mercado_id WHERE e.id = _equipa; $$;

CREATE OR REPLACE FUNCTION public.instituicao_da_equipa(_equipa uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT c.instituicao_id FROM public.equipas e
  JOIN public.mercados m ON m.id = e.mercado_id
  JOIN public.competicoes c ON c.id = m.competicao_id WHERE e.id = _equipa; $$;

CREATE OR REPLACE FUNCTION public.ronda_esta_aberta(_ronda uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.rondas WHERE id = _ronda AND estado = 'aberta'); $$;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- instituicoes
CREATE POLICY "super_admin gere instituicoes" ON public.instituicoes FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le a sua instituicao" ON public.instituicoes FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND id = public.minha_instituicao());
CREATE POLICY "admin_escolar atualiza a sua instituicao" ON public.instituicoes FOR UPDATE TO authenticated
  USING (public.tem_papel('admin_escolar') AND id = public.minha_instituicao())
  WITH CHECK (public.tem_papel('admin_escolar') AND id = public.minha_instituicao());
CREATE POLICY "professor le a sua instituicao" ON public.instituicoes FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND id = public.minha_instituicao());
CREATE POLICY "jogador le a sua instituicao" ON public.instituicoes FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND id = public.minha_instituicao());
CREATE TRIGGER trg_instituicoes_atualizado_em BEFORE UPDATE ON public.instituicoes
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- competicoes
CREATE POLICY "super_admin gere competicoes" ON public.competicoes FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le competicoes da instituicao" ON public.competicoes FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao());
CREATE POLICY "admin_escolar cria competicoes na instituicao" ON public.competicoes FOR INSERT TO authenticated
  WITH CHECK (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao());
CREATE POLICY "admin_escolar atualiza competicoes da instituicao" ON public.competicoes FOR UPDATE TO authenticated
  USING (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao())
  WITH CHECK (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao());
CREATE POLICY "admin_escolar apaga competicoes da instituicao" ON public.competicoes FOR DELETE TO authenticated
  USING (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao());
CREATE POLICY "professor le competicoes proprias" ON public.competicoes FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND criado_por = auth.uid());
CREATE POLICY "professor cria competicoes proprias" ON public.competicoes FOR INSERT TO authenticated
  WITH CHECK (public.tem_papel('professor') AND criado_por = auth.uid());
CREATE POLICY "professor atualiza competicoes proprias" ON public.competicoes FOR UPDATE TO authenticated
  USING (public.tem_papel('professor') AND criado_por = auth.uid())
  WITH CHECK (public.tem_papel('professor') AND criado_por = auth.uid());
CREATE POLICY "professor apaga competicoes proprias" ON public.competicoes FOR DELETE TO authenticated
  USING (public.tem_papel('professor') AND criado_por = auth.uid());
CREATE TRIGGER trg_competicoes_atualizado_em BEFORE UPDATE ON public.competicoes
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- mercados
CREATE POLICY "super_admin gere mercados" ON public.mercados FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar gere mercados da instituicao" ON public.mercados FOR ALL TO authenticated
  USING (public.tem_papel('admin_escolar') AND EXISTS (
    SELECT 1 FROM public.competicoes c WHERE c.id = mercados.competicao_id AND c.instituicao_id = public.minha_instituicao()))
  WITH CHECK (public.tem_papel('admin_escolar') AND EXISTS (
    SELECT 1 FROM public.competicoes c WHERE c.id = mercados.competicao_id AND c.instituicao_id = public.minha_instituicao()));
CREATE POLICY "professor gere mercados das suas competicoes" ON public.mercados FOR ALL TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(competicao_id))
  WITH CHECK (public.tem_papel('professor') AND public.professor_da_competicao(competicao_id));
CREATE POLICY "jogador le mercado da sua equipa" ON public.mercados FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND EXISTS (
    SELECT 1 FROM public.equipas e JOIN public.membros_equipa m ON m.equipa_id = e.id
    WHERE e.mercado_id = mercados.id AND m.user_id = auth.uid()));

-- equipas
CREATE POLICY "super_admin gere equipas" ON public.equipas FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar gere equipas da instituicao" ON public.equipas FOR ALL TO authenticated
  USING (public.tem_papel('admin_escolar') AND EXISTS (
    SELECT 1 FROM public.mercados m JOIN public.competicoes c ON c.id = m.competicao_id
    WHERE m.id = equipas.mercado_id AND c.instituicao_id = public.minha_instituicao()))
  WITH CHECK (public.tem_papel('admin_escolar') AND EXISTS (
    SELECT 1 FROM public.mercados m JOIN public.competicoes c ON c.id = m.competicao_id
    WHERE m.id = equipas.mercado_id AND c.instituicao_id = public.minha_instituicao()));
CREATE POLICY "professor gere equipas das suas competicoes" ON public.equipas FOR ALL TO authenticated
  USING (public.tem_papel('professor') AND EXISTS (
    SELECT 1 FROM public.mercados m WHERE m.id = equipas.mercado_id AND public.professor_da_competicao(m.competicao_id)))
  WITH CHECK (public.tem_papel('professor') AND EXISTS (
    SELECT 1 FROM public.mercados m WHERE m.id = equipas.mercado_id AND public.professor_da_competicao(m.competicao_id)));
CREATE POLICY "jogador le a sua equipa" ON public.equipas FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(id));

-- membros_equipa
CREATE POLICY "super_admin gere membros" ON public.membros_equipa FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar gere membros da instituicao" ON public.membros_equipa FOR ALL TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao())
  WITH CHECK (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor gere membros das suas competicoes" ON public.membros_equipa FOR ALL TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le membros da sua equipa" ON public.membros_equipa FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));

-- rondas
CREATE POLICY "super_admin gere rondas" ON public.rondas FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar gere rondas da instituicao" ON public.rondas FOR ALL TO authenticated
  USING (public.tem_papel('admin_escolar') AND EXISTS (
    SELECT 1 FROM public.competicoes c WHERE c.id = rondas.competicao_id AND c.instituicao_id = public.minha_instituicao()))
  WITH CHECK (public.tem_papel('admin_escolar') AND EXISTS (
    SELECT 1 FROM public.competicoes c WHERE c.id = rondas.competicao_id AND c.instituicao_id = public.minha_instituicao()));
CREATE POLICY "professor gere rondas das suas competicoes" ON public.rondas FOR ALL TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(competicao_id))
  WITH CHECK (public.tem_papel('professor') AND public.professor_da_competicao(competicao_id));
CREATE POLICY "jogador le rondas da sua competicao" ON public.rondas FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND EXISTS (
    SELECT 1 FROM public.equipas e JOIN public.mercados m ON m.id = e.mercado_id
    JOIN public.membros_equipa mb ON mb.equipa_id = e.id
    WHERE m.competicao_id = rondas.competicao_id AND mb.user_id = auth.uid()));

-- decisoes
CREATE POLICY "super_admin gere decisoes" ON public.decisoes FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le decisoes da instituicao" ON public.decisoes FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor le decisoes das suas competicoes" ON public.decisoes FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le decisoes da sua equipa" ON public.decisoes FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));
CREATE POLICY "jogador cria decisao no seu lugar em ronda aberta" ON public.decisoes FOR INSERT TO authenticated
  WITH CHECK (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id) AND public.ronda_esta_aberta(ronda_id)
    AND submetido_por = auth.uid());
CREATE POLICY "jogador atualiza decisao no seu lugar em ronda aberta" ON public.decisoes FOR UPDATE TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id) AND public.ronda_esta_aberta(ronda_id))
  WITH CHECK (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id) AND public.ronda_esta_aberta(ronda_id)
    AND submetido_por = auth.uid());
CREATE TRIGGER trg_decisoes_atualizado_em BEFORE UPDATE ON public.decisoes
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- acoes_informacao
CREATE POLICY "super_admin gere acoes_info" ON public.acoes_informacao FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le acoes_info da instituicao" ON public.acoes_informacao FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor le acoes_info das suas competicoes" ON public.acoes_informacao FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le acoes_info da sua equipa" ON public.acoes_informacao FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));
CREATE POLICY "jogador cria acao_info no seu lugar em ronda aberta" ON public.acoes_informacao FOR INSERT TO authenticated
  WITH CHECK (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id) AND public.ronda_esta_aberta(ronda_id)
    AND criado_por = auth.uid());
CREATE POLICY "jogador atualiza acao_info no seu lugar em ronda aberta" ON public.acoes_informacao FOR UPDATE TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id) AND public.ronda_esta_aberta(ronda_id))
  WITH CHECK (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id) AND public.ronda_esta_aberta(ronda_id)
    AND criado_por = auth.uid());

-- estado_empresa
CREATE POLICY "super_admin gere estado_empresa" ON public.estado_empresa FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le estado_empresa da instituicao" ON public.estado_empresa FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor le estado_empresa das suas competicoes" ON public.estado_empresa FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le estado_empresa da sua equipa" ON public.estado_empresa FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));

-- colaboradores
CREATE POLICY "super_admin gere colaboradores" ON public.colaboradores FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le colaboradores da instituicao" ON public.colaboradores FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor le colaboradores das suas competicoes" ON public.colaboradores FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le colaboradores da sua equipa" ON public.colaboradores FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));
CREATE TRIGGER trg_colaboradores_atualizado_em BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- eventos
CREATE POLICY "super_admin gere eventos" ON public.eventos FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le eventos da instituicao" ON public.eventos FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor le eventos das suas competicoes" ON public.eventos FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le eventos da sua equipa" ON public.eventos FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));

-- resultados
CREATE POLICY "super_admin gere resultados" ON public.resultados FOR ALL TO authenticated
  USING (public.tem_papel('super_admin')) WITH CHECK (public.tem_papel('super_admin'));
CREATE POLICY "admin_escolar le resultados da instituicao" ON public.resultados FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND public.instituicao_da_equipa(equipa_id) = public.minha_instituicao());
CREATE POLICY "professor le resultados das suas competicoes" ON public.resultados FOR SELECT TO authenticated
  USING (public.tem_papel('professor') AND public.professor_da_competicao(public.competicao_da_equipa(equipa_id)));
CREATE POLICY "jogador le resultados da sua equipa" ON public.resultados FOR SELECT TO authenticated
  USING (public.tem_papel('jogador') AND public.e_membro_equipa(equipa_id));

-- economia_seed (sem qualquer policy → negado a todos exceto service_role)
CREATE TRIGGER trg_economia_seed_atualizado_em BEFORE UPDATE ON public.economia_seed
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- log_auditoria
CREATE POLICY "super_admin le auditoria" ON public.log_auditoria FOR SELECT TO authenticated
  USING (public.tem_papel('super_admin'));
