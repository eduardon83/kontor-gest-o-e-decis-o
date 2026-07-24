
-- 1) colaboradores: campos narrativos
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS entrou_ronda int,
  ADD COLUMN IF NOT EXISTS promocoes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_promocao_ronda int,
  ADD COLUMN IF NOT EXISTS competencia_inicial numeric;

-- preencher para existentes
UPDATE public.colaboradores
   SET entrou_ronda = COALESCE(entrou_ronda, 1),
       competencia_inicial = COALESCE(competencia_inicial, competencia)
 WHERE entrou_ronda IS NULL OR competencia_inicial IS NULL;

-- 2) cronica_entradas
CREATE TABLE IF NOT EXISTS public.cronica_entradas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipa_id uuid NOT NULL REFERENCES public.equipas(id) ON DELETE CASCADE,
  ronda_id uuid REFERENCES public.rondas(id) ON DELETE SET NULL,
  indice_turno int NOT NULL,
  tipo text NOT NULL,
  texto text NOT NULL,
  destaque boolean NOT NULL DEFAULT false,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cronica_entradas_equipa_turno_idx
  ON public.cronica_entradas(equipa_id, indice_turno);

GRANT SELECT ON public.cronica_entradas TO authenticated;
GRANT ALL ON public.cronica_entradas TO service_role;

ALTER TABLE public.cronica_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler crónica: equipa e docente"
  ON public.cronica_entradas
  FOR SELECT
  TO authenticated
  USING (
    public.sou_membro_da_equipa(equipa_id)
    OR public.pode_gerir_competicao(public.competicao_da_equipa(equipa_id))
  );
