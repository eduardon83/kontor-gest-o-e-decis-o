import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function minhaInstituicao(supabase: any, userId: string) {
  const { data } = await supabase.from("perfis").select("papel, instituicao_id").eq("id", userId).maybeSingle();
  if (!data) throw new Error("Perfil não encontrado.");
  if (data.papel !== "admin_escolar" && data.papel !== "super_admin") throw new Error("Sem autorização.");
  if (!data.instituicao_id && data.papel !== "super_admin") throw new Error("Sem instituição associada.");
  return { instituicao_id: data.instituicao_id as string | null, papel: data.papel as string };
}

export const listarUtilizadoresInstituicao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { instituicao_id } = await minhaInstituicao(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("perfis").select("id, nome, email, papel, criado_em").order("criado_em", { ascending: false });
    if (instituicao_id) q = q.eq("instituicao_id", instituicao_id);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const alterarPapelUtilizador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        papel: z.enum(["jogador", "professor", "admin_escolar"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { instituicao_id, papel } = await minhaInstituicao(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Garante que o utilizador alvo pertence à minha instituição (excepto super_admin).
    if (papel !== "super_admin") {
      const { data: alvo } = await supabaseAdmin.from("perfis").select("instituicao_id").eq("id", data.user_id).maybeSingle();
      if (!alvo || alvo.instituicao_id !== instituicao_id) throw new Error("Utilizador fora da sua instituição.");
    }
    const { error } = await supabaseAdmin.from("perfis").update({ papel: data.papel as never }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarCompeticoesInstituicao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { instituicao_id, papel } = await minhaInstituicao(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("competicoes")
      .select("id, nome, ambito, industria, estado, criado_em, criado_por")
      .order("criado_em", { ascending: false });
    if (papel !== "super_admin" && instituicao_id) q = q.eq("instituicao_id", instituicao_id);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const metricasInstituicao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { instituicao_id } = await minhaInstituicao(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: nUtilizadores }, { count: nCompeticoes }] = await Promise.all([
      supabaseAdmin.from("perfis").select("id", { count: "exact", head: true }).eq("instituicao_id", instituicao_id ?? ""),
      supabaseAdmin.from("competicoes").select("id", { count: "exact", head: true }).eq("instituicao_id", instituicao_id ?? ""),
    ]);

    const { data: comps } = await supabaseAdmin
      .from("competicoes")
      .select("id")
      .eq("instituicao_id", instituicao_id ?? "");
    const compIds = (comps ?? []).map((c) => c.id);

    let nEquipas = 0;
    if (compIds.length > 0) {
      const { data: mercados } = await supabaseAdmin.from("mercados").select("id").in("competicao_id", compIds);
      const mercadoIds = (mercados ?? []).map((m) => m.id);
      if (mercadoIds.length) {
        const { count } = await supabaseAdmin
          .from("equipas")
          .select("id", { count: "exact", head: true })
          .in("mercado_id", mercadoIds);
        nEquipas = count ?? 0;
      }
    }

    return {
      utilizadores: nUtilizadores ?? 0,
      competicoes: nCompeticoes ?? 0,
      equipas: nEquipas,
    };
  });
