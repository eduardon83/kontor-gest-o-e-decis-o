// resolver_ronda — pipeline determinístico e server-authoritative.
// (a) política de ausente  (b) precedência CEO→CFO→COO/CMO/CHRO com clamps
// (c) multiplicadores org  (d) economia + custos + juros + imposto
// (e) eventos §7.4          (f) rollup pessoas               (g) gravação
import { admin, corsHeaders, json } from "../_shared/supabase.ts";
import { clamp, pick, stream } from "../_shared/prng.ts";
import {
  CONST, PRECEDENCIA, PRODUTOS, TIERS, type Produto, type Tier,
} from "../_shared/constants.ts";

type Decisao = { lugar: string; payload: Record<string, unknown>; submetido_em: string | null };
type EstadoBase = {
  caixa: number; ativos: number; marca: number; divida: number;
  moral: number; stress_org: number; ambicao_org: number;
  cap_producao: number; forca_vendas: number; supervisores: number;
  prejuizos_acum: number; historia: string[];
};

const DEFAULT_ESTADO = (capital: number): EstadoBase => ({
  caixa: capital, ativos: 1, marca: 40, divida: 0,
  moral: 65, stress_org: 30, ambicao_org: 55,
  cap_producao: 1200, forca_vendas: 3, supervisores: 2,
  prejuizos_acum: 0, historia: [],
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ronda_id } = await req.json();
    if (!ronda_id) throw new Error("ronda_id em falta");
    const sb = admin();

    // Ronda + competição + economia oculta
    const { data: ronda, error: eR } = await sb.from("rondas")
      .select("id, competicao_id, indice, estado").eq("id", ronda_id).maybeSingle();
    if (eR || !ronda) throw new Error("ronda não encontrada");
    if (ronda.estado === "resolvida") return json({ ok: true, ja_resolvida: true });

    const { data: comp } = await sb.from("competicoes")
      .select("id, seed, duracao_turnos, params, politica_ausente").eq("id", ronda.competicao_id).maybeSingle();
    if (!comp) throw new Error("competição não encontrada");

    const { data: econRow } = await sb.from("economia_seed")
      .select("dados").eq("competicao_id", ronda.competicao_id).maybeSingle();
    const economia = (econRow?.dados ?? null) as {
      macro: { turno: number; juro: number; inflacao: number; crescimento: number; confianca: number }[];
      perfis: Record<string, { nivel: number; tendencia: number; sazonalidade: number[]; choques: { turno: number; delta: number }[] }>;
      emergentes: { turno: number; produto: string; ganho: number }[];
      eventos: { turno: number; tipo: string; magnitude: number }[];
      elast: number; capital_inicial: number;
    } | null;
    if (!economia) throw new Error("economia_seed em falta — corra gerar_economia primeiro");

    const macro = economia.macro[Math.min(ronda.indice - 1, economia.macro.length - 1)];
    const ELAST = economia.elast ?? CONST.elast_default;

    // Mercados + equipas + decisões + colaboradores + estado prévio
    const { data: mercados } = await sb.from("mercados").select("id").eq("competicao_id", ronda.competicao_id);
    const mercadoIds = (mercados ?? []).map((m) => m.id);
    const { data: equipas } = await sb.from("equipas")
      .select("id, nome, is_ia, mercado_id").in("mercado_id", mercadoIds);
    const equipasArr = equipas ?? [];

    const { data: decisoes } = await sb.from("decisoes")
      .select("equipa_id, lugar, payload, submetido_em").eq("ronda_id", ronda_id);
    const decisoesPorEquipa = new Map<string, Decisao[]>();
    for (const d of decisoes ?? []) {
      const arr = decisoesPorEquipa.get(d.equipa_id) ?? [];
      arr.push(d as Decisao);
      decisoesPorEquipa.set(d.equipa_id, arr);
    }

    const { data: colabs } = await sb.from("colaboradores")
      .select("*").in("equipa_id", equipasArr.map((e) => e.id));
    const colabsPorEquipa = new Map<string, typeof colabs>();
    for (const c of colabs ?? []) {
      const arr = colabsPorEquipa.get(c.equipa_id) ?? [];
      arr.push(c);
      colabsPorEquipa.set(c.equipa_id, arr);
    }

    // Estado prévio (última snapshot desta equipa)
    async function estadoPrevio(equipa_id: string): Promise<EstadoBase> {
      const { data } = await sb.from("estado_empresa")
        .select("snapshot, criado_em").eq("equipa_id", equipa_id)
        .order("criado_em", { ascending: false }).limit(1).maybeSingle();
      if (data?.snapshot && typeof data.snapshot === "object") {
        const snap = data.snapshot as Partial<EstadoBase>;
        return { ...DEFAULT_ESTADO(economia.capital_inicial), ...snap };
      }
      return DEFAULT_ESTADO(economia.capital_inicial);
    }

    // Pré-carrega apelo total do mercado (para calcular quotas).
    const apeloPorMercado = new Map<string, { equipa_id: string; apelo: Record<Produto, number>; producao: Record<Produto, number>; precos: Record<Produto, number>; export_share: number }[]>();
    const buffer: {
      equipa_id: string; mercado_id: string; is_ia: boolean;
      estado: EstadoBase;
      decisoesOrig: Decisao[]; decisoesFinais: Decisao[];
      auditoria: { acao: string; payload: Record<string, unknown> }[];
      producao: Record<Produto, number>; qualMult: number; prodMult: number;
      tiers: Record<Produto, Tier>; precos: Record<Produto, number>;
      apelo: Record<Produto, number>;
      marketing: number; forca_vendas: number; ritmo: string;
      custos: { producao: number; estrutura: number; ID: number; juros: number };
      export_share: number;
      capex: number; formacao: number; salarios: number;
      empréstimo_novo: number;
    }[] = [];

    for (const eq of equipasArr) {
      const estado = await estadoPrevio(eq.id);
      const decisoesEq = decisoesPorEquipa.get(eq.id) ?? [];
      const { decisoesFinais, auditoria } = aplicarPoliticaEPrecedencia(
        decisoesEq, comp.politica_ausente ?? "status_quo", estado,
      );
      const meta = colabsPorEquipa.get(eq.id) ?? [];
      const rollup = rollupPessoas(meta);
      const prodMult = clamp(
        1 + 0.30 * ((rollup.M - 50) / 50)
          - 0.25 * Math.max(0, rollup.S - 40) / 60
          + 0.10 * ((rollup.A - 50) / 50)
          - Math.max(0, rollup.trab - rollup.superv * 8) * 0.01,
        0.5, 1.4,
      );
      const qualMult = clamp(
        1 + 0.20 * (rollup.competencia_norm - 1) + 0.10 * ((rollup.M - 50) / 50),
        0.7, 1.35,
      );

      // Decisões consolidadas por lugar
      const dec = consolidar(decisoesFinais);
      const ritmo = String(dec.COO?.ritmo ?? "normal");
      const capMod = ritmo === "folga" ? 0.7 : ritmo === "horas_extra" ? 1.15 : ritmo === "ferias" ? 0.05 : 1.0;
      const cap = estado.cap_producao * capMod * prodMult;

      // Produção alvo por produto/tier
      const tiers: Record<Produto, Tier> = {
        cadeira: (dec.COO?.tier_cadeira as Tier) ?? "standard",
        mesa: (dec.COO?.tier_mesa as Tier) ?? "standard",
        armario: (dec.COO?.tier_armario as Tier) ?? "standard",
      };
      const alvo: Record<Produto, number> = {
        cadeira: Number(dec.COO?.prod_cadeira ?? 0),
        mesa: Number(dec.COO?.prod_mesa ?? 0),
        armario: Number(dec.COO?.prod_armario ?? 0),
      };
      const custoUnitario = (p: Produto, t: Tier) =>
        PRODUTOS[p].madeira * CONST.madeira_m3
        + PRODUTOS[p].mao * TIERS[t].mao_mult * CONST.custo_hora * (ritmo === "horas_extra" ? 1.5 : 1)
        + PRODUTOS[p].energia * (CONST.eletricidade_kwh + CONST.carbono_kwh)
        + PRODUTOS[p].consumivel;

      const custoAlvo = (Object.keys(PRODUTOS) as Produto[])
        .reduce((s, p) => s + alvo[p] * custoUnitario(p, tiers[p]), 0);

      // Capex reduz orçamento
      const orcamento = Math.max(0, estado.caixa - custoAlvo);
      let capex = Math.min(Number(dec.CFO?.capex ?? 0), orcamento);
      if (capex < Number(dec.CFO?.capex ?? 0)) {
        auditoria.push({ acao: "capex_reduzido_ao_orcamento", payload: { pedido: dec.CFO?.capex, aplicado: capex } });
      }
      const emprestimo_teto = 0.6 * estado.cap_producao * 50; // heurístico
      let emprestimo_novo = Number(dec.CFO?.emprestimo ?? 0);
      if (emprestimo_novo > emprestimo_teto) {
        auditoria.push({ acao: "emprestimo_clampado", payload: { pedido: emprestimo_novo, teto: emprestimo_teto } });
        emprestimo_novo = emprestimo_teto;
      }

      // Produção limitada pela capacidade e recursos (aproximada)
      const somaAlvo = alvo.cadeira + alvo.mesa + alvo.armario;
      const factorCap = somaAlvo > 0 ? Math.min(1, cap / Math.max(1, somaAlvo)) : 0;
      const producao: Record<Produto, number> = {
        cadeira: Math.floor(alvo.cadeira * factorCap),
        mesa: Math.floor(alvo.mesa * factorCap),
        armario: Math.floor(alvo.armario * factorCap),
      };

      // Piso de preço = custo unitário × 1.05
      const precos: Record<Produto, number> = {
        cadeira: 0, mesa: 0, armario: 0,
      };
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const piso = custoUnitario(p, tiers[p]) * 1.05;
        const pedido = Number((dec.CMO as Record<string, number> | undefined)?.[`preco_${p}`] ?? PRODUTOS[p].ref);
        precos[p] = Math.max(piso, pedido);
        if (pedido < piso) auditoria.push({ acao: "preco_subido_ao_piso", payload: { produto: p, pedido, piso } });
      }

      const marketing = Math.max(0, Number(dec.CMO?.marketing ?? 0));
      const forca_vendas = estado.forca_vendas;
      const apMod = 1 + Math.tanh(marketing / 6000) * 0.15;

      const apelo: Record<Produto, number> = { cadeira: 0, mesa: 0, armario: 0 };
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const t = tiers[p];
        apelo[p] = (TIERS[t].qual * qualMult)
          * Math.sqrt(0.5 + estado.marca / 100)
          * Math.pow(PRODUTOS[p].ref / Math.max(1, precos[p]), ELAST)
          * (1 + 0.04 * forca_vendas)
          * apMod;
      }

      const export_share = clamp(Number(dec.CMO?.export_share ?? 0), 0, 0.5);
      const formacao = Math.max(0, Number(dec.CHRO?.formacao ?? 0));
      const ID_gasto = Math.max(0, Number(dec.CEO?.ID ?? 0));
      const salarios = meta.reduce((s, c) => s + 1600 * c.salario_mult, 0);

      const custoProd = (Object.keys(PRODUTOS) as Produto[])
        .reduce((s, p) => s + producao[p] * custoUnitario(p, tiers[p]), 0);
      const estrutura = salarios + 2500 + estado.ativos * 400 + marketing + forca_vendas * 2500 + formacao;
      const juros = estado.divida * ((macro.juro + 3.6) / 100) / 12;

      buffer.push({
        equipa_id: eq.id, mercado_id: eq.mercado_id, is_ia: eq.is_ia,
        estado, decisoesOrig: decisoesEq, decisoesFinais, auditoria,
        producao, qualMult, prodMult, tiers, precos, apelo,
        marketing, forca_vendas, ritmo,
        custos: { producao: custoProd, estrutura, ID: ID_gasto, juros },
        export_share, capex, formacao, salarios,
        empréstimo_novo: emprestimo_novo,
      });

      const arr = apeloPorMercado.get(eq.mercado_id) ?? [];
      arr.push({ equipa_id: eq.id, apelo, producao, precos, export_share });
      apeloPorMercado.set(eq.mercado_id, arr);
    }

    // Economia: procura por linha × quota → vendas por equipa/produto
    const rEventos = stream(Number(comp.seed) + ronda.indice * 7919, `eventos:${ronda.indice}`);
    const perfilChoque = (produto: Produto): number => {
      const perf = economia.perfis[produto];
      const base = perf.nivel * (1 + perf.tendencia * ronda.indice)
        * perf.sazonalidade[(ronda.indice - 1) % 12];
      const choque = perf.choques.filter((c) => c.turno === ronda.indice).reduce((s, c) => s + c.delta, 0);
      const emerg = economia.emergentes.filter((e) => e.turno <= ronda.indice && e.produto === produto)
        .reduce((s, e) => s + e.ganho, 0);
      return base * (1 + choque) * (1 + emerg);
    };

    const vendasPorEquipa = new Map<string, Record<Produto, number>>();
    const receitasPorEquipa = new Map<string, number>();
    for (const [_mercado_id, entradas] of apeloPorMercado) {
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const precoMedio = entradas.reduce((s, e) => s + e.precos[p], 0) / Math.max(1, entradas.length);
        const perfil = perfilChoque(p);
        const procura = PRODUTOS[p].procura_base
          * Math.pow(PRODUTOS[p].ref / Math.max(1, precoMedio), 0.4)
          * macro.crescimento
          * (macro.confianca / 100)
          * perfil;
        const somaApelo = entradas.reduce((s, e) => s + e.apelo[p], 0) || 1;
        for (const e of entradas) {
          const quota = e.apelo[p] / somaApelo;
          const vendasBrutas = Math.min(Math.round(procura * quota), e.producao[p]);
          const cur = vendasPorEquipa.get(e.equipa_id) ?? { cadeira: 0, mesa: 0, armario: 0 };
          cur[p] = vendasBrutas;
          vendasPorEquipa.set(e.equipa_id, cur);
          const receita = vendasBrutas * e.precos[p] * (1 - e.export_share + e.export_share * CONST.exportacao_mult);
          receitasPorEquipa.set(e.equipa_id, (receitasPorEquipa.get(e.equipa_id) ?? 0) + receita);
        }
      }
    }

    // Eventos §7.4 + gravação por equipa
    const snapshotsInsert: Record<string, unknown>[] = [];
    const eventosInsert: Record<string, unknown>[] = [];
    const resultadosInsert: Record<string, unknown>[] = [];
    const auditoriaInsert: Record<string, unknown>[] = [];

    for (const b of buffer) {
      const rEq = stream(Number(comp.seed) + ronda.indice * 104729, `equipa:${b.equipa_id}`);
      const vendas = vendasPorEquipa.get(b.equipa_id) ?? { cadeira: 0, mesa: 0, armario: 0 };
      const receita = receitasPorEquipa.get(b.equipa_id) ?? 0;

      // Eventos internos
      let modProd = 1, modStressDelta = 0, modMoralDelta = 0, modCompDelta = 0;
      const eventosEq: { tipo: string; magnitude?: number }[] = [];
      const tabela = [
        { tipo: "greve", prob: 0.03 * (b.estado.stress_org > 60 ? 1.5 : 1) },
        { tipo: "push_output", prob: 0.05 * (b.ritmo === "horas_extra" ? 1.5 : 1) },
        { tipo: "breakthrough_ID", prob: 0.02 * (b.custos.ID > 3000 ? 2 : 1) },
        { tipo: "saida_talento", prob: 0.03 * (b.estado.moral < 45 ? 2 : 1) },
        { tipo: "burnout", prob: 0.04 * (b.estado.stress_org > 70 ? 2 : 1) },
      ];
      for (const t of tabela) {
        if (rEq() < t.prob) {
          eventosEq.push({ tipo: t.tipo });
          if (t.tipo === "greve") modProd *= 0.55;
          if (t.tipo === "push_output") modProd *= 1.15;
          if (t.tipo === "saida_talento") modCompDelta -= 0.15;
          if (t.tipo === "burnout") modStressDelta += 12;
          if (t.tipo === "breakthrough_ID") modMoralDelta += 5;
        }
      }
      const receitaFinal = receita * modProd;

      // P&L
      const preImposto = receitaFinal - b.custos.producao - b.custos.estrutura - b.custos.ID - b.custos.juros;
      const baseTributavel = Math.max(0, preImposto - b.estado.prejuizos_acum);
      const imposto = baseTributavel * CONST.imposto;
      const resultado = preImposto - imposto;

      // Rollup pessoas → atualiza fatores
      const rollup = rollupPessoas(colabsPorEquipa.get(b.equipa_id) ?? []);
      const novoStress = clamp(b.estado.stress_org
        + (b.ritmo === "horas_extra" ? 6 : b.ritmo === "folga" ? -8 : 0)
        + modStressDelta - Math.min(6, b.formacao / 800), 0, 100);
      const novoMoral = clamp(b.estado.moral
        + (b.ritmo === "ferias" ? 5 : 0)
        + Math.min(8, b.formacao / 600)
        + (resultado > 0 ? 2 : -2) + modMoralDelta, 0, 100);
      const novaCompetencia = clamp(rollup.competencia_norm + modCompDelta, 0.5, 1.5);

      const capitalNovo = b.estado.caixa + receitaFinal - b.custos.producao - b.custos.estrutura
        - b.custos.ID - b.custos.juros - imposto - b.capex + b.empréstimo_novo;
      const dividaNova = b.estado.divida + b.empréstimo_novo;
      const ativosNovo = b.estado.ativos + b.capex / 10000;
      const marcaNovo = clamp(b.estado.marca + Math.min(8, b.marketing / 3000) - 1, 0, 100);
      const prejuizosNovo = preImposto < 0 ? b.estado.prejuizos_acum + Math.abs(preImposto) - imposto
        : Math.max(0, b.estado.prejuizos_acum - baseTributavel);
      const capNovo = b.estado.cap_producao + b.capex / 40;

      const snapshot = {
        turno: ronda.indice,
        caixa: capitalNovo, ativos: ativosNovo, marca: marcaNovo, divida: dividaNova,
        moral: novoMoral, stress_org: novoStress, ambicao_org: rollup.A,
        cap_producao: capNovo, forca_vendas: b.forca_vendas, supervisores: b.estado.supervisores,
        prejuizos_acum: prejuizosNovo,
        vendas, receita: receitaFinal, custos: b.custos, imposto, resultado,
        precos: b.precos, tiers: b.tiers, ritmo: b.ritmo,
        prodMult: b.prodMult, qualMult: b.qualMult, competencia_norm: novaCompetencia,
        macro,
        notas: b.auditoria,
      };
      snapshotsInsert.push({ equipa_id: b.equipa_id, ronda_id: ronda.id, snapshot });

      for (const ev of eventosEq) {
        eventosInsert.push({
          equipa_id: b.equipa_id, ronda_id: ronda.id, tipo: ev.tipo,
          efeito: {}, payload: { magnitude: ev.magnitude ?? 1 }, timing: "resolucao",
        });
      }
      // Valor "share-value"
      const valor = Math.max(0, capitalNovo)
        + ativosNovo * 30000 + marcaNovo * 1500 - dividaNova + Math.max(0, resultado) * 2;
      resultadosInsert.push({ equipa_id: b.equipa_id, ronda_id: ronda.id, valor });

      for (const a of b.auditoria) {
        auditoriaInsert.push({
          acao: `ronda:${a.acao}`, alvo: b.equipa_id,
          payload: { ronda_id: ronda.id, ...a.payload },
        });
      }
    }

    if (snapshotsInsert.length) await sb.from("estado_empresa").insert(snapshotsInsert);
    if (eventosInsert.length) await sb.from("eventos").insert(eventosInsert);
    if (resultadosInsert.length) await sb.from("resultados").insert(resultadosInsert);
    if (auditoriaInsert.length) await sb.from("log_auditoria").insert(auditoriaInsert);

    // Posicoes por mercado
    for (const [_mid, entradas] of apeloPorMercado) {
      const ranked = entradas
        .map((e) => ({ equipa_id: e.equipa_id, valor: (snapshotsInsert.find((s) => s.equipa_id === e.equipa_id) as { snapshot?: { caixa?: number } } | undefined)?.snapshot?.caixa ?? 0 }))
        .sort((a, b) => b.valor - a.valor);
      for (let i = 0; i < ranked.length; i++) {
        await sb.from("resultados").update({ posicao: i + 1 })
          .eq("equipa_id", ranked[i].equipa_id).eq("ronda_id", ronda.id);
      }
    }

    // Fecha esta ronda e abre a seguinte (se não for a última).
    await sb.from("rondas").update({ estado: "resolvida" }).eq("id", ronda.id);
    if (ronda.indice < comp.duracao_turnos) {
      await sb.from("rondas").insert({
        competicao_id: comp.id, indice: ronda.indice + 1, estado: "aberta",
        abre_em: new Date().toISOString(),
      });
    } else {
      await sb.from("competicoes").update({ estado: "terminada" }).eq("id", comp.id);
    }

    return json({ ok: true, equipas: buffer.length, turno: ronda.indice });
  } catch (e) {
    console.error("[resolver_ronda]", e);
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});

