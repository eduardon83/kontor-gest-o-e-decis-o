import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LUGARES = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;

async function assertProfessorOwnsOrAdmin(supabase: any, userId: string, competicao_id: string) {
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
  if (perfil.papel === "admin_escolar") {
    if (perfil.instituicao_id && comp.instituicao_id === perfil.instituicao_id) return;
    throw new Error("Sem autorização: competição fora da sua instituição.");
  }
  if (comp.criado_por !== userId) throw new Error("Sem autorização para esta competição.");
}

// ─── Resultados ─────────────────────────────────────────────────────────────
export const resultadosCompeticao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    competicao_id: z.string().uuid(),
    visao: z.enum(["professor", "jogador"]).default("professor"),
    equipa_id: z.string().uuid().optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.visao === "professor") {
      await assertProfessorOwnsOrAdmin(supabase, userId, data.competicao_id);
    } else if (data.equipa_id) {
      // Verifica que é membro
      const { data: mem } = await supabase.from("membros_equipa")
        .select("equipa_id").eq("equipa_id", data.equipa_id).eq("user_id", userId).maybeSingle();
      if (!mem) throw new Error("Não pertence a esta equipa.");
    }

    const { data: comp } = await supabase.from("competicoes")
      .select("id, nome, duracao_turnos").eq("id", data.competicao_id).maybeSingle();
    if (!comp) throw new Error("Competição não encontrada.");

    const { data: mercados } = await supabase.from("mercados")
      .select("id, nome").eq("competicao_id", data.competicao_id).order("nome");
    const mercadoIds = (mercados ?? []).map((m: any) => m.id);
    if (mercadoIds.length === 0) {
      return { competicao: comp, mercados: [], rondas: [] };
    }

    const { data: equipas } = await supabase.from("equipas")
      .select("id, nome, is_ia, mercado_id").in("mercado_id", mercadoIds);

    const { data: rondas } = await supabase.from("rondas")
      .select("id, indice, estado, prazo_em").eq("competicao_id", data.competicao_id).order("indice");

    const rondaIds = (rondas ?? []).map((r: any) => r.id);
    const { data: resultados } = rondaIds.length
      ? await supabase.from("resultados")
          .select("equipa_id, ronda_id, valor, posicao").in("ronda_id", rondaIds)
      : { data: [] };

    // snapshots: professor vê todos; jogador vê apenas os da própria equipa
    const equipasVisiveisSnap = data.visao === "professor"
      ? (equipas ?? []).map((e: any) => e.id)
      : (data.equipa_id ? [data.equipa_id] : []);
    const { data: snapshots } = rondaIds.length && equipasVisiveisSnap.length
      ? await supabase.from("estado_empresa")
          .select("equipa_id, ronda_id, snapshot")
          .in("ronda_id", rondaIds).in("equipa_id", equipasVisiveisSnap)
      : { data: [] };

    return {
      competicao: comp,
      mercados: mercados ?? [],
      equipas: equipas ?? [],
      rondas: rondas ?? [],
      resultados: resultados ?? [],
      snapshots: snapshots ?? [],
    };
  });

// ─── Submissões (professor) ─────────────────────────────────────────────────
export const submissoesRondaAtual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ competicao_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProfessorOwnsOrAdmin(supabase, userId, data.competicao_id);

    const { data: ronda } = await supabase.from("rondas")
      .select("id, indice, prazo_em, estado")
      .eq("competicao_id", data.competicao_id).eq("estado", "aberta")
      .order("indice", { ascending: false }).limit(1).maybeSingle();
    if (!ronda) return { ronda: null, equipas: [] };

    const { data: mercados } = await supabase.from("mercados")
      .select("id").eq("competicao_id", data.competicao_id);
    const mIds = (mercados ?? []).map((m: any) => m.id);
    const { data: equipas } = mIds.length
      ? await supabase.from("equipas").select("id, nome, is_ia, mercado_id").in("mercado_id", mIds)
      : { data: [] };

    const { data: decs } = await supabase.from("decisoes")
      .select("equipa_id, lugar, submetido_em").eq("ronda_id", ronda.id);

    const porEquipa = new Map<string, Record<string, boolean>>();
    for (const eq of equipas ?? []) porEquipa.set(eq.id, {});
    for (const d of decs ?? []) {
      const m = porEquipa.get(d.equipa_id) ?? {};
      m[d.lugar] = !!d.submetido_em;
      porEquipa.set(d.equipa_id, m);
    }
    return {
      ronda,
      equipas: (equipas ?? []).map((e: any) => ({
        ...e,
        submissoes: Object.fromEntries(LUGARES.map((l) => [l, porEquipa.get(e.id)?.[l] ?? false])),
        completo: LUGARES.every((l) => porEquipa.get(e.id)?.[l]) || e.is_ia,
      })),
    };
  });

