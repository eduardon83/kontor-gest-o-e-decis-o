
ALTER FUNCTION public.set_atualizado_em() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_atualizado_em() FROM PUBLIC, anon, authenticated;
