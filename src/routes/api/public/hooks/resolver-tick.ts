// Agendador — pg_cron chama este endpoint (ex.: a cada minuto).
// Percorre `rondas` com estado='aberta' e prazo_em <= now() e invoca
// resolver_ronda via service-role no servidor. Nunca expõe o service key.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/resolver-tick")({
  server: {
    handlers: {
      POST: async ({ request: _request }) => {
        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
          return json({ ok: false, error: "SUPABASE env em falta" }, 500);
        }

        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const agora = new Date().toISOString();
        const { data: rondas, error } = await sb
          .from("rondas")
          .select("id, prazo_em, indice, competicao_id")
          .eq("estado", "aberta")
          .not("prazo_em", "is", null)
          .lte("prazo_em", agora)
          .limit(20);
        if (error) return json({ ok: false, error: error.message }, 500);

        const resultados: { ronda_id: string; ok: boolean; erro?: string }[] = [];
        for (const r of rondas ?? []) {
          try {
            const resp = await fetch(`${url}/functions/v1/resolver_ronda`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${serviceKey}`,
                "apikey": serviceKey,
                "content-type": "application/json",
              },
              body: JSON.stringify({ ronda_id: r.id }),
            });
            const body = await resp.json().catch(() => ({}));
            resultados.push({ ronda_id: r.id, ok: resp.ok && body?.ok !== false, erro: body?.error });
          } catch (e) {
            resultados.push({ ronda_id: r.id, ok: false, erro: (e as Error).message });
          }
        }

        return json({ ok: true, processadas: resultados.length, resultados });
      },
    },
  },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
