
CREATE TABLE IF NOT EXISTS public.pedidos_docente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text,
  instituicao text,
  mensagem text,
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','aprovado','rejeitado')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  decidido_em timestamptz,
  decidido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_docente_pendente_unico
  ON public.pedidos_docente (user_id) WHERE estado = 'pendente';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_docente TO authenticated;
GRANT ALL ON public.pedidos_docente TO service_role;

ALTER TABLE public.pedidos_docente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.pedidos_docente
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_insert" ON public.pedidos_docente
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
