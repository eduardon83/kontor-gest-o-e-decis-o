
-- ══════════════════════════════════════════════════════════════════
-- 1) FUNÇÕES AUXILIARES (SECURITY DEFINER, sem RLS)
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.e_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid() AND papel = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.competicao_do_mercado(_mercado uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT competicao_id FROM public.mercados WHERE id = _mercado; $$;

CREATE OR REPLACE FUNCTION public.pode_gerir_competicao(_competicao uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.perfis p
      LEFT JOIN public.competicoes c ON c.id = _competicao
     WHERE p.id = auth.uid()
       AND (
            p.papel = 'super_admin'
         OR (p.papel = 'professor'     AND c.criado_por    = auth.uid())
         OR (p.papel = 'admin_escolar' AND c.instituicao_id = p.instituicao_id)
       )
  );
$$;

CREATE OR REPLACE FUNCTION public.sou_membro_da_equipa(_equipa uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros_equipa
     WHERE equipa_id = _equipa AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.sou_membro_do_mercado(_mercado uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.equipas e
      JOIN public.membros_equipa m ON m.equipa_id = e.id
     WHERE e.mercado_id = _mercado AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.sou_membro_da_competicao(_competicao uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.equipas e
      JOIN public.mercados mk       ON mk.id = e.mercado_id
      JOIN public.membros_equipa m  ON m.equipa_id = e.id
     WHERE mk.competicao_id = _competicao AND m.user_id = auth.uid()
  );
$$;

-- ══════════════════════════════════════════════════════════════════
-- 2) REESCRITA DE POLICIES (sem subqueries cruzadas)
-- ══════════════════════════════════════════════════════════════════

-- ── mercados ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar gere mercados da instituicao"   ON public.mercados;
DROP POLICY IF EXISTS "jogador le mercado da sua equipa"             ON public.mercados;
DROP POLICY IF EXISTS "professor gere mercados das suas competicoes" ON public.mercados;
DROP POLICY IF EXISTS "super_admin gere mercados"                    ON public.mercados;

CREATE POLICY "mercados: gerir" ON public.mercados
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(competicao_id))
  WITH CHECK (public.pode_gerir_competicao(competicao_id));

CREATE POLICY "mercados: membros leem" ON public.mercados
  FOR SELECT TO authenticated
  USING (public.sou_membro_do_mercado(id));

-- ── equipas ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar gere equipas da instituicao"   ON public.equipas;
DROP POLICY IF EXISTS "jogador le a sua equipa"                     ON public.equipas;
DROP POLICY IF EXISTS "professor gere equipas das suas competicoes" ON public.equipas;
DROP POLICY IF EXISTS "super_admin gere equipas"                    ON public.equipas;

CREATE POLICY "equipas: gerir" ON public.equipas
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_do_mercado(mercado_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_do_mercado(mercado_id)));

CREATE POLICY "equipas: membros leem" ON public.equipas
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(id));

-- ── membros_equipa ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar gere membros da instituicao"   ON public.membros_equipa;
DROP POLICY IF EXISTS "jogador le membros da sua equipa"            ON public.membros_equipa;
DROP POLICY IF EXISTS "professor gere membros das suas competicoes" ON public.membros_equipa;
DROP POLICY IF EXISTS "super_admin gere membros"                    ON public.membros_equipa;

CREATE POLICY "membros_equipa: gerir" ON public.membros_equipa
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "membros_equipa: membros leem" ON public.membros_equipa
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

-- ── rondas ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar gere rondas da instituicao"   ON public.rondas;
DROP POLICY IF EXISTS "jogador le rondas da sua competicao"        ON public.rondas;
DROP POLICY IF EXISTS "professor gere rondas das suas competicoes" ON public.rondas;
DROP POLICY IF EXISTS "super_admin gere rondas"                    ON public.rondas;

CREATE POLICY "rondas: gerir" ON public.rondas
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(competicao_id))
  WITH CHECK (public.pode_gerir_competicao(competicao_id));

CREATE POLICY "rondas: membros leem" ON public.rondas
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_competicao(competicao_id));

-- ── decisoes ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar le decisoes da instituicao"              ON public.decisoes;
DROP POLICY IF EXISTS "jogador atualiza decisao no seu lugar em ronda aberta" ON public.decisoes;
DROP POLICY IF EXISTS "jogador cria decisao no seu lugar em ronda aberta"     ON public.decisoes;
DROP POLICY IF EXISTS "jogador le decisoes da sua equipa"                     ON public.decisoes;
DROP POLICY IF EXISTS "professor le decisoes das suas competicoes"            ON public.decisoes;
DROP POLICY IF EXISTS "super_admin gere decisoes"                             ON public.decisoes;

CREATE POLICY "decisoes: gerir" ON public.decisoes
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "decisoes: membros leem" ON public.decisoes
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