// ─── Garantir economia (idempotente) ───────────────────────────────────────
async function invocarGerarEconomia(competicao_id: string): Promise<{ ok: boolean; body: any; status: number }> {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const resp = await fetch(`${url}/functions/v1/gerar_economia`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "apikey": serviceKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ competicao_id }),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok && body?.ok !== false, body, status: resp.status };
}

async function garantirEconomia(supabaseAdmin: any, competicao_id: string): Promise<void> {
  const { data: existe } = await supabaseAdmin
    .from("economia_seed").select("competicao_id").eq("competicao_id", competicao_id).maybeSingle();
  if (existe) return;
  const r = await invocarGerarEconomia(competicao_id);
  if (!r.ok) throw new Error(r.body?.error ?? `gerar_economia falhou (${r.status}).`);
}

// ─── Avançar turno agora (invoca Edge Function) ────────────────────────────
export const avancarRondaAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ competicao_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProfessorOwnsOrAdmin(supabase, userId, data.competicao_id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await garantirEconomia(supabaseAdmin, data.competicao_id);

    const { data: ronda } = await supabase.from("rondas")
      .select("id, indice, estado")
      .eq("competicao_id", data.competicao_id).eq("estado", "aberta")
      .order("indice", { ascending: false }).limit(1).maybeSingle();
    if (!ronda) throw new Error("Não há ronda aberta.");

    const url = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resp = await fetch(`${url}/functions/v1/resolver_ronda`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
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

// ─── Regenerar / diagnosticar economia (botão do professor) ────────────────
export const regenerarEconomia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ competicao_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProfessorOwnsOrAdmin(supabase, userId, data.competicao_id);
    const r = await invocarGerarEconomia(data.competicao_id);
    if (!r.ok) throw new Error(r.body?.error ?? `gerar_economia falhou (${r.status}).`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: seed } = await supabaseAdmin
      .from("economia_seed").select("competicao_id").eq("competicao_id", data.competicao_id).maybeSingle();
    const { data: mercados } = await supabaseAdmin
      .from("mercados").select("id").eq("competicao_id", data.competicao_id);
    const mIds = ((mercados ?? []) as any[]).map((m) => m.id);
    let nCol = 0;
    if (mIds.length) {
      const { data: eqs } = await supabaseAdmin
        .from("equipas").select("id").in("mercado_id", mIds);
      const eqIds = ((eqs ?? []) as any[]).map((e) => e.id);
      if (eqIds.length) {
        const { count } = await supabaseAdmin
          .from("colaboradores").select("*", { count: "exact", head: true }).in("equipa_id", eqIds);
        nCol = count ?? 0;
      }
    }
    return {
      ok: true,
      ja_gerada: r.body?.ja_gerada === true,
      seed_presente: !!seed,
      colaboradores: nCol,
      resposta: r.body,
    };
  });

// ─── Eliminar competição (apenas dono ou admin da instituição) ─────────────
export const eliminarCompeticao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    competicao_id: z.string().uuid(),
    confirmar_nome: z.string().min(1),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProfessorOwnsOrAdmin(supabase, userId, data.competicao_id);

    const { data: comp } = await supabase.from("competicoes")
      .select("id, nome").eq("id", data.competicao_id).maybeSingle();
    if (!comp) throw new Error("Competição não encontrada.");
    if (comp.nome.trim().toLowerCase() !== data.confirmar_nome.trim().toLowerCase()) {
      throw new Error("Nome de confirmação não coincide com o nome da Hansa.");
    }

    // Elimina via admin — a cascata trata de mercados/equipas/rondas/snapshots/etc.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("competicoes").delete().eq("id", data.competicao_id);
    if (error) throw new Error(error.message);
    return { ok: true, nome: comp.nome };
  });


