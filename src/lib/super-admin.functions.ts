import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function garantirSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("perfis").select("papel").eq("id", userId).maybeSingle();
  if (!data || data.papel !== "super_admin") throw new Error("Sem autorização.");
}

/* --------- Instituições --------- */

export const listarInstituicoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirSuperAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("instituicoes")
      .select("id, nome, tema, criado_em")
      .order("nome", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarInstituicao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ nome: z.string().trim().min(1).max(160) }).parse(raw))
  .handler(async ({ data, context }) => {
    await garantirSuperAdmin(context.supabase, context.userId);
    const { data: inst, error } = await context.supabase
      .from("instituicoes")
      .insert({ nome: data.nome, tema: {} as never })
      .select("id, nome")
      .single();
    if (error) throw new Error(error.message);
    return inst;
  });

export const atualizarNomeInstituicao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), nome: z.string().trim().min(1).max(160) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await garantirSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("instituicoes").update({ nome: data.nome }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------- Competições (para tema/industria) --------- */

export const listarCompeticoesSuperAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirSuperAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("competicoes")
      .select("id, nome, industria, instituicao_id, tema, estado, criado_em")
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* --------- Log de auditoria --------- */

export const listarLogAuditoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        competicao_id: z.string().uuid().optional(),
        equipa_id: z.string().uuid().optional(),
        limite: z.number().int().min(1).max(500).default(100),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await garantirSuperAdmin(context.supabase, context.userId);
    let q = context.supabase
      .from("log_auditoria")
      .select("id, acao, alvo, payload, ts, ator_user_id")
      .order("ts", { ascending: false })
      .limit(data.limite);
    if (data.competicao_id) q = q.contains("payload", { competicao_id: data.competicao_id });
    if (data.equipa_id) q = q.contains("payload", { equipa_id: data.equipa_id });
    const { data: linhas, error } = await q;
    if (error) throw new Error(error.message);
    return linhas ?? [];
  });
