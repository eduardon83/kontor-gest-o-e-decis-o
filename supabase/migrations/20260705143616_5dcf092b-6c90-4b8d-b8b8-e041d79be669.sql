
CREATE TYPE public.papel_utilizador AS ENUM ('super_admin', 'admin_escolar', 'professor', 'jogador');

CREATE TABLE public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  papel public.papel_utilizador NOT NULL DEFAULT 'jogador',
  instituicao_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores veem o seu perfil"
  ON public.perfis FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Utilizadores atualizam o seu perfil"
  ON public.perfis FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, papel)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'papel')::public.papel_utilizador, 'jogador')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;

CREATE TRIGGER perfis_set_atualizado_em
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();
