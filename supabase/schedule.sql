-- Agendador do motor Kontor (por aplicar quando quiseres ligar o relógio).
-- Corre este SQL uma única vez em Lovable Cloud → SQL:
--
--   1. Extensões necessárias.
--   2. Job pg_cron: a cada minuto, chama o endpoint /api/public/hooks/resolver-tick,
--      que scana rondas com prazo_em <= now() e invoca resolver_ronda por cada uma.
--
-- Substitui:
--   <URL_APP>   pela URL estável do projeto (ex.: project--<id>.lovable.app)
--   <ANON_KEY>  pela chave publishable do projeto (VITE_SUPABASE_PUBLISHABLE_KEY)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'kontor-resolver-tick',
  '* * * * *', -- a cada minuto
  $$
  SELECT net.http_post(
    url := 'https://<URL_APP>/api/public/hooks/resolver-tick',
    headers := '{"content-type": "application/json", "apikey": "<ANON_KEY>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
