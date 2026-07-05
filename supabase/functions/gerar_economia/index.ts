// gerar_economia — cria (uma vez, na abertura) a economia oculta a partir da seed
// e os colaboradores de cada equipa. Determinístico via mulberry32 + streams.
import { admin, corsHeaders, json } from "../_shared/supabase.ts";
import { clamp, pick, randInt, randRange, stream } from "../_shared/prng.ts";
import {
  ARQUETIPOS,
  type Arquetipo,
  GUARDRAILS,
  PRODUTOS,
} from "../_shared/constants.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { competicao_id } = await req.json();
    if (!competicao_id) throw new Error("competicao_id em falta");
    const sb = admin();

    const { data: comp, error: e1 } = await sb
      .from("competicoes")
      .select("id, seed, duracao_turnos, params")
      .eq("id", competicao_id)
      .maybeSingle();
    if (e1 || !comp) throw new Error("competição não encontrada");

    // Idempotência.
    const { data: existente } = await sb
      .from("economia_seed")
      .select("competicao_id")
      .eq("competicao_id", competicao_id)
      .maybeSingle();
    if (existente) return json({ ok: true, ja_gerada: true });

    const seedBase = Number(comp.seed);
    const rMacro = stream(seedBase, "economia:macro");
    const rDemand = stream(seedBase, "economia:procura");
    const rEmerg = stream(seedBase, "economia:emergentes");
    const rEventos = stream(seedBase, "economia:eventos");
    const rPessoas = stream(seedBase, "pessoas");

    const params = (comp.params ?? {}) as Record<string, number>;

    // Trajetória macro por turno (dentro dos guardrails).
    const T = comp.duracao_turnos;
    let juro = Number(params.taxa_juro ?? 2.4);
    let inf = Number(params.inflacao ?? 2.5);
    let cres = Number(params.crescimento ?? 1.0);
    let conf = Number(params.confianca ?? 100);

    const macro: {
      turno: number; juro: number; inflacao: number; crescimento: number; confianca: number;
    }[] = [];
    for (let t = 1; t <= T; t++) {
      juro = clamp(juro + randRange(rMacro, -GUARDRAILS.juro.delta, GUARDRAILS.juro.delta),
        GUARDRAILS.juro.min, GUARDRAILS.juro.max);
      inf = clamp(inf + randRange(rMacro, -GUARDRAILS.inflacao.delta, GUARDRAILS.inflacao.delta),
        GUARDRAILS.inflacao.min, GUARDRAILS.inflacao.max);
      cres = clamp(cres + randRange(rMacro, -GUARDRAILS.crescimento.delta, GUARDRAILS.crescimento.delta),
        GUARDRAILS.crescimento.min, GUARDRAILS.crescimento.max);
      conf = clamp(conf + randRange(rMacro, -GUARDRAILS.confianca.delta, GUARDRAILS.confianca.delta),
        GUARDRAILS.confianca.min, GUARDRAILS.confianca.max);
      macro.push({ turno: t, juro, inflacao: inf, crescimento: cres, confianca: conf });
    }

    // Perfis de procura por produto: nível, tendência, sazonalidade, choques.
    const perfis: Record<
      string,
      { nivel: number; tendencia: number; sazonalidade: number[]; choques: { turno: number; delta: number }[] }
    > = {};
    for (const p of Object.keys(PRODUTOS)) {
      const fase = randRange(rDemand, 0, Math.PI * 2);
      perfis[p] = {
        nivel: clamp(1 + randRange(rDemand, -0.15, 0.15), 0.7, 1.3),
        tendencia: randRange(rDemand, -0.02, 0.03),
        sazonalidade: Array.from({ length: 12 }, (_, i) =>
          1 + 0.1 * Math.sin((i / 12) * Math.PI * 2 + fase)),
        choques: Array.from({ length: randInt(rDemand, 0, 3) }, () => ({
          turno: randInt(rDemand, 2, Math.max(2, T)),
          delta: randRange(rDemand, -0.25, 0.25),
        })),
      };
    }

    // Linhas emergentes (revelam-se ao longo do jogo).
    const emergentes: { turno: number; nome: string; produto: string; ganho: number }[] = [];
    if (T >= 4) {
      const nomes = ["ergonómica", "escandinava", "sustentável", "modular", "biofílica"];
      const produtos = Object.keys(PRODUTOS);
      const n = randInt(rEmerg, 1, 2);
      for (let k = 0; k < n; k++) {
        emergentes.push({
          turno: randInt(rEmerg, 3, Math.max(3, T - 1)),
          nome: pick(rEmerg, nomes),
          produto: pick(rEmerg, produtos),
          ganho: randRange(rEmerg, 0.10, 0.30),
        });
      }
    }

    // Eventos macro pontuais.
    const eventos: { turno: number; tipo: string; magnitude: number }[] = [];
    const tiposMacro = ["subida_juro", "recessao_leve", "boom_confianca", "greve_setorial", "corte_energia"];
    for (let t = 1; t <= T; t++) {
      if (rEventos() < 0.08) {
        eventos.push({
          turno: t,
          tipo: pick(rEventos, tiposMacro),
          magnitude: randRange(rEventos, 0.5, 1.5),
        });
      }
    }

    // Colaboradores por equipa — arquétipos + variante de avatar.
    const { data: mercados } = await sb.from("mercados").select("id").eq("competicao_id", competicao_id);
    const mercadoIds = (mercados ?? []).map((m) => m.id);
    let equipas: { id: string; is_ia: boolean }[] = [];
    if (mercadoIds.length) {
      const { data } = await sb.from("equipas").select("id, is_ia").in("mercado_id", mercadoIds);
      equipas = data ?? [];
    }

    const arquetipos = Object.keys(ARQUETIPOS) as Arquetipo[];
    // salario_mult por papel: trabalhador 1.0, supervisor 1.4, gestor_linha 2.0.
    // ~1 supervisor por cada 8 trabalhadores. Investigador só se aplicável (por defeito 0).
    const SALARIO_POR_PAPEL: Record<string, number> = {
      trabalhador: 1.0, supervisor: 1.4, gestor_linha: 2.0, investigador: 1.6,
    };
    const colaboradores: Record<string, unknown>[] = [];
    for (const eq of equipas) {
      const nTrab = 6 + randInt(rPessoas, 0, 4);
      const nSup = Math.max(1, Math.round(nTrab / 8));
      const nGestor = 1;
      const nInvest = 0; // criados por ações de CHRO/CEO posteriores.
      const perfilPapel: string[] = [
        ...Array(nTrab).fill("trabalhador"),
        ...Array(nSup).fill("supervisor"),
        ...Array(nGestor).fill("gestor_linha"),
        ...Array(nInvest).fill("investigador"),
      ];
      for (const papel of perfilPapel) {
        const arq = pick(rPessoas, arquetipos);
        const spec = ARQUETIPOS[arq];
        const rng = (r: [number, number]) => Math.round(randRange(rPessoas, r[0], r[1]));
        colaboradores.push({
          equipa_id: eq.id,
          arquetipo: arq,
          avatar_variante: randInt(rPessoas, 1, 2),
          papel_org: papel,
          competencia: rng(spec.competencia),
          produtividade_base: rng(spec.produtividade),
          motivacao: rng(spec.motivacao),
          stress_individual: rng(spec.stress),
          resiliencia: rng(spec.resiliencia),
          aptidao_gestao: rng(spec.aptidao_gestao),
          antiguidade: randInt(rPessoas, 0, 15),
          salario_mult: SALARIO_POR_PAPEL[papel] ?? 1.0,
          necessidades: { ambicao: rng(spec.ambicao) },
        });
      }
    }
    if (colaboradores.length > 0) {
      const { error: eC } = await sb.from("colaboradores").insert(colaboradores);
      if (eC) throw new Error(`colaboradores: ${eC.message}`);
    }

    const dados = {
      versao: 1,
      seed: seedBase,
      elast: Number(params.elasticidade ?? 1.85),
      capital_inicial: Number(params.capital_inicial ?? 60000),
      macro,
      perfis,
      emergentes,
      eventos,
      gerado_em: new Date().toISOString(),
    };
    const { error: eSeed } = await sb.from("economia_seed").insert({ competicao_id, dados });
    if (eSeed) throw new Error(`economia_seed: ${eSeed.message}`);

    return json({ ok: true, turnos: T, equipas: equipas.length, colaboradores: colaboradores.length });
  } catch (e) {
    console.error("[gerar_economia]", e);
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});
