-- Promover conta de teste a super_admin (ajustar email se necessário)
UPDATE public.perfis
   SET papel = 'super_admin'
 WHERE lower(email) = lower('edmnns@gmail.com');