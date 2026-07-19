-- Revoke EXECUTE from anon on all SECURITY DEFINER helpers.
-- All app tables require authentication; no policy is evaluated as anon,
-- so anon has no legitimate reason to call these RLS helper functions.
REVOKE EXECUTE ON FUNCTION public.meu_lugar_na_equipa(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.e_membro_equipa(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ronda_esta_aberta(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.competicao_da_equipa(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.instituicao_da_equipa(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.tem_papel(public.papel_utilizador) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.minha_instituicao() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.professor_da_competicao(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reclamar_convites_por_email() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.e_super_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.pode_gerir_competicao(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.competicao_do_mercado(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sou_membro_da_equipa(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sou_membro_do_mercado(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sou_membro_da_competicao(uuid) FROM anon, public;

-- Ensure authenticated retains EXECUTE (needed for RLS policies that call these helpers).
GRANT EXECUTE ON FUNCTION public.meu_lugar_na_equipa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.e_membro_equipa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ronda_esta_aberta(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.competicao_da_equipa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.instituicao_da_equipa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tem_papel(public.papel_utilizador) TO authenticated;
GRANT EXECUTE ON FUNCTION public.minha_instituicao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.professor_da_competicao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reclamar_convites_por_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.e_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_gerir_competicao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.competicao_do_mercado(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sou_membro_da_equipa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sou_membro_do_mercado(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sou_membro_da_competicao(uuid) TO authenticated;

-- Add an explicit no-op deny policy on economia_seed to document the intent:
-- only the service role (used by resolver / gerador de economia) may read/write this table.
-- The table already had RLS enabled with no policies; this makes the intent auditable.
COMMENT ON TABLE public.economia_seed IS 'Dados económicos ocultos da competição. Acesso exclusivo ao service_role (Edge Functions resolver_ronda e gerar_economia). Nenhuma policy — fail-closed para anon/authenticated por desenho.';