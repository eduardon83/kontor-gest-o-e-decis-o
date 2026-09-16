create table public.moldes_texto (
  id uuid primary key default gen_random_uuid(),
  chave text not null,
  categoria text not null check (categoria in ('cronica','jornal','board','interface')),
  texto text not null,
  variaveis jsonb not null default '[]'::jsonb,
  escopo text not null default 'global' check (escopo in ('global','instituicao','competicao')),
  instituicao_id uuid references public.instituicoes(id) on delete cascade,
  competicao_id uuid references public.competicoes(id) on delete cascade,
  ativo boolean not null default true,
  atualizado_por uuid,
  atualizado_em timestamptz not null default now(),
  constraint moldes_texto_escopo_coerente check (
    (escopo = 'global' and instituicao_id is null and competicao_id is null)
    or (escopo = 'instituicao' and instituicao_id is not null and competicao_id is null)
    or (escopo = 'competicao' and competicao_id is not null and instituicao_id is null)
  )
);

create unique index moldes_texto_unico
  on public.moldes_texto (
    chave,
    escopo,
    coalesce(instituicao_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(competicao_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index moldes_texto_categoria on public.moldes_texto (categoria);

grant select on public.moldes_texto to anon;
grant select, insert, update, delete on public.moldes_texto to authenticated;
grant all on public.moldes_texto to service_role;

alter table public.moldes_texto enable row level security;

create policy "textos legiveis por todos"
  on public.moldes_texto for select to anon, authenticated using (true);

create policy "super admin gere qualquer texto"
  on public.moldes_texto for all to authenticated
  using (public.e_super_admin()) with check (public.e_super_admin());

create policy "admin escolar gere textos da sua instituicao"
  on public.moldes_texto for all to authenticated
  using (escopo = 'instituicao' and public.tem_papel('admin_escolar') and instituicao_id = public.minha_instituicao())
  with check (escopo = 'instituicao' and public.tem_papel('admin_escolar') and instituicao_id = public.minha_instituicao());

create policy "gestor da competicao gere textos da competicao"
  on public.moldes_texto for all to authenticated
  using (escopo = 'competicao' and public.pode_gerir_competicao(competicao_id))
  with check (escopo = 'competicao' and public.pode_gerir_competicao(competicao_id));

create trigger moldes_texto_atualizado_em
  before update on public.moldes_texto
  for each row execute function public.set_atualizado_em();