// ─── auxiliares ──────────────────────────────────────────────────────────────

function aplicarPoliticaEPrecedencia(
  decisoes: Decisao[],
  politica: string,
  _estado: EstadoBase,
): { decisoesFinais: Decisao[]; auditoria: { acao: string; payload: Record<string, unknown> }[] } {
  const porLugar = new Map<string, Decisao>();
  for (const d of decisoes) porLugar.set(d.lugar, d);
  const auditoria: { acao: string; payload: Record<string, unknown> }[] = [];
  const decisoesFinais: Decisao[] = [];
  for (const lugar of PRECEDENCIA) {
    const d = porLugar.get(lugar);
    if (d && d.submetido_em) {
      decisoesFinais.push(d);
    } else {
      auditoria.push({ acao: "ausente_aplicado", payload: { lugar, politica } });
      decisoesFinais.push({
        lugar,
        submetido_em: null,
        payload: politica === "pior_caso" ? { pior_caso: true } : { status_quo: true },
      });
    }
  }
  // Regra: linha em saída → produção anulada (COO)
  const cmo = porLugar.get("CMO")?.payload ?? {};
  const coo = porLugar.get("COO")?.payload as Record<string, unknown> | undefined;
  if (coo) {
    for (const p of ["cadeira", "mesa", "armario"]) {
      if ((cmo as Record<string, unknown>)[`descontinuar_${p}`] && Number(coo[`prod_${p}`] ?? 0) > 0) {
        auditoria.push({ acao: "producao_anulada_saida", payload: { produto: p, tinha: coo[`prod_${p}`] } });
        coo[`prod_${p}`] = 0;
      }
    }
  }
  return { decisoesFinais, auditoria };
}

function consolidar(decs: Decisao[]): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const d of decs) out[d.lugar] = (d.payload ?? {}) as Record<string, unknown>;
  return out;
}

function rollupPessoas(colabs: { motivacao: number; stress_individual: number; competencia: number; produtividade_base: number; necessidades: unknown; aptidao_gestao: number }[]) {
  if (!colabs.length) {
    return { M: 60, S: 40, A: 55, competencia_norm: 1, prodBase_media: 60, trab: 0, superv: 0 };
  }
  const media = (f: (c: typeof colabs[number]) => number) => colabs.reduce((s, c) => s + f(c), 0) / colabs.length;
  const M = media((c) => c.motivacao);
  const S = media((c) => c.stress_individual);
  const A = media((c) => ((c.necessidades as { ambicao?: number } | null)?.ambicao ?? 55));
  const competencia_media = media((c) => c.competencia);
  const prodBase_media = media((c) => c.produtividade_base);
  const superv = colabs.filter((c) => c.aptidao_gestao >= 60).length;
  const trab = colabs.length - superv;
  return { M, S, A, competencia_norm: competencia_media / 60, prodBase_media, trab, superv };
}

// pick usado apenas para simetria de imports.
void pick;
