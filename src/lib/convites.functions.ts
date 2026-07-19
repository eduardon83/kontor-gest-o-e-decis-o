// Pré-provisionamento de utilizadores por email.
// - Super-admin: gere convites em qualquer instituição.
// - Admin escolar: só gere convites da sua instituição e não pode conceder super_admin.
// Quando o utilizador se regista (ou já existe), o papel/instituição do convite é aplicado
// automaticamente (trigger handle_new_user + aplicação retroactiva aqui).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Papel = "jogador" | "professor" | "admin_escolar" | "super_admin";

async function perfilAutorizado(supabase: any, userId: string) {
  const { data } = await supabase
    .from("perfis")
    .select("papel, instituicao_id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) throw new Error("Perfil não encontrado.");
  if (data.papel !== "super_admin" && data.papel !== "admin_escolar") {
    throw new Error("Sem autorização para gerir convites.");
  }
  return { papel: data.papel as Papel, instituicao_id: data.instituicao_id as string | null };
}

export const listarConvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const eu = await perfilAutorizado(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("convites_papel")
      .select("email, papel, instituicao_id, criado_em, usado_em, usado_por, criado_por")
      .order("criado_em", { ascending: false });
    if (eu.papel === "admin_escolar") {
      if (!eu.instituicao_id) return [];
      q = q.eq("instituicao_id", eu.instituicao_id);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarConvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        papel: z.enum(["jogador", "professor", "admin_escolar", "super_admin"]),
        instituicao_id: z.string().uuid().optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const eu = await perfilAutorizado(context.supabase, context.userId);
    if (eu.papel === "admin_escolar") {
      if (data.papel === "super_admin") throw new Error("Não pode conceder super-administrador.");
      if (!eu.instituicao_id) throw new Error("Sem instituição associada.");
      if (data.instituicao_id && data.instituicao_id !== eu.instituicao_id) {
        throw new Error("Só pode convidar para a sua instituição.");
      }
      data.instituicao_id = eu.instituicao_id;
    }

    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Upsert do convite.
    const { error: erroConvite } = await supabaseAdmin
      .from("convites_papel")
      .upsert(
        {
          email,
          papel: data.papel as never,
          instituicao_id: data.instituicao_id ?? null,
          criado_por: context.userId,
          usado_em: null,
          usado_por: null,
        },
        { onConflict: "email" },
      );
    if (erroConvite) throw new Error(erroConvite.message);

    // Se o utilizador já existe, aplica imediatamente.
    const { data: perfilExistente } = await supabaseAdmin
      .from("perfis")
      .select("id, instituicao_id")
      .ilike("email", email)
      .maybeSingle();

    if (perfilExistente) {
      const patch: Record<string, unknown> = { papel: data.papel };
      if (data.instituicao_id) patch.instituicao_id = data.instituicao_id;
      const { error: erroUpd } = await supabaseAdmin
        .from("perfis")
        .update(patch as never)
        .eq("id", perfilExistente.id);
      if (erroUpd) throw new Error(erroUpd.message);

      await supabaseAdmin
        .from("convites_papel")
        .update({ usado_em: new Date().toISOString(), usado_por: perfilExistente.id })
        .eq("email", email);
      return { ok: true, aplicado_imediatamente: true };
    }

    return { ok: true, aplicado_imediatamente: false };
  });

export const revogarConvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ email: z.string().trim().email() }).parse(raw))
  .handler(async ({ data, context }) => {
    const eu = await perfilAutorizado(context.supabase, context.userId);
    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("convites_papel").delete().eq("email", email);
    if (eu.papel === "admin_escolar") {
      if (!eu.instituicao_id) throw new Error("Sem instituição associada.");
      q = q.eq("instituicao_id", eu.instituicao_id);
    }
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
