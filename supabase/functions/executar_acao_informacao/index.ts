// executar_acao_informacao — revela fatia da economia/estado com ruído,
// respeita 1 ação por lugar/turno; grava em acoes_informacao.resultado.
import { admin, corsHeaders, json } from "../_shared/supabase.ts";
import { clamp, gaussian, stream } from "../_shared/prng.ts";
import { PRODUTOS, type Produto } from "../_shared/constants.ts";
import { escolherRepresentante } from "../_shared/candidatos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { acao_id } = await req.json();
    if (!acao_id) throw new Error("acao_id em falta");
    const sb = admin();

    const { data: acao } = await sb.from("acoes_informacao")
      .select("id, equipa_id, ronda_id, tipo, nivel, lugar, resultado")
      .eq("id", acao_id).maybeSingle();
    if (!acao) throw new Error("ação não encontrada");
    if (acao.resultado) return json({ ok: true, ja_executada: true });

    // Máx. 1 por lugar/turno
    const { data: outras } = await sb.from("acoes_informacao")
      .select("id, resultado").eq("equipa_id", acao.equipa_id)
      .eq("ronda_id", acao.ronda_id).eq("lugar", acao.lugar).neq("id", acao_id);
    if ((outras ?? []).some((o) => o.resultado)) {
      throw new Error("já existe uma ação deste lugar neste turno");
    }

    // Contexto
    const { data: eq } = await sb.from("equipas").select("mercado_id").eq("id", acao.equipa_id).maybeSingle();
    if (!eq) throw new Error("equipa não encontrada");
    const { data: merc } = await sb.from("mercados").select("competicao_id").eq("id", eq.mercado_id).maybeSingle();
    if (!merc) throw new Error("mercado não encontrado");
    const { data: comp } = await sb.from("competicoes").select("seed").eq("id", merc.competicao_id).maybeSingle();
    const { data: ronda } = await sb.from("rondas").select("indice").eq("id", acao.ronda_id).maybeSingle();
    const { data: econRow } = await sb.from("economia_seed").select("dados").eq("competicao_id", merc.competicao_id).maybeSingle();
    const economia = econRow?.dados as {
      macro: { turno: number; juro: number; inflacao: number; crescimento: number; confianca: number }[];
      perfis: Record<string, { nivel: number; tendencia: number; sazonalidade: number[] }>;
      emergentes: { turno: number; produto: string; nome: string; ganho: number }[];
      eventos: { turno: number; tipo: string; magnitude: number }[];
    } | undefined;
    if (!economia || !ronda || !comp) throw new Error("economia/ronda/competição em falta");

    const rr = stream(Number(comp.seed) + Number(ronda.indice) * 15485863, `acao:${acao_id}`);

    // Níveis: L1/L2/L3 → confiança 75/85/95%
    const nivel = (acao.nivel ?? "L1") as "L1" | "L2" | "L3";
    const conf = nivel === "L3" ? 0.95 : nivel === "L2" ? 0.85 : 0.75;
    const ruidoScale = (1 - conf) * 2; // desvio-padrão relativo

    const ruido = (x: number, escala = ruidoScale) =>
      Number((x * (1 + gaussian(rr, 0, escala))).toFixed(2));

    let resultado: Record<string, unknown> = {};
    switch (acao.tipo) {
      case "estudo_economico": {
        // Revela 3 turnos à frente com ruído decrescente
        const T = ronda.indice;
        const janela = economia.macro.filter((m) => m.turno >= T && m.turno <= T + 2);
        resultado = {
          confianca: conf,
          janela: janela.map((m) => ({
            turno: m.turno,
            juro: ruido(m.juro),
            inflacao: ruido(m.inflacao),
            crescimento: ruido(m.crescimento, ruidoScale / 2),
            confianca_mercado: ruido(m.confianca),
          })),
        };
        break;
      }
      case "pesquisa_mercado": {
        const produtos = Object.keys(PRODUTOS) as Produto[];
        resultado = {
          confianca: conf,
          procura_relativa: Object.fromEntries(produtos.map((p) => {
            const perf = economia.perfis[p];
            const v = perf.nivel * (1 + perf.tendencia * ronda.indice) * perf.sazonalidade[(ronda.indice - 1) % 12];
            return [p, ruido(v)];
          })),
          emergentes_visiveis: economia.emergentes
            .filter((e) => e.turno <= ronda.indice + (nivel === "L3" ? 3 : nivel === "L2" ? 2 : 1))
            .map((e) => ({ produto: e.produto, nome: e.nome, ganho: ruido(e.ganho) })),
        };
        break;
      }
      case "concorrencia": {
        // Snapshot parcial da última ronda dos rivais no mesmo mercado
        const { data: rivais } = await sb.from("equipas").select("id, nome")
          .eq("mercado_id", eq.mercado_id).neq("id", acao.equipa_id);
        const snaps: Record<string, unknown>[] = [];
        for (const r of rivais ?? []) {
          const { data: est } = await sb.from("estado_empresa")
            .select("snapshot, criado_em").eq("equipa_id", r.id)
            .order("criado_em", { ascending: false }).limit(1).maybeSingle();
          const s = est?.snapshot as { precos?: Record<string, number>; marca?: number; ritmo?: string } | undefined;
          if (!s) continue;
          snaps.push({
            equipa_id: r.id, nome: r.nome,
            precos: nivel !== "L1" ? {
              cadeira: ruido(s.precos?.cadeira ?? 0),
              mesa: ruido(s.precos?.mesa ?? 0),
              armario: ruido(s.precos?.armario ?? 0),
            } : undefined,
            marca: ruido(s.marca ?? 40),
            ritmo: nivel === "L3" ? s.ritmo : undefined,
          });
        }
        resultado = { confianca: conf, rivais: snaps };
        break;
      }
      case "dialogo": {
        // Sem níveis — representante determinístico do turno.
        const { data: cols } = await sb.from("colaboradores")
          .select("id, arquetipo, motivacao, stress_individual, competencia, necessidades, papel_org, salario_mult")
          .eq("equipa_id", acao.equipa_id)
          .eq("ativo", true);
        const ids = (cols ?? []).map((c) => c.id);
        const repId = escolherRepresentante(
          { competicaoSeed: Number(comp.seed), rondaIndice: Number(ronda.indice), equipaId: acao.equipa_id },
          ids,
        );
        const alvo = (cols ?? []).find((c) => c.id === repId) ?? null;
        // Clima organizacional agregado (curto).
        const media = (arr: number[]) => arr.length ? arr.reduce((s, x) => s + Number(x), 0) / arr.length : 0;
        const clima = {
          moral_media: Math.round(media((cols ?? []).map((c) => Number(c.motivacao)))),
          stress_medio: Math.round(media((cols ?? []).map((c) => Number(c.stress_individual)))),
          n: (cols ?? []).length,
        };
        // Sem ruído — a "leitura rica" é confiança 1.
        resultado = alvo ? {
          confianca: 1,
          representante: {
            id: alvo.id, arquetipo: alvo.arquetipo, papel_org: alvo.papel_org,
            moral: clamp(Number(alvo.motivacao), 0, 100),
            stress: clamp(Number(alvo.stress_individual), 0, 100),
            competencia: clamp(Number(alvo.competencia), 0, 100),
            necessidades: alvo.necessidades,
            salario_mult: Number(alvo.salario_mult ?? 1),
          },
          clima,
        } : { confianca: 1, representante: null, clima };
        break;
      }
      case "analise_id": {
        resultado = {
          confianca: conf,
          breakthroughs_visiveis: economia.emergentes
            .filter((e) => e.turno <= ronda.indice + 2)
            .map((e) => ({ produto: e.produto, nome: e.nome, ganho: ruido(e.ganho) })),
        };
        break;
      }
      default:
        throw new Error(`tipo desconhecido: ${acao.tipo}`);
    }

    const { error: eU } = await sb.from("acoes_informacao")
      .update({ resultado, confianca: conf }).eq("id", acao_id);
    if (eU) throw new Error(eU.message);

    return json({ ok: true, resultado });
  } catch (e) {
    console.error("[executar_acao_informacao]", e);
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});
