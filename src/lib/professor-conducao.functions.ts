// Servidor — funções específicas do MODO CONDUÇÃO do professor.
// O professor não é membro das equipas: toda a autorização passa pela POSSE
// da competição (competicoes.criado_por) ou por admin_escolar / super_admin.
// A escrita de decisões usa o cliente service-role, marcando submetido_por = professor.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LUGARES = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;

async function assertPodeConduzir(
  supabase: any,
  userId: string,
  competicao_id: string,
): Promise<void> {
  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel, instituicao_id")
    .eq("id", userId)
    .maybeSingle();
  if (!perfil) throw new Error("Perfil não encontrado.");
  if (perfil.papel === "super_admin") return;

  const { data: comp } = await supabase
    .from("competicoes")
    .select("criado_por, instituicao_id")
    .eq("id", competicao_id)
    .maybeSingle();
  if (!comp) throw new Error("Competição não encontrada.");

  // admin_escolar pode conduzir qualquer competição da SUA instituição.
  if (perfil.papel === "admin_escolar") {
    if (perfil.instituicao_id && comp.instituicao_id === perfil.instituicao_id) return;
    throw new Error("Sem autorização: competição fora da sua instituição.");
  }
  if (comp.criado_por !== userId) {
    throw new Error("Sem autorização para conduzir esta competição.");
  }
}

async function assertEquipaDaCompeticao(
  supabaseAdmin: any,
  equipa_id: string,
  competicao_id: string,
): Promise<void> {
  const { data: eq } = await supabaseAdmin
    .from("equipas")
    .select("id, mercados!inner(competicao_id)")
    .eq("id", equipa_id)
    .maybeSingle();
  const compIdDaEquipa = (eq as any)?.mercados?.competicao_id;
  if (!eq || compIdDaEquipa !== competicao_id) {
    throw new Error("Equipa não pertence a esta competição.");
  }
}

async function assertRondaAbertaDaCompeticao(
  supabaseAdmin: any,
  ronda_id: string,
  competicao_id: string,
): Promise<void> {
  const { data: r } = await supabaseAdmin
    .from("rondas")
    .select("id, estado, competicao_id")
    .eq("id", ronda_id)
    .maybeSingle();
  if (!r || r.competicao_id !== competicao_id) {
    throw new Error("Ronda não pertence a esta competição.");
  }
  if (r.estado !== "aberta") {
    throw new Error("A ronda já não está aberta.");
  }
}

/* ============================================================
 * SUBMETER DECISÃO COMO CONDUTOR
 * ============================================================ */
export const submeterDecisaoComoCondutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        competicao_id: z.string().uuid(),
        equipa_id: z.string().uuid(),
        ronda_id: z.string().uuid(),
        lugar: z.enum(LUGARES),
        payload: z.record(z.string(), z.unknown()),
        submeter: z.boolean().default(true),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertPodeConduzir(supabase, userId, data.competicao_id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertEquipaDaCompeticao(supabaseAdmin, data.equipa_id, data.competicao_id);
    await assertRondaAbertaDaCompeticao(supabaseAdmin, data.ronda_id, data.competicao_id);

    const linha = {
      ronda_id: data.ronda_id,
      equipa_id: data.equipa_id,
      lugar: data.lugar,
      payload: data.payload as never,
      submetido_por: userId,
      submetido_em: data.submeter ? new Date().toISOString() : null,
    };
    const { error } = await supabaseAdmin
      .from("decisoes")
      .upsert(linha, { onConflict: "ronda_id,equipa_id,lugar" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * RESOLVER TURNO COMO PROFESSOR
 * Alias explícito para o modo condução — obtém a ronda 'aberta' da
 * competição e invoca a Edge Function `resolver_ronda` com service-role.
 * ============================================================ */
export const resolverTurnoComoProfessor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ competicao_id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertPodeConduzir(supabase, userId, data.competicao_id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotente: se ainda não há economia_seed, gera-a antes de resolver.
    const { data: seedExistente } = await supabaseAdmin
      .from("economia_seed").select("competicao_id").eq("competicao_id", data.competicao_id).maybeSingle();
    if (!seedExistente) {
      const url0 = process.env.SUPABASE_URL!;
      const key0 = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const rge = await fetch(`${url0}/functions/v1/gerar_economia`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key0}`, apikey: key0, "content-type": "application/json" },
        body: JSON.stringify({ competicao_id: data.competicao_id }),
      });
      const bge = await rge.json().catch(() => ({}));
      if (!rge.ok || bge?.ok === false) {
        throw new Error(bge?.error ?? `gerar_economia falhou (${rge.status}).`);
      }
    }

    const { data: ronda } = await supabaseAdmin
      .from("rondas")
      .select("id, indice, estado")
      .eq("competicao_id", data.competicao_id)
      .eq("estado", "aberta")
      .order("indice", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!ronda) throw new Error("Não há ronda aberta.");

    const url = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resp = await fetch(`${url}/functions/v1/resolver_ronda`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ronda_id: ronda.id }),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok || body?.ok === false) {
      throw new Error(body?.error ?? `Falha no resolver (${resp.status})`);
    }
    return { ok: true, ronda_id: ronda.id, indice: ronda.indice, resposta: body };
  });

/* ============================================================
 * LISTAR EQUIPAS DA COMPETIÇÃO (para o seletor "Conduzir")
 * ============================================================ */
export const equipasDaCompeticao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ competicao_id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertPodeConduzir(supabase, userId, data.competicao_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mercados } = await supabaseAdmin
      .from("mercados")
      .select("id")
      .eq("competicao_id", data.competicao_id);
    const mIds = ((mercados ?? []) as any[]).map((m) => m.id);
    if (mIds.length === 0) return { equipas: [] as Array<{ id: string; nome: string; is_ia: boolean }> };
    const { data: equipas } = await supabaseAdmin
      .from("equipas")
      .select("id, nome, is_ia, mercado_id")
      .in("mercado_id", mIds)
      .order("nome");
    return {
      equipas: ((equipas ?? []) as any[]).map((e) => ({
        id: e.id as string,
        nome: (e.nome as string) ?? "Equipa",
        is_ia: !!e.is_ia,
      })),
    };
  });
