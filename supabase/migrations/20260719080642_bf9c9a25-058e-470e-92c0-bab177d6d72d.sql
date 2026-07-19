
-- 1. Instituição ESS - P.Porto (idempotente)
INSERT INTO public.instituicoes (nome)
SELECT 'Escola Superior de Saúde — P.Porto'
WHERE NOT EXISTS (
  SELECT 1 FROM public.instituicoes WHERE nome = 'Escola Superior de Saúde — P.Porto'
);

-- 2. Tabela de convites de papel (pré-provisionamento por email)
CREATE TABLE IF NOT EXISTS public.convites_papel (
  email text PRIMARY KEY,
  papel public.papel_utilizador NOT NULL,
  instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  usado_em timestamptz,
  usado_por uuid,
  CONSTRAINT convites_email_lower CHECK (email = lower(email))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites_papel TO authenticated;
GRANT ALL ON public.convites_papel TO service_role;

ALTER TABLE public.convites_papel ENABLE ROW LEVEL SECURITY;

-- Política super_admin
DROP POLICY IF EXISTS "super_admin gere convites" ON public.convites_papel;
CREATE POLICY "super_admin gere convites" ON public.convites_papel
  FOR ALL TO authenticated
  USING (public.tem_papel('super_admin'))
  WITH CHECK (public.tem_papel('super_admin'));

-- Admin escolar: apenas convites da sua instituição, e não pode conceder super_admin
DROP POLICY IF EXISTS "admin_escolar le convites da instituicao" ON public.convites_papel;
CREATE POLICY "admin_escolar le convites da instituicao" ON public.convites_papel
  FOR SELECT TO authenticated
  USING (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao());

DROP POLICY IF EXISTS "admin_escolar cria convites na instituicao" ON public.convites_papel;
CREATE POLICY "admin_escolar cria convites na instituicao" ON public.convites_papel
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tem_papel('admin_escolar')
    AND papel IN ('jogador','professor','admin_escolar')
    AND instituicao_id = public.minha_instituicao()
  );

DROP POLICY IF EXISTS "admin_escolar apaga convites da instituicao" ON public.convites_papel;
CREATE POLICY "admin_escolar apaga convites da instituicao" ON public.convites_papel
  FOR DELETE TO authenticated
  USING (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao());

DROP POLICY IF EXISTS "admin_escolar atualiza convites da instituicao" ON public.convites_papel;
CREATE POLICY "admin_escolar atualiza convites da instituicao" ON public.convites_papel
  FOR UPDATE TO authenticated
  USING (public.tem_papel('admin_escolar') AND instituicao_id = public.minha_instituicao())
  WITH CHECK (
    public.tem_papel('admin_escolar')
    AND papel IN ('jogador','professor','admin_escolar')
    AND instituicao_id = public.minha_instituicao()
  );

-- 3. Trigger handle_new_user actualizado — consome convite se existir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(NEW.email);
  v_papel public.papel_utilizador;
  v_inst uuid;
BEGIN
  SELECT c.papel, c.instituicao_id INTO v_papel, v_inst
    FROM public.convites_papel c
    WHERE c.email = v_email AND c.usado_em IS NULL
    LIMIT 1;

  IF NOT FOUND THEN
    v_papel := COALESCE((NEW.raw_user_meta_data ->> 'papel')::public.papel_utilizador, 'jogador');
    v_inst := NULL;
  END IF;

  INSERT INTO public.perfis (id, nome, email, papel, instituicao_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', ''),
    NEW.email,
    v_papel,
    v_inst
  );

  UPDATE public.convites_papel
    SET usado_em = now(), usado_por = NEW.id
    WHERE email = v_email AND usado_em IS NULL;

  RETURN NEW;
END;
$$;

-- 4. Convite para Henrique Curado (idempotente)
INSERT INTO public.convites_papel (email, papel, instituicao_id)
SELECT 'hcurado@ess.ipp.pt', 'admin_escolar'::public.papel_utilizador, i.id
FROM public.instituicoes i
WHERE i.nome = 'Escola Superior de Saúde — P.Porto'
ON CONFLICT (email) DO UPDATE SET
  papel = EXCLUDED.papel,
  instituicao_id = EXCLUDED.instituicao_id,
  usado_em = NULL,
  usado_por = NULL;

-- 5. Aplicar convites a utilizadores já existentes (retroactivo)
UPDATE public.perfis p
   SET papel = c.papel,
       instituicao_id = COALESCE(c.instituicao_id, p.instituicao_id)
  FROM public.convites_papel c
 WHERE lower(p.email) = c.email
   AND c.usado_em IS NULL;

UPDATE public.convites_papel c
   SET usado_em = now(), usado_por = p.id
  FROM public.perfis p
 WHERE lower(p.email) = c.email
   AND c.usado_em IS NULL;
