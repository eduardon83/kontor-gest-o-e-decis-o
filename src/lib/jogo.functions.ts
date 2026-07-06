import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LUGARES = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;

/* ============================================================
 * ENTRAR POR CÓDIGO
 * - Localiza competição pelo `codigo`.
 * - Reclama convites em `membros_equipa` cujo `email_convite`
 *   corresponde ao email do utilizador autenticado.
 * - Devolve a lista de equipas (equipa_id + lugar) do utilizador
 *   nessa competição — o cliente escolhe se houver mais do que uma.
 * ============================================================ */
export const entrarPorCodigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ codigo: z.string().trim().min(3).max(32) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const codigo = data.codigo.toUpperCase();

    // Reclama qualquer convite cujo email bata com o do utilizador (idempotente).
    await supabase.rpc("reclamar_convites_por_email");

    // Procura a competição usando cliente admin (RLS não expõe competições ao jogador).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: comp } = await supabaseAdmin
      .from("competicoes")
      .select("id, nome")
      .eq("codigo", codigo)
      .maybeSingle();

    if (!comp) throw new Error("Código não encontrado.");

    // Lista as equipas desta competição em que o utilizador é membro.
    const { data: equipasDoUser, error: erroEq } = await supabaseAdmin
      .from("membros_equipa")
      .select("equipa_id, lugar, equipas!inner(id, nome, mercado_id, mercados!inner(competicao_id))")
      .eq("user_id", userId);

    if (erroEq) throw new Error(erroEq.message);

    const equipas =
      (equipasDoUser ?? [])
        .filter((row: any) => row.equipas?.mercados?.competicao_id === comp.id)
        .map((row: any) => ({
          equipa_id: row.equipa_id as string,
          equipa_nome: row.equipas.nome as string,
          lugar: row.lugar as string,
        })) ?? [];

    if (equipas.length === 0) {
      throw new Error("O seu email não está associado a nenhuma equipa desta Hansa. Peça ao docente para o convidar.");
    }

    return { competicao_id: comp.id, competicao_nome: comp.nome, equipas };
  });

/* ============================================================
 * ATUALIZAR NOME DA EMPRESA (equipas.nome)
 * ============================================================ */
export const atualizarNomeEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ equipa_id: z.string().uuid(), nome: z.string().trim().min(1).max(120) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // RLS: jogador pode ler a sua equipa mas UPDATE de equipas só admins/professores.
    // Este endpoint só permite ao membro da equipa que está no lugar CEO editar.
    const { data: meuLugar } = await supabase
      .from("membros_equipa")
      .select("lugar")
      .eq("equipa_id", data.equipa_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!meuLugar || meuLugar.lugar !== "CEO") {
      throw new Error("Só o CEO da equipa pode alterar o nome da empresa.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("equipas")
      .update({ nome: data.nome })
      .eq("id", data.equipa_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * ATUALIZAR NOME DO PERFIL (perfis.nome)
 * ============================================================ */
export const atualizarNomePerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ nome: z.string().trim().min(1).max(120) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("perfis").update({ nome: data.nome }).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * SUBMETER DECISÃO
 * Upsert por (ronda_id, equipa_id, lugar). Marca submetido_em/por.
 * A RLS já garante que só o titular do lugar pode escrever na ronda aberta.
 * ============================================================ */
export const submeterDecisao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        ronda_id: z.string().uuid(),
        equipa_id: z.string().uuid(),
        lugar: z.enum(LUGARES),
        payload: z.record(z.string(), z.unknown()),
        submeter: z.boolean().default(false),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const linha = {
      ronda_id: data.ronda_id,
      equipa_id: data.equipa_id,
      lugar: data.lugar,
      payload: data.payload as never,
      submetido_por: userId,
      submetido_em: data.submeter ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("decisoes")
      .upsert(linha, { onConflict: "ronda_id,equipa_id,lugar" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * EXECUTAR AÇÃO DE INFORMAÇÃO
 * Cria linha em acoes_informacao (via cliente do jogador — RLS)
 * e invoca a Edge Function para preencher `resultado`.
 * Máx. 1 por (ronda_id, lugar, equipa_id) — validado antes de escrever.
 * ============================================================ */
export const executarAcaoInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        ronda_id: z.string().uuid(),
        equipa_id: z.string().uuid(),
        lugar: z.enum(LUGARES),
        tipo: z.string().min(1).max(48),
        nivel: z.enum(["L1", "L2", "L3"]).optional(),
        custo: z.number().int().min(0).max(1_000_000).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { count } = await supabase
      .from("acoes_informacao")
      .select("id", { count: "exact", head: true })
      .eq("ronda_id", data.ronda_id)
      .eq("equipa_id", data.equipa_id)
      .eq("lugar", data.lugar);
    if ((count ?? 0) > 0) {
      throw new Error("Já usaste a pesquisa neste turno.");
    }

    const { data: inserido, error } = await supabase
      .from("acoes_informacao")
      .insert({
        ronda_id: data.ronda_id,
        equipa_id: data.equipa_id,
        lugar: data.lugar,
        tipo: data.tipo,
        nivel: data.nivel ?? null,
        custo: data.custo ?? undefined,
        criado_por: userId,
      })
      .select("id")
      .single();
    if (error || !inserido) throw new Error(error?.message ?? "Falha a registar pesquisa.");

    // Invoca Edge Function server-authoritative (ignora falhas para não bloquear a UI).
    try {
      const url = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && serviceKey) {
        await fetch(`${url}/functions/v1/executar_acao_informacao`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({ acao_id: inserido.id }),
        });
      }
    } catch (e) {
      console.error("[executar_acao_informacao] falha", e);
    }

    // Lê o registo já com resultado (se a Edge Function conseguiu preencher).
    const { data: final } = await supabase
      .from("acoes_informacao")
      .select("id, tipo, nivel, confianca, resultado, criado_em")
      .eq("id", inserido.id)
      .maybeSingle();

    return { acao: final };
  });
