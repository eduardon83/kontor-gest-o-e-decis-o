import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MOLDES_POR_CHAVE, DEFAULTS_TEXTO } from "@/lib/textos/catalogo";
import {
  linhasParaVariantes,
  resolverCascata,
  variaveisInvalidas,
  type LinhaMolde,
} from "@/lib/textos/render";

const escopoSchema = z.enum(["global", "instituicao", "competicao"]);

/* ============================================================
 * Leitura resolvida (cascata) — usada pela interface.
 * Sem autenticação: os textos de interface aparecem também na landing.
 * ============================================================ */
export const textosResolvidos = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ competicao_id: z.string().uuid().nullable().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let instituicao_id: string | null = null;
      if (data.competicao_id) {
        const { data: comp } = await supabaseAdmin
          .from("competicoes")
          .select("instituicao_id")
          .eq("id", data.competicao_id)
          .maybeSingle();
        instituicao_id = comp?.instituicao_id ?? null;
      }
      const { data: linhas } = await supabaseAdmin
        .from("moldes_texto")
        .select("chave, texto, escopo, instituicao_id, competicao_id, ativo")
        .eq("ativo", true);
      const mapa = resolverCascata((linhas ?? []) as LinhaMolde[], {
        competicao_id: data.competicao_id ?? null,
        instituicao_id,
      });
      return { mapa };
    } catch {
      // Cascata degrada para os defaults no código.
      return { mapa: {} as Record<string, string[]> };
    }
  });

/* ============================================================
 * Editor — listar o que está gravado num escopo
 * ============================================================ */
export const listarMoldesDoEscopo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        escopo: escopoSchema,
        instituicao_id: z.string().uuid().nullable().optional(),
        competicao_id: z.string().uuid().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("moldes_texto")
      .select("id, chave, categoria, texto, escopo, instituicao_id, competicao_id, ativo, atualizado_em")
      .eq("escopo", data.escopo);
    q = data.escopo === "instituicao"
      ? q.eq("instituicao_id", data.instituicao_id ?? "")
      : data.escopo === "competicao"
        ? q.eq("competicao_id", data.competicao_id ?? "")
        : q.is("instituicao_id", null).is("competicao_id", null);
    const { data: linhas, error } = await q;
    if (error) throw new Error(error.message);
    return linhas ?? [];
  });

/* ============================================================
 * Editor — gravar (valida variáveis contra o catálogo)
 * ============================================================ */
export const guardarMolde = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        chave: z.string().min(1).max(120),
        escopo: escopoSchema,
        instituicao_id: z.string().uuid().nullable().optional(),
        competicao_id: z.string().uuid().nullable().optional(),
        texto: z.string().max(20000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const molde = MOLDES_POR_CHAVE[data.chave];
    if (!molde) throw new Error("Molde desconhecido.");

    const variantes = linhasParaVariantes(data.texto);
    if (!variantes.length) throw new Error("O molde tem de ter pelo menos uma formulação.");

    const permitidas = molde.variaveis.map((v) => v.nome);
    const invalidas = variaveisInvalidas(variantes, permitidas);
    if (invalidas.length) {
      throw new Error(
        `Variáveis inexistentes neste molde: ${invalidas.map((v) => `{${v}}`).join(", ")}. ` +
          `Disponíveis: ${permitidas.length ? permitidas.map((v) => `{${v}}`).join(", ") : "nenhuma"}.`,
      );
    }

    const texto = variantes.join("\n");
    const alvo = {
      chave: data.chave,
      categoria: molde.categoria,
      escopo: data.escopo,
      instituicao_id: data.escopo === "instituicao" ? (data.instituicao_id ?? null) : null,
      competicao_id: data.escopo === "competicao" ? (data.competicao_id ?? null) : null,
    };
    if (alvo.escopo === "instituicao" && !alvo.instituicao_id) throw new Error("Falta a instituição.");
    if (alvo.escopo === "competicao" && !alvo.competicao_id) throw new Error("Falta a competição.");

    let q = context.supabase
      .from("moldes_texto")
      .select("id")
      .eq("chave", alvo.chave)
      .eq("escopo", alvo.escopo);
    q = alvo.escopo === "instituicao"
      ? q.eq("instituicao_id", alvo.instituicao_id!)
      : alvo.escopo === "competicao"
        ? q.eq("competicao_id", alvo.competicao_id!)
        : q.is("instituicao_id", null).is("competicao_id", null);
    const { data: existente } = await q.maybeSingle();

    if (existente?.id) {
      const { error } = await context.supabase
        .from("moldes_texto")
        .update({ texto, variaveis: molde.variaveis as never, ativo: true, atualizado_por: context.userId })
        .eq("id", existente.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("moldes_texto").insert({
        ...alvo,
        texto,
        variaveis: molde.variaveis as never,
        atualizado_por: context.userId,
      });
      if (error) throw new Error(error.message);
    }

    await registarAuditoria(context.userId, "molde_texto_gravado", alvo.chave, {
      ...alvo,
      variantes: variantes.length,
    });
    return { ok: true, variantes: variantes.length };
  });

/* ============================================================
 * Editor — repor o texto original (apaga a linha do escopo)
 * ============================================================ */
export const reporMolde = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        chave: z.string().min(1).max(120),
        escopo: escopoSchema,
        instituicao_id: z.string().uuid().nullable().optional(),
        competicao_id: z.string().uuid().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("moldes_texto")
      .delete()
      .eq("chave", data.chave)
      .eq("escopo", data.escopo);
    q = data.escopo === "instituicao"
      ? q.eq("instituicao_id", data.instituicao_id ?? "")
      : data.escopo === "competicao"
        ? q.eq("competicao_id", data.competicao_id ?? "")
        : q.is("instituicao_id", null).is("competicao_id", null);
    const { error } = await q;
    if (error) throw new Error(error.message);

    await registarAuditoria(context.userId, "molde_texto_reposto", data.chave, { ...data });
    return { ok: true, default_no_codigo: (DEFAULTS_TEXTO[data.chave] ?? []).length };
  });

async function registarAuditoria(
  userId: string,
  acao: string,
  alvo: string,
  payload: Record<string, unknown>,
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("log_auditoria").insert({
      ator_user_id: userId,
      acao,
      alvo,
      payload: payload as never,
    });
  } catch {
    // auditoria nunca deve partir a gravação
  }
}
