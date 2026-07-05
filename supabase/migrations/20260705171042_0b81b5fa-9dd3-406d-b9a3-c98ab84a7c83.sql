
ALTER TABLE public.membros_equipa
  ADD COLUMN IF NOT EXISTS email_convite text;

ALTER TABLE public.membros_equipa
  DROP CONSTRAINT IF EXISTS membros_equipa_pkey;

ALTER TABLE public.membros_equipa
  ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS membros_equipa_equipa_lugar_uk
  ON public.membros_equipa (equipa_id, lugar);

ALTER TABLE public.membros_equipa
  ADD CONSTRAINT membros_equipa_pkey PRIMARY KEY USING INDEX membros_equipa_equipa_lugar_uk;

CREATE UNIQUE INDEX IF NOT EXISTS membros_equipa_equipa_user_uk
  ON public.membros_equipa (equipa_id, user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS membros_equipa_email_convite_idx
  ON public.membros_equipa (lower(email_convite)) WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION public.e_membro_equipa(_equipa uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros_equipa
     WHERE equipa_id = _equipa
       AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.reclamar_convites_por_email()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  meu_email text;
  linhas integer;
BEGIN
  SELECT lower(email) INTO meu_email FROM public.perfis WHERE id = auth.uid();
  IF meu_email IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.membros_equipa me
     SET user_id = auth.uid()
   WHERE me.user_id IS NULL
     AND lower(me.email_convite) = meu_email
     AND NOT EXISTS (
       SELECT 1 FROM public.membros_equipa me2
        WHERE me2.equipa_id = me.equipa_id
          AND me2.user_id = auth.uid()
     );
  GET DIAGNOSTICS linhas = ROW_COUNT;
  RETURN linhas;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reclamar_convites_por_email() TO authenticated;
