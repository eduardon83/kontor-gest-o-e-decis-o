
REVOKE EXECUTE ON FUNCTION public.tem_papel(public.papel_utilizador) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.minha_instituicao() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.professor_da_competicao(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.e_membro_equipa(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.meu_lugar_na_equipa(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.competicao_da_equipa(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.instituicao_da_equipa(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ronda_esta_aberta(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.tem_papel(public.papel_utilizador) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.minha_instituicao() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.professor_da_competicao(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.e_membro_equipa(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.meu_lugar_na_equipa(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.competicao_da_equipa(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.instituicao_da_equipa(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ronda_esta_aberta(uuid) TO authenticated, service_role;
