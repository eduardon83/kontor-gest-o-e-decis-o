import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ============================================================
 * CARREGAR DADOS DO CHRO (representante do turno + pool de candidatos)
 * Chama a Edge Function gerar_candidatos com service role para obter os
 * dados determinísticos (a competição.seed não é lida pelo cliente).
 * ============================================================ */
export const carregarChro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      equipa_id: z.string().uuid(),
      ronda_id: z.string().uuid(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    // Garante que o utilizador é membro da equipa OU dono da competição
    // (professor em modo condução) OU admin_escolar / super_admin.
    const { supabase, userId } = context;
    const { data: mem } = await supabase
      .from("membros_equipa").select("lugar")
      .eq("equipa_id", data.equipa_id).eq("user_id", userId).maybeSingle();
    if (!mem) {
      const { data: perfil } = await supabase
        .from("perfis").select("papel").eq("id", userId).maybeSingle();
      const papel = perfil?.papel;
      if (papel !== "super_admin" && papel !== "admin_escolar") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: eq } = await supabaseAdmin
          .from("equipas")
          .select("mercados!inner(competicoes!inner(criado_por))")
          .eq("id", data.equipa_id)
          .maybeSingle();
        const dono = (eq as any)?.mercados?.competicoes?.criado_por;
        if (dono !== userId) throw new Error("Sem autorização sobre esta equipa.");
      }
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Configuração de servidor em falta.");

    const res = await fetch(`${url}/functions/v1/gerar_candidatos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "content-type": "application/json",
      },
      body: JSON.stringify({ equipa_id: data.equipa_id, ronda_id: data.ronda_id }),
    });
    const body = await res.json();
    if (!res.ok || !body?.ok) throw new Error(body?.error ?? "Falha a carregar candidatos.");
    return {
      candidatos: body.candidatos as Array<{
        id: string;
        arquetipo: string;
        avatar_variante: 1 | 2;
        atributos: Record<string, number>;
        salario_mensal_pedido: number;
        salario_mult: number;
        pistas: string[];
        nota: string | null;
      }>,
      representante_id: (body.representante_id ?? null) as string | null,
    };
  });
