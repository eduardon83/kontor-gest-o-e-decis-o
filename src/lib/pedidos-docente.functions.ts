// Pedidos de acesso de docente.
// Jogador cria um pedido; admin_escolar/super_admin lista, aprova ou rejeita.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const criarPedidoDocente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        instituicao: z.string().trim().max(200).optional().nullable(),
        mensagem: z.string().trim().max(1000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: perfil } = await context.supabase
      .from("perfis")
      .select("email, nome, papel")
      .eq("id", context.userId)
      .maybeSingle();
    if (!perfil) throw new Error("Perfil não encontrado.");
    if (perfil.papel === "professor" || perfil.papel === "admin_escolar" || perfil.papel === "super_admin") {
      throw new Error("Já tem acesso de docente.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Se já existe pedido pendente, devolve-o.
    const { data: existente } = await supabaseAdmin
      .from("pedidos_docente")
      .select("id, estado, criado_em")
      .eq("user_id", context.userId)
      .eq("estado", "pendente")
      .maybeSingle();
    if (existente) return { ok: true, ja_existia: true, pedido: existente };

    const { data: inserido, error } = await supabaseAdmin
      .from("pedidos_docente")
      .insert({
        user_id: context.userId,
        email: perfil.email,
        nome: perfil.nome ?? null,
        instituicao: data.instituicao?.trim() || null,
        mensagem: data.mensagem?.trim() || null,
      })
      .select("id, estado, criado_em")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, ja_existia: false, pedido: inserido };
  });

export const meuPedidoDocente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("pedidos_docente")
      .select("id, estado, criado_em, decidido_em")
      .eq("user_id", context.userId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });

async function autorizarAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("perfis")
    .select("papel, instituicao_id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) throw new Error("Perfil não encontrado.");
  if (data.papel !== "super_admin" && data.papel !== "admin_escolar") {
    throw new Error("Sem autorização.");
  }
  return data as { papel: "super_admin" | "admin_escolar"; instituicao_id: string | null };
}

export const listarPedidosDocente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await autorizarAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pedidos_docente")
      .select("id, email, nome, instituicao, mensagem, estado, criado_em, decidido_em")
      .eq("estado", "pendente")
      .order("criado_em", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const decidirPedidoDocente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        aprovar: z.boolean(),
        instituicao_id: z.string().uuid().optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const eu = await autorizarAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pedido, error: erroP } = await supabaseAdmin
      .from("pedidos_docente")
      .select("id, user_id, estado")
      .eq("id", data.id)
      .maybeSingle();
    if (erroP) throw new Error(erroP.message);
    if (!pedido || pedido.estado !== "pendente") throw new Error("Pedido inexistente ou já decidido.");

    if (data.aprovar) {
      const inst = eu.papel === "admin_escolar" ? eu.instituicao_id : data.instituicao_id ?? null;
      const patch: Record<string, unknown> = { papel: "professor" };
      if (inst) patch.instituicao_id = inst;
      const { error: errUpd } = await supabaseAdmin
        .from("perfis")
        .update(patch as never)
        .eq("id", pedido.user_id);
      if (errUpd) throw new Error(errUpd.message);
    }

    const { error: errPatch } = await supabaseAdmin
      .from("pedidos_docente")
      .update({
        estado: data.aprovar ? "aprovado" : "rejeitado",
        decidido_em: new Date().toISOString(),
        decidido_por: context.userId,
      })
      .eq("id", data.id);
    if (errPatch) throw new Error(errPatch.message);

    return { ok: true };
  });