CREATE POLICY "decisoes: jogador cria no seu lugar" ON public.decisoes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tem_papel('jogador')
    AND public.sou_membro_da_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id)
    AND public.ronda_esta_aberta(ronda_id)
    AND submetido_por = auth.uid()
  );

CREATE POLICY "decisoes: jogador atualiza no seu lugar" ON public.decisoes
  FOR UPDATE TO authenticated
  USING (
    public.tem_papel('jogador')
    AND public.sou_membro_da_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id)
    AND public.ronda_esta_aberta(ronda_id)
  )
  WITH CHECK (
    public.tem_papel('jogador')
    AND public.sou_membro_da_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id)
    AND public.ronda_esta_aberta(ronda_id)
    AND submetido_por = auth.uid()
  );

-- ── acoes_informacao ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar le acoes_info da instituicao"              ON public.acoes_informacao;
DROP POLICY IF EXISTS "jogador atualiza acao_info no seu lugar em ronda aberta" ON public.acoes_informacao;
DROP POLICY IF EXISTS "jogador cria acao_info no seu lugar em ronda aberta"     ON public.acoes_informacao;
DROP POLICY IF EXISTS "jogador le acoes_info da sua equipa"                     ON public.acoes_informacao;
DROP POLICY IF EXISTS "professor le acoes_info das suas competicoes"            ON public.acoes_informacao;
DROP POLICY IF EXISTS "super_admin gere acoes_info"                             ON public.acoes_informacao;

CREATE POLICY "acoes_informacao: gerir" ON public.acoes_informacao
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "acoes_informacao: membros leem" ON public.acoes_informacao
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

CREATE POLICY "acoes_informacao: jogador cria no seu lugar" ON public.acoes_informacao
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tem_papel('jogador')
    AND public.sou_membro_da_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id)
    AND public.ronda_esta_aberta(ronda_id)
    AND criado_por = auth.uid()
  );

CREATE POLICY "acoes_informacao: jogador atualiza no seu lugar" ON public.acoes_informacao
  FOR UPDATE TO authenticated
  USING (
    public.tem_papel('jogador')
    AND public.sou_membro_da_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id)
    AND public.ronda_esta_aberta(ronda_id)
  )
  WITH CHECK (
    public.tem_papel('jogador')
    AND public.sou_membro_da_equipa(equipa_id)
    AND lugar = public.meu_lugar_na_equipa(equipa_id)
    AND public.ronda_esta_aberta(ronda_id)
    AND criado_por = auth.uid()
  );

-- ── estado_empresa ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar le estado_empresa da instituicao"   ON public.estado_empresa;
DROP POLICY IF EXISTS "jogador le estado_empresa da sua equipa"          ON public.estado_empresa;
DROP POLICY IF EXISTS "professor le estado_empresa das suas competicoes" ON public.estado_empresa;
DROP POLICY IF EXISTS "super_admin gere estado_empresa"                  ON public.estado_empresa;

CREATE POLICY "estado_empresa: gerir" ON public.estado_empresa
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "estado_empresa: membros leem" ON public.estado_empresa
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

-- ── colaboradores ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar le colaboradores da instituicao"   ON public.colaboradores;
DROP POLICY IF EXISTS "jogador le colaboradores da sua equipa"          ON public.colaboradores;
DROP POLICY IF EXISTS "professor le colaboradores das suas competicoes" ON public.colaboradores;
DROP POLICY IF EXISTS "super_admin gere colaboradores"                  ON public.colaboradores;

CREATE POLICY "colaboradores: gerir" ON public.colaboradores
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "colaboradores: membros leem" ON public.colaboradores
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

-- ── eventos ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar le eventos da instituicao"   ON public.eventos;
DROP POLICY IF EXISTS "jogador le eventos da sua equipa"          ON public.eventos;
DROP POLICY IF EXISTS "professor le eventos das suas competicoes" ON public.eventos;
DROP POLICY IF EXISTS "super_admin gere eventos"                  ON public.eventos;

CREATE POLICY "eventos: gerir" ON public.eventos
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "eventos: membros leem" ON public.eventos
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

-- ── resultados ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_escolar le resultados da instituicao"   ON public.resultados;
DROP POLICY IF EXISTS "jogador le resultados da sua equipa"          ON public.resultados;
DROP POLICY IF EXISTS "professor le resultados das suas competicoes" ON public.resultados;
DROP POLICY IF EXISTS "super_admin gere resultados"                  ON public.resultados;

CREATE POLICY "resultados: gerir" ON public.resultados
  FOR ALL TO authenticated
  USING (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)))
  WITH CHECK (public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id)));

CREATE POLICY "resultados: membros leem" ON public.resultados
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_equipa(equipa_id));

-- ── competicoes: adicionar leitura para jogadores membros ─────────
DROP POLICY IF EXISTS "jogador le a sua competicao" ON public.competicoes;
CREATE POLICY "jogador le a sua competicao" ON public.competicoes
  FOR SELECT TO authenticated
  USING (public.sou_membro_da_competicao(id));
