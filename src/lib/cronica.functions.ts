import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Assegura que o utilizador é membro da equipa OU dono/admin da competição.
async function assertAcessoEquipa(supabase: any, userId: string, equipa_id: string) {
  const { data: mem } = await supabase.from("membros_equipa")
    .select("equipa_id").eq("equipa_id", equipa_id).eq("user_id", userId).maybeSingle();
  if (mem) return;
  const { data: eq } = await supabase.from("equipas")
    .select("mercado_id, mercados!inner(competicao_id, competicoes!inner(criado_por, instituicao_id))")
    .eq("id", equipa_id).maybeSingle();
  const comp = (eq as any)?.mercados?.competicoes;
  if (!comp) throw new Error("Equipa não encontrada.");
  if (comp.criado_por === userId) return;
  const { data: perfil } = await supabase.from("perfis").select("papel, instituicao_id").eq("id", userId).maybeSingle();
  if (perfil?.papel === "super_admin") return;
  if (perfil?.papel === "admin_escolar" && perfil.instituicao_id && perfil.instituicao_id === comp.instituicao_id) return;
  throw new Error("Sem acesso a esta equipa.");
}

export const listarCronica = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ equipa_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAcessoEquipa(supabase, userId, data.equipa_id);
    const { data: entradas } = await supabase.from("cronica_entradas")
      .select("id, indice_turno, tipo, texto, destaque, dados, criado_em")
      .eq("equipa_id", data.equipa_id)
      .order("indice_turno", { ascending: true })
      .order("criado_em", { ascending: true });
    return { entradas: entradas ?? [] };
  });

export const listarAtas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ equipa_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAcessoEquipa(supabase, userId, data.equipa_id);

    // Rondas resolvidas da competição a que a equipa pertence.
    const { data: eq } = await supabase.from("equipas")
      .select("mercado_id, mercados!inner(competicao_id)").eq("id", data.equipa_id).maybeSingle();
    const competicao_id = (eq as any)?.mercados?.competicao_id;
    if (!competicao_id) return { rondas: [] };

    const { data: rondas } = await supabase.from("rondas")
      .select("id, indice, estado").eq("competicao_id", competicao_id).order("indice");
    const rondaIds = (rondas ?? []).map((r: any) => r.id);
    if (!rondaIds.length) return { rondas: [] };

    const { data: decs } = await supabase.from("decisoes")
      .select("ronda_id, lugar, payload, submetido_em").eq("equipa_id", data.equipa_id).in("ronda_id", rondaIds);

    const { data: audit } = await supabase.from("log_auditoria")
      .select("acao, payload, criado_em").eq("alvo", data.equipa_id)
      .order("criado_em", { ascending: true });

    const auditPorRonda = new Map<string, Array<{ acao: string; payload: any }>>();
    for (const a of (audit ?? []) as any[]) {
      const rid = a?.payload?.ronda_id as string | undefined;
      if (!rid) continue;
      const arr = auditPorRonda.get(rid) ?? [];
      arr.push({ acao: a.acao, payload: a.payload });
      auditPorRonda.set(rid, arr);
    }

    const decPorRonda = new Map<string, any[]>();
    for (const d of (decs ?? []) as any[]) {
      const arr = decPorRonda.get(d.ronda_id) ?? [];
      arr.push(d);
      decPorRonda.set(d.ronda_id, arr);
    }

    return {
      rondas: (rondas ?? []).map((r: any) => ({
        id: r.id, indice: r.indice, estado: r.estado,
        decisoes: decPorRonda.get(r.id) ?? [],
        auditoria: auditPorRonda.get(r.id) ?? [],
      })),
    };
  });
