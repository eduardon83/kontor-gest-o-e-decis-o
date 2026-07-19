
ALTER TABLE public.colaboradores DROP CONSTRAINT IF EXISTS colaboradores_arquetipo_check;
UPDATE public.colaboradores SET arquetipo = lower(arquetipo) WHERE arquetipo <> lower(arquetipo);
ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_arquetipo_check
  CHECK (arquetipo = ANY (ARRAY['veterano','talento','esteio','inquieto','aprendiz']));
