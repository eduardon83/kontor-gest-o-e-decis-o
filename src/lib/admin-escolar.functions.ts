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
    const { instituicao_id, papel } = await minhaInstituicao(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("perfis").select("id, nome, email, papel, criado_em").order("criado_em", { ascending: false });
    // Super_admin sem instituição vê tudo; admin_escolar (ou super_admin associado a uma instituição) filtra
    if (instituicao_id) q = q.eq("instituicao_id", instituicao_id);
    else if (papel !== "super_admin") return [];
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
    // Não deixar rebaixar um super_admin acidentalmente
    const { data: alvo } = await supabaseAdmin.from("perfis").select("instituicao_id, papel").eq("id", data.user_id).maybeSingle();
    if (!alvo) throw new Error("Utilizador não encontrado.");
    if (alvo.papel === "super_admin") throw new Error("Não é possível alterar o papel de um super-administrador.");
    // Garante que o utilizador alvo pertence à minha instituição (excepto super_admin que gere globalmente).
    if (papel !== "super_admin") {
      if (!instituicao_id || alvo.instituicao_id !== instituicao_id) throw new Error("Utilizador fora da sua instituição.");
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
      .select("id, nome, ambito, industria, estado, criado_em, criado_por, instituicao_id")
      .order("criado_em", { ascending: false });
    if (papel !== "super_admin" && instituicao_id) q = q.eq("instituicao_id", instituicao_id);
    else if (papel !== "super_admin") return [];
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const metricasInstituicao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { instituicao_id, papel } = await minhaInstituicao(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Utilizadores
    let qUsers = supabaseAdmin.from("perfis").select("id", { count: "exact", head: true });
    if (instituicao_id) qUsers = qUsers.eq("instituicao_id", instituicao_id);
    else if (papel !== "super_admin") qUsers = qUsers.eq("instituicao_id", "00000000-0000-0000-0000-000000000000");
    const { count: nUtilizadores } = await qUsers;

    // Competições
    let qComps = supabaseAdmin.from("competicoes").select("id", { count: "exact", head: true });
    if (instituicao_id) qComps = qComps.eq("instituicao_id", instituicao_id);
    else if (papel !== "super_admin") qComps = qComps.eq("instituicao_id", "00000000-0000-0000-0000-000000000000");
    const { count: nCompeticoes } = await qComps;

    // Ids das competições no âmbito
    let qCompIds = supabaseAdmin.from("competicoes").select("id");
    if (instituicao_id) qCompIds = qCompIds.eq("instituicao_id", instituicao_id);
    const { data: comps } = await qCompIds;
    const compIds = (comps ?? []).map((c: any) => c.id);

    let nEquipas = 0;
    if (compIds.length > 0) {
      const { data: mercados } = await supabaseAdmin.from("mercados").select("id").in("competicao_id", compIds);
      const mercadoIds = (mercados ?? []).map((m: any) => m.id);
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
