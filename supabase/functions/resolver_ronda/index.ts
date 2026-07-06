// resolver_ronda — pipeline determinístico e server-authoritative.
// Esquema de decisões canónico (payload):
//   CEO:  { linhas_saida:string[], teto_divida:number, dividendos:number, postura:string }
//   CFO:  { markup:number, emprestimo:number, amortizar:number, capex:number,
//           id_orcamento:number, tesouraria:'conservador'|'equilibrado'|'agressivo',
//           usar_prejuizos:bool, seguro:bool }
//   COO:  { producao:{cadeira,mesa,armario}, tier, comprar_maquinas:number,
//           ritmo:'ferias'|'folga'|'normal'|'horas_extra', subcontratacao:number,
//           id_modo:'interno'|'licenca' }
//   CMO:  { preco:{cadeira,mesa,armario}, marketing:number,
//           canal:'grosso'|'direto'|'exportacao', forca_vendas:number, pesquisa_mercado:number }
//   CHRO: { salario:number, formacao:number, bonus:number, contratar:number,
//           despedir:number, promover_supervisor:bool, contratar_investigadores:number }
import { admin, corsHeaders, json } from "../_shared/supabase.ts";
import { clamp, stream } from "../_shared/prng.ts";
import {
  CONST, PRECEDENCIA, PRODUTOS, TIERS, type Produto, type Tier,
} from "../_shared/constants.ts";
import { gerarPoolCandidatos } from "../_shared/candidatos.ts";
import {
  ID_INICIAL, detetarPerfil, mediaJanela,
  proximoElegivel, type IdEstado, type JanelaDec, type Profile,
} from "../_shared/id_arvore.ts";

type Decisao = { lugar: string; payload: Record<string, unknown>; submetido_em: string | null };
type EstadoBase = {
  caixa: number; ativos: number; marca: number; divida: number;
  moral: number; stress_org: number; ambicao_org: number;
  maquinas: number; forca_vendas: number;
  trabalhadores: number; supervisores: number; investigadores: number;
  prejuizos_acum: number; historia: string[];
  id: IdEstado;
};

const DEFAULT_ESTADO = (capital: number): EstadoBase => ({
  caixa: capital, ativos: 1, marca: 40, divida: 0,
  moral: 65, stress_org: 30, ambicao_org: 55,
  maquinas: 6, forca_vendas: 3,
  trabalhadores: 8, supervisores: 1, investigadores: 0,
  prejuizos_acum: 0, historia: [],
  id: { ...ID_INICIAL },
});

// Horas-máquina por unidade produzida.
const MACH_H: Record<Produto, number> = { cadeira: 1, mesa: 2.5, armario: 4 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ronda_id } = await req.json();
    if (!ronda_id) throw new Error("ronda_id em falta");
    const sb = admin();

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

    // ─── Oponentes IA — gera decisões heurísticas determinísticas ─────────────
    // Perfis: agressivo_preco / foco_qualidade / equilibrado. Um por equipa IA.
    const IA_PERFIS = ["agressivo_preco", "foco_qualidade", "equilibrado"] as const;
    type IAPerfil = typeof IA_PERFIS[number];
    const iaDecisoesInsert: Record<string, unknown>[] = [];
    const iaAuditoria: Record<string, unknown>[] = [];
    for (const eq of equipasArr) {
      if (!eq.is_ia) continue;
      if ((decisoesPorEquipa.get(eq.id)?.length ?? 0) > 0) continue;
      const rIA = stream(Number(comp.seed) + ronda.indice * 7919, `ia:${eq.id}`);
      const perfil: IAPerfil = IA_PERFIS[Math.abs(hashLabel(eq.id)) % IA_PERFIS.length];
      const dec = gerarDecisoesIA(perfil, rIA, macro);
      iaAuditoria.push({ acao: "ronda:ia_decisoes_geradas", alvo: eq.id, payload: { ronda_id: ronda.id, perfil } });
      const agora = new Date().toISOString();
      for (const lugar of PRECEDENCIA) {
        const payload = dec[lugar];
        iaDecisoesInsert.push({
          ronda_id: ronda.id, equipa_id: eq.id, lugar,
          payload, submetido_em: agora, gerado_por_ia: true,
        });
        const arr = decisoesPorEquipa.get(eq.id) ?? [];
        arr.push({ lugar, payload, submetido_em: agora });
        decisoesPorEquipa.set(eq.id, arr);
      }
    }
    if (iaDecisoesInsert.length) {
      // A coluna gerado_por_ia é opcional; tenta insert com; se falhar, retira-a.
      const { error: eIA1 } = await sb.from("decisoes").insert(iaDecisoesInsert);
      if (eIA1) {
        const semFlag = iaDecisoesInsert.map((d) => {
          const { gerado_por_ia: _x, ...rest } = d as Record<string, unknown>;
          return rest;
        });
        await sb.from("decisoes").insert(semFlag);
      }
      await sb.from("log_auditoria").insert(iaAuditoria);
    }


    const { data: colabs } = await sb.from("colaboradores")
      .select("*").in("equipa_id", equipasArr.map((e) => e.id));
    const colabsPorEquipa = new Map<string, typeof colabs>();
    for (const c of colabs ?? []) {
      const arr = colabsPorEquipa.get(c.equipa_id) ?? [];
      arr.push(c);
      colabsPorEquipa.set(c.equipa_id, arr);
    }

    async function estadoPrevio(equipa_id: string): Promise<EstadoBase> {
      const { data } = await sb.from("estado_empresa")
        .select("snapshot, criado_em").eq("equipa_id", equipa_id)
        .order("criado_em", { ascending: false }).limit(1).maybeSingle();
      const base = DEFAULT_ESTADO(economia!.capital_inicial);
      if (data?.snapshot && typeof data.snapshot === "object") {
        return { ...base, ...(data.snapshot as Partial<EstadoBase>) };
      }
      // Deriva contagem de trabalhadores/supervisores da tabela colaboradores.
      const meta = colabsPorEquipa.get(equipa_id) ?? [];
      base.trabalhadores = meta.filter((c) => c.papel_org === "trabalhador").length || base.trabalhadores;
      base.supervisores = meta.filter((c) => c.papel_org === "supervisor").length || base.supervisores;
      base.investigadores = meta.filter((c) => c.papel_org === "investigador").length;
      return base;
    }

    // Janela dos últimos até 3 turnos para deteção de perfil emergente.
    async function janelaDec(equipa_id: string, decsAtual: Record<string, Record<string, unknown>>): Promise<Profile & { nome: string }> {
      const { data } = await sb.from("estado_empresa")
        .select("snapshot, criado_em").eq("equipa_id", equipa_id)
        .order("criado_em", { ascending: false }).limit(2);
      const amostras: JanelaDec[] = [];
      // Turno atual (a decidir).
      amostras.push({
        id_orcamento: Number(decsAtual.CFO?.id_orcamento ?? 0),
        contratar_investigadores: Number(decsAtual.CHRO?.contratar_investigadores ?? 0),
        wageRatio: Number(decsAtual.CHRO?.salario ?? 1),
        formacao: Number(decsAtual.CHRO?.formacao ?? 0),
        marketing: Number(decsAtual.CMO?.marketing ?? 0),
        producao_total: (() => {
          const pr = (decsAtual.COO?.producao as Record<string, number> | undefined) ?? {};
          return Number(pr.cadeira ?? 0) + Number(pr.mesa ?? 0) + Number(pr.armario ?? 0);
        })(),
      });
      for (const row of data ?? []) {
        const s = row.snapshot as Record<string, unknown> | null;
        if (!s) continue;
        const dec = (s.decisoes_resumo as Record<string, unknown> | undefined) ?? {};
        amostras.push({
          id_orcamento: Number(dec.id_orcamento ?? 0),
          contratar_investigadores: Number(dec.contratar_investigadores ?? 0),
          wageRatio: Number(dec.wageRatio ?? s.wageRatio ?? 1),
          formacao: Number(dec.formacao ?? 0),
          marketing: Number(dec.marketing ?? 0),
          producao_total: Number(dec.producao_total ?? 0),
        });
      }
      const med = mediaJanela(amostras);
      const { nome, profile } = detetarPerfil(med);
      return { ...profile, nome };
    }

    type BufItem = {
      equipa_id: string; mercado_id: string; is_ia: boolean; estado: EstadoBase;
      dec: Record<string, Record<string, unknown>>;
      auditoria: { acao: string; payload: Record<string, unknown> }[];
      aDelta: number;
      ritmo: string; overtime: number;
      tiers: Record<Produto, Tier>;
      producao: Record<Produto, number>;
      precos: Record<Produto, number>;
      apelo: Record<Produto, number>;
      qualMult: number; prodMult: number;
      scale: number; eventCapMult: number;
      marketing: number; forca_vendas: number;
      export_share: number;
      capex: number; comprarMaquinas: number; formacao: number; bonus: number;
      wageRatio: number; salarios: number;
      empréstimo_novo: number; amortizar: number; dividendos: number;
      rdCost: number; id_modo: string;
      custoUnit: Record<Produto, number>;
      profile: Profile; perfilNome: string;
    };

    const buffer: BufItem[] = [];
    const apeloPorMercado = new Map<string, BufItem[]>();

    // Custos de pesquisa (acoes_informacao.custo) desta ronda por equipa.
    const custosPesquisaPorEquipa = new Map<string, number>();
    {
      const { data: acoesRonda } = await sb
        .from("acoes_informacao")
        .select("equipa_id, custo")
        .eq("ronda_id", ronda.id);
      for (const a of (acoesRonda ?? []) as { equipa_id: string; custo: number | null }[]) {
        const v = Number(a.custo ?? 0);
        if (!v) continue;
        custosPesquisaPorEquipa.set(a.equipa_id, (custosPesquisaPorEquipa.get(a.equipa_id) ?? 0) + v);
      }
    }

    for (const eq of equipasArr) {
      const estado = await estadoPrevio(eq.id);
      const decisoesEq = decisoesPorEquipa.get(eq.id) ?? [];
      const { decisoesFinais, auditoria, aDelta } = aplicarPoliticaEPrecedencia(
        decisoesEq, comp.politica_ausente ?? "status_quo",
      );
      const dec = consolidar(decisoesFinais);

      // Regra CEO: linhas de saída → anula produção COO desse produto.
      const linhasSaida = Array.isArray(dec.CEO?.linhas_saida) ? (dec.CEO!.linhas_saida as string[]) : [];
      const coo = (dec.COO ?? {}) as Record<string, unknown>;
      const producaoDec = { ...(coo.producao as Record<string, number> | undefined) } ?? {};
      for (const p of linhasSaida) {
        if (Number(producaoDec[p] ?? 0) > 0) {
          auditoria.push({ acao: "producao_anulada_saida", payload: { produto: p, tinha: producaoDec[p] } });
          producaoDec[p] = 0;
        }
      }

      const meta = colabsPorEquipa.get(eq.id) ?? [];
      const rollup = rollupPessoas(meta);
      const trabalhadores = estado.trabalhadores;
      const supervisores = estado.supervisores;
      const investigadores = estado.investigadores;

      // Multiplicadores organizacionais.
      const coordPen = Math.max(0, (trabalhadores - supervisores * 8)) * 0.01;
      const prodMult = clamp(
        1 + 0.30 * ((rollup.M - 50) / 50)
          - 0.25 * (Math.max(0, rollup.S - 40) / 60)
          + 0.10 * ((rollup.A - 50) / 50)
          - coordPen,
        0.5, 1.4,
      );
      const skill = rollup.competencia_norm; // já normalizado ~1

      // Perfil emergente (janela últimos ≤3 turnos, incluindo o atual).
      const perfil = await janelaDec(eq.id, dec);
      const profile: Profile = { apMod: perfil.apMod, greveMod: perfil.greveMod, pushMod: perfil.pushMod, rdMod: perfil.rdMod, qMod: perfil.qMod };

      const qualMult = clamp(
        (1 + 0.20 * (skill - 1) + 0.10 * ((rollup.M - 50) / 50)) * profile.qMod,
        0.7, 1.35,
      );
      const wageRatio = Number(dec.CHRO?.salario ?? 1.0);
      const attrition = clamp(
        0.02 + 0.35 * Math.max(0, (50 - rollup.M) / 50)
          + 0.40 * Math.max(0, 1 - wageRatio)
          + 0.25 * Math.max(0, (rollup.S - 70) / 30),
        0, 0.6,
      );

      // Decisões COO — validação de tier vs. árvore de I&D.
      const ritmo = String((coo.ritmo as string) ?? "normal");
      const overtime = ritmo === "horas_extra" ? 40 : 0;
      const tierPedido = (coo.tier as Tier) ?? "standard";
      const idDesbl = new Set(estado.id.desbloqueados);
      let tierEfetivo: Tier = tierPedido;
      if (tierPedido === "fine" && !idDesbl.has("FINE")) {
        tierEfetivo = "standard";
        auditoria.push({ acao: "tier_reduzido_sem_ID", payload: { pedido: "fine", aplicado: "standard", falta: "FINE" } });
      } else if (tierPedido === "artisan" && !idDesbl.has("ARTISAN")) {
        tierEfetivo = idDesbl.has("FINE") ? "fine" : "standard";
        auditoria.push({ acao: "tier_reduzido_sem_ID", payload: { pedido: "artisan", aplicado: tierEfetivo, falta: "ARTISAN" } });
      }
      const tiers: Record<Produto, Tier> = { cadeira: tierEfetivo, mesa: tierEfetivo, armario: tierEfetivo };
      const subcontratacao = clamp(Number(coo.subcontratacao ?? 0), 0, 1);
      const comprarMaquinasPed = Math.max(0, Math.floor(Number(coo.comprar_maquinas ?? 0)));
      const capex = Math.max(0, Number(dec.CFO?.capex ?? 0)); // pago em caixa
      let comprarMaquinas = comprarMaquinasPed;
      if (comprarMaquinasPed * 60000 > capex) {
        comprarMaquinas = Math.floor(capex / 60000);
        auditoria.push({
          acao: "capex_limita_maquinas",
          payload: { pedido: comprarMaquinasPed, aplicado: comprarMaquinas, capex },
        });
      }
      const id_modo = String(coo.id_modo ?? "interno");

      const alvo: Record<Produto, number> = {
        cadeira: Math.max(0, Number(producaoDec.cadeira ?? 0)),
        mesa: Math.max(0, Number(producaoDec.mesa ?? 0)),
        armario: Math.max(0, Number(producaoDec.armario ?? 0)),
      };

      // Custo unitário — LEAN aplica −8% se desbloqueado.
      const lw = CONST.custo_hora;
      const leanMult = idDesbl.has("LEAN") ? 0.92 : 1;
      const custoUnit: Record<Produto, number> = { cadeira: 0, mesa: 0, armario: 0 };
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const t = tiers[p];
        const base = PRODUTOS[p].madeira * CONST.madeira_m3
          + PRODUTOS[p].mao * TIERS[t].mao_mult * lw
          + PRODUTOS[p].energia * (CONST.eletricidade_kwh + CONST.carbono_kwh)
          + PRODUTOS[p].consumivel;
        custoUnit[p] = base
          * (1 + (ritmo === "horas_extra" ? 0.25 * (overtime / 40) : 0))
          * (1 + subcontratacao * 0.18)
          * leanMult;
      }

      // Capacidade — AUTOMACAO aplica ×1.15 ao capMachine.
      const automacaoMult = idDesbl.has("AUTOMACAO") ? 1.15 : 1;
      const capLabour = (trabalhadores * 160 + overtime * trabalhadores) * prodMult;
      const capMachine = (estado.maquinas + comprarMaquinas) * 450 * prodMult * automacaoMult;
      const labNeed = (Object.keys(PRODUTOS) as Produto[])
        .reduce((s, p) => s + alvo[p] * PRODUTOS[p].mao * TIERS[tiers[p]].mao_mult, 0);
      const machNeed = (Object.keys(PRODUTOS) as Produto[])
        .reduce((s, p) => s + alvo[p] * MACH_H[p], 0);
      let scale = Math.min(1,
        labNeed > 0 ? capLabour / labNeed : 1,
        machNeed > 0 ? capMachine / machNeed : 1);
      if (scale < 1 && subcontratacao > 0) scale = Math.min(1, scale + subcontratacao);
      // eventCapMult é aplicado depois; aqui inicializamos a 1.
      const eventCapMult = 1;
      scale = scale * eventCapMult;

      const producao: Record<Produto, number> = {
        cadeira: Math.floor(alvo.cadeira * scale),
        mesa: Math.floor(alvo.mesa * scale),
        armario: Math.floor(alvo.armario * scale),
      };

      // Preços (piso = custo × 1.05 já é implícito no markup; validamos anti-abuso).
      const precoDec = (dec.CMO?.preco as Record<string, number> | undefined) ?? {};
      const precos: Record<Produto, number> = { cadeira: 0, mesa: 0, armario: 0 };
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const piso = custoUnit[p] * 1.05;
        const pedido = Number(precoDec[p] ?? PRODUTOS[p].ref);
        precos[p] = Math.max(piso, pedido);
        if (pedido < piso) auditoria.push({ acao: "preco_subido_ao_piso", payload: { produto: p, pedido, piso } });
      }

      // CFO — teto de dívida (imposto pelo CEO).
      const tetoDivida = Math.max(0, Number(dec.CEO?.teto_divida ?? Infinity));
      const emprestimoPed = Math.max(0, Number(dec.CFO?.emprestimo ?? 0));
      const emprestimoOk = Math.max(0, Math.min(emprestimoPed, tetoDivida - estado.divida));
      if (emprestimoPed > emprestimoOk) {
        auditoria.push({ acao: "emprestimo_clampado_teto", payload: { pedido: emprestimoPed, aplicado: emprestimoOk, teto: tetoDivida } });
      }
      const amortizar = Math.max(0, Math.min(Number(dec.CFO?.amortizar ?? 0), estado.divida + emprestimoOk));
      // capex já calculado acima (limita comprarMaquinas)

      const dividendos = Math.max(0, Number(dec.CEO?.dividendos ?? 0));
      const formacao = Math.max(0, Number(dec.CHRO?.formacao ?? 0));
      const bonus = Math.max(0, Number(dec.CHRO?.bonus ?? 0));
      const marketing = Math.max(0, Number(dec.CMO?.marketing ?? 0));
      const forca_vendas = Math.max(0, Number(dec.CMO?.forca_vendas ?? estado.forca_vendas));
      const canal = String(dec.CMO?.canal ?? "direto");
      const export_share = canal === "exportacao" ? 1 : 0;
      const id_orcamento = Math.max(0, Number(dec.CFO?.id_orcamento ?? 0));

      // Apelo com profile emergente.
      const apelo: Record<Produto, number> = { cadeira: 0, mesa: 0, armario: 0 };
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const t = tiers[p];
        apelo[p] = (TIERS[t].qual * qualMult)
          * Math.sqrt(0.5 + estado.marca / 100)
          * Math.pow(PRODUTOS[p].ref / Math.max(1, precos[p]), ELAST)
          * (1 + 0.04 * forca_vendas)
          * profile.apMod;
      }

      // Salários e I&D (custos preliminares — usados no P&L abaixo).
      const salarios = trabalhadores * 160 * lw * wageRatio
        + supervisores * 160 * lw * 1.4 * wageRatio
        + investigadores * 160 * lw * 1.6 * wageRatio;
      const rdCost = (id_modo === "licenca" ? 45000 : id_orcamento)
        + investigadores * 160 * lw;

      const item: BufItem = {
        equipa_id: eq.id, mercado_id: eq.mercado_id, is_ia: eq.is_ia,
        estado, dec, auditoria, aDelta,
        ritmo, overtime, tiers, producao, precos, apelo,
        qualMult, prodMult, scale, eventCapMult,
        marketing, forca_vendas,
        export_share,
        capex, comprarMaquinas, formacao, bonus,
        wageRatio, salarios,
        empréstimo_novo: emprestimoOk, amortizar, dividendos,
        rdCost, id_modo,
        custoUnit,
        profile, perfilNome: perfil.nome,
      };
      buffer.push(item);
      const arr = apeloPorMercado.get(eq.mercado_id) ?? [];
      arr.push(item);
      apeloPorMercado.set(eq.mercado_id, arr);
    }

    // Procura e quotas por mercado/produto.
    const perfilChoque = (produto: Produto): number => {
      const perf = economia.perfis[produto];
      if (!perf) return 1;
      const base = perf.nivel * (1 + perf.tendencia * ronda.indice)
        * perf.sazonalidade[(ronda.indice - 1) % 12];
      const choque = perf.choques.filter((c) => c.turno === ronda.indice).reduce((s, c) => s + c.delta, 0);
      const emerg = economia.emergentes.filter((e) => e.turno <= ronda.indice && e.produto === produto)
        .reduce((s, e) => s + e.ganho, 0);
      return base * (1 + choque) * (1 + emerg);
    };

    const vendasPorEquipa = new Map<string, Record<Produto, number>>();
    const receitasPorEquipa = new Map<string, number>();

    for (const [_m, entradas] of apeloPorMercado) {
      for (const p of Object.keys(PRODUTOS) as Produto[]) {
        const precoMedio = entradas.reduce((s, e) => s + e.precos[p], 0) / Math.max(1, entradas.length);
        const demand = PRODUTOS[p].procura_base
          * Math.pow(PRODUTOS[p].ref / Math.max(1, precoMedio), 0.4)
          * macro.crescimento
          * (macro.confianca / 100)
          * perfilChoque(p);
        const somaApelo = entradas.reduce((s, e) => s + e.apelo[p], 0) || 1;
        for (const e of entradas) {
          const quota = e.apelo[p] / somaApelo;
          const sold = Math.min(Math.round(demand * quota), Math.floor(e.producao[p]));
          const cur = vendasPorEquipa.get(e.equipa_id) ?? { cadeira: 0, mesa: 0, armario: 0 };
          cur[p] = sold;
          vendasPorEquipa.set(e.equipa_id, cur);
          const receitaP = sold * e.precos[p] * (1 - e.export_share + e.export_share * CONST.exportacao_mult);
          receitasPorEquipa.set(e.equipa_id, (receitasPorEquipa.get(e.equipa_id) ?? 0) + receitaP);
        }
      }
    }

    // Eventos internos + P&L + snapshots.
    const snapshotsInsert: Record<string, unknown>[] = [];
    const eventosInsert: Record<string, unknown>[] = [];
    const resultadosInsert: Record<string, unknown>[] = [];
    const auditoriaInsert: Record<string, unknown>[] = [];

    for (const b of buffer) {
      const rEq = stream(Number(comp.seed) + ronda.indice * 104729, `equipa:${b.equipa_id}`);
      const vendas = vendasPorEquipa.get(b.equipa_id) ?? { cadeira: 0, mesa: 0, armario: 0 };
      let receita = receitasPorEquipa.get(b.equipa_id) ?? 0;
      const profile = b.profile;
      const M = b.estado.moral, S = b.estado.stress_org;

      // Eventos (§8).
      const pGreve = clamp(
        (0.01 + 0.30 * Math.max(0, (50 - M) / 50) + 0.20 * Math.max(0, (S - 60) / 40)
          + 0.30 * Math.max(0, 1 - b.wageRatio)) * profile.greveMod, 0, 0.75,
      );
      const pPush = clamp(
        ((S < 40 ? 0.05 + 0.25 * Math.max(0, (M - 75) / 25) : 0)) * profile.pushMod, 0, 0.6,
      );
      const rdProgress = (b.estado.investigadores * 4 + (Number(b.dec.CFO?.id_orcamento ?? 0)) / 1500)
        * (0.7 + 0.3 * M / 100) * profile.rdMod;
      const pBreak = clamp(0.02 + 0.04 * Math.pow(rdProgress / 40, 1.4), 0, 0.6);

      let eventCapMult = 1, moralDelta = 0, stressDelta = 0, skillDelta = 0;
      const eventosEq: { tipo: string; magnitude?: number }[] = [];
      if (rEq() < pGreve) { eventCapMult *= 0.55; eventosEq.push({ tipo: "greve" }); }
      if (rEq() < pPush) { eventCapMult *= 1.15; eventosEq.push({ tipo: "push_output" }); }
      let breakthrough = false;
      if (rEq() < pBreak) { eventosEq.push({ tipo: "breakthrough_ID" }); moralDelta += 5; breakthrough = true; }
      if (rEq() < clamp(0.02 + 0.35 * Math.max(0, (50 - M) / 50) + 0.40 * Math.max(0, 1 - b.wageRatio) + 0.25 * Math.max(0, (S - 70) / 30), 0, 0.6) * 0.5) {
        eventosEq.push({ tipo: "saida_talento" }); skillDelta -= 0.15;
      }
      let burnout = false;
      if (S > 70 && rEq() < 0.4) { burnout = true; eventosEq.push({ tipo: "burnout" }); stressDelta += 10; }

      // Progressão da árvore de I&D.
      const idNovo: IdEstado = {
        desbloqueados: [...b.estado.id.desbloqueados],
        progresso: b.estado.id.progresso + rdProgress,
      };
      // Um desbloqueio por turno (o breakthrough força mesmo sem custo cumprido).
      const prox = proximoElegivel(idNovo);
      if (prox) {
        if (breakthrough || idNovo.progresso >= prox.custo) {
          idNovo.desbloqueados.push(prox.id);
          idNovo.progresso = Math.max(0, idNovo.progresso - prox.custo);
          eventosEq.push({ tipo: `ID_desbloqueado:${prox.id}` });
        }
      }

      // Aplica eventCapMult retroativamente (às vendas — proporção da capacidade).
      if (eventCapMult !== 1) {
        for (const p of Object.keys(PRODUTOS) as Produto[]) {
          const novo = Math.floor(vendas[p] * eventCapMult);
          receita -= vendas[p] * b.precos[p] * (1 - b.export_share + b.export_share * CONST.exportacao_mult);
          vendas[p] = novo;
          receita += novo * b.precos[p] * (1 - b.export_share + b.export_share * CONST.exportacao_mult);
        }
      }

      // P&L (fórmulas §7).
      const prodCost = (Object.keys(PRODUTOS) as Produto[])
        .reduce((s, p) => s + vendas[p] * b.custoUnit[p], 0);
      const wages = b.salarios; // já com ratio salarial aplicado
      const rent = 1500;
      const dep = (b.estado.maquinas + b.comprarMaquinas) * 1000;
      const custoPesquisas = custosPesquisaPorEquipa.get(b.equipa_id) ?? 0;
      const fixed = wages + rent + dep + b.formacao + b.marketing
        + b.forca_vendas * 2500 + Number(b.dec.CMO?.pesquisa_mercado ?? 0)
        + b.bonus
        + custoPesquisas;
      const juro = macro.juro;
      const interest = (b.estado.divida + b.empréstimo_novo) * ((juro + 3.6) / 100) / 12;
      const pre = receita - prodCost - fixed - b.rdCost - interest;
      const usarPrejuizos = Boolean(b.dec.CFO?.usar_prejuizos);
      const baseTributavel = usarPrejuizos ? Math.max(0, pre - b.estado.prejuizos_acum) : Math.max(0, pre);
      const imposto = baseTributavel * CONST.imposto;
      const net = pre - imposto;

      const equity = 0; // sem entradas de capital neste turno
      const comprarMaquinas = b.comprarMaquinas;
      const caixaNova = b.estado.caixa + net
        - comprarMaquinas * 60000
        + b.empréstimo_novo - b.amortizar
        + equity - b.dividendos;

      const dividaNova = b.estado.divida + b.empréstimo_novo - b.amortizar;
      const ativosNovo = b.estado.ativos + comprarMaquinas * 0.5;
      const marcaNovo = clamp(b.estado.marca + Math.min(8, b.marketing / 3000) - 1, 0, 100);
      const prejuizosNovo = pre < 0
        ? b.estado.prejuizos_acum + Math.abs(pre)
        : (usarPrejuizos ? Math.max(0, b.estado.prejuizos_acum - baseTributavel) : b.estado.prejuizos_acum);

      // Atualização de fatores (§9).
      const dM = ((b.wageRatio >= 1.10 ? 6 : b.wageRatio >= 1.0 ? 1 : -8)
        + (b.ritmo === "horas_extra" ? -4 : 0)
        + (b.formacao > 0 ? 3 : 0)
        + (b.bonus > 0 ? 4 : 0)
        + (b.dec.CHRO?.promover_supervisor ? 5 : 0)
        + moralDelta
        + (b.ritmo === "ferias" ? 5 : 0));
      const dS = ((b.ritmo === "horas_extra" ? 10 : -6)
        + (burnout ? 10 : 0)
        + (b.ritmo === "folga" ? -6 : 0)
        + (b.ritmo === "ferias" ? -20 : 0)
        + stressDelta);
      const dA = b.aDelta;

      const Mn = clamp(b.estado.moral + dM, 0, 100);
      const Sn = clamp(b.estado.stress_org + dS, 0, 100);
      const An = clamp(b.estado.ambicao_org + dA, 0, 100);

      // Contratações/despedimentos e promoções (aplicados ao snapshot).
      const contratar = Math.max(0, Math.floor(Number(b.dec.CHRO?.contratar ?? 0)));
      const despedir = Math.max(0, Math.floor(Number(b.dec.CHRO?.despedir ?? 0)));
      const promoverSup = Boolean(b.dec.CHRO?.promover_supervisor);
      const contratarInvest = Math.max(0, Math.floor(Number(b.dec.CHRO?.contratar_investigadores ?? 0)));
      const trabalhadoresNovo = Math.max(0, b.estado.trabalhadores + contratar - despedir - (promoverSup ? 1 : 0));
      const supervisoresNovo = b.estado.supervisores + (promoverSup ? 1 : 0);
      const investigadoresNovo = b.estado.investigadores + contratarInvest;

      const snapshot: EstadoBase & Record<string, unknown> = {
        caixa: caixaNova, ativos: ativosNovo, marca: marcaNovo, divida: dividaNova,
        moral: Mn, stress_org: Sn, ambicao_org: An,
        maquinas: b.estado.maquinas + comprarMaquinas,
        forca_vendas: b.forca_vendas,
        trabalhadores: trabalhadoresNovo, supervisores: supervisoresNovo, investigadores: investigadoresNovo,
        prejuizos_acum: prejuizosNovo, historia: [...b.estado.historia, `turno ${ronda.indice}`],
        id: idNovo,
        turno: ronda.indice, vendas, receita, prodCost, fixed, interest, imposto, resultado: net,
        precos: b.precos, tiers: b.tiers, ritmo: b.ritmo, wageRatio: b.wageRatio,
        prodMult: b.prodMult, qualMult: b.qualMult,
        perfil_emergente: b.perfilNome,
        decisoes_resumo: {
          id_orcamento: Number(b.dec.CFO?.id_orcamento ?? 0),
          contratar_investigadores: Number(b.dec.CHRO?.contratar_investigadores ?? 0),
          wageRatio: b.wageRatio,
          formacao: b.formacao,
          marketing: b.marketing,
          producao_total: b.producao.cadeira + b.producao.mesa + b.producao.armario,
        },
        macro, notas: b.auditoria,
      };
      snapshotsInsert.push({ equipa_id: b.equipa_id, ronda_id: ronda.id, snapshot });

      for (const ev of eventosEq) {
        eventosInsert.push({
          equipa_id: b.equipa_id, ronda_id: ronda.id, tipo: ev.tipo,
          efeito: {}, payload: {}, timing: "resolucao",
        });
      }
      const valor = Math.max(0, caixaNova) + ativosNovo * 30000 + marcaNovo * 1500 - dividaNova + Math.max(0, net) * 2;
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

    // Posições por mercado.
    for (const [_mid, entradas] of apeloPorMercado) {
      const ranked = entradas
        .map((e) => ({
          equipa_id: e.equipa_id,
          valor: Number(
            (resultadosInsert.find((r) => r.equipa_id === e.equipa_id) as { valor?: number } | undefined)?.valor ?? 0,
          ),
        }))
        .sort((a, b) => b.valor - a.valor);
      for (let i = 0; i < ranked.length; i++) {
        await sb.from("resultados").update({ posicao: i + 1 })
          .eq("equipa_id", ranked[i].equipa_id).eq("ronda_id", ronda.id);
      }
    }

    await sb.from("rondas").update({ estado: "resolvida" }).eq("id", ronda.id);
    if (ronda.indice < comp.duracao_turnos) {
      const dh = Number((comp.params as any)?.duracao_ronda_horas ?? 0);
      const abre = new Date();
      const prazo = dh > 0 ? new Date(abre.getTime() + dh * 3_600_000).toISOString() : null;
      await sb.from("rondas").insert({
        competicao_id: comp.id, indice: ronda.indice + 1, estado: "aberta",
        abre_em: abre.toISOString(), prazo_em: prazo,
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
): { decisoesFinais: Decisao[]; auditoria: { acao: string; payload: Record<string, unknown> }[]; aDelta: number } {
  const porLugar = new Map<string, Decisao>();
  for (const d of decisoes) porLugar.set(d.lugar, d);
  const auditoria: { acao: string; payload: Record<string, unknown> }[] = [];
  const decisoesFinais: Decisao[] = [];
  let aDelta = 2; // +2 base por turno
  for (const lugar of PRECEDENCIA) {
    const d = porLugar.get(lugar);
    if (d && d.submetido_em) {
      decisoesFinais.push(d);
    } else {
      auditoria.push({ acao: "ausente_aplicado", payload: { lugar, politica } });
      aDelta -= 3;
      decisoesFinais.push({
        lugar, submetido_em: null,
        payload: politica === "pior_caso" ? { pior_caso: true } : { status_quo: true },
      });
    }
  }
  return { decisoesFinais, auditoria, aDelta };
}

function consolidar(decs: Decisao[]): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const d of decs) out[d.lugar] = (d.payload ?? {}) as Record<string, unknown>;
  return out;
}

function rollupPessoas(colabs: { motivacao: number; stress_individual: number; competencia: number; produtividade_base: number; necessidades: unknown; aptidao_gestao: number; papel_org?: string }[]) {
  if (!colabs.length) {
    return { M: 60, S: 40, A: 55, competencia_norm: 1, prodBase_media: 60, trab: 0, superv: 0 };
  }
  const media = (f: (c: typeof colabs[number]) => number) =>
    colabs.reduce((s, c) => s + f(c), 0) / colabs.length;
  const M = media((c) => c.motivacao);
  const S = media((c) => c.stress_individual);
  const A = media((c) => ((c.necessidades as { ambicao?: number } | null)?.ambicao ?? 55));
  const competencia_media = media((c) => c.competencia);
  const prodBase_media = media((c) => c.produtividade_base);
  const superv = colabs.filter((c) => c.papel_org === "supervisor").length;
  const trab = colabs.filter((c) => c.papel_org === "trabalhador").length;
  return { M, S, A, competencia_norm: competencia_media / 60, prodBase_media, trab, superv };
}

// ─── IA — hash e política heurística ─────────────────────────────────────────
function hashLabel(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h | 0;
}

function gerarDecisoesIA(
  perfil: "agressivo_preco" | "foco_qualidade" | "equilibrado",
  r: () => number,
  macro: { confianca: number; crescimento: number },
): Record<string, Record<string, unknown>> {
  const jitter = (lo: number, hi: number) => lo + (hi - lo) * r();
  const procuraMult = (macro.confianca / 100) * macro.crescimento;

  // Preços — ratio × ref
  let precoRatio = 1.0, tier: "standard" | "fine" | "artisan" = "standard";
  let marketing = 2500, salario = 1.02, idOrc = 1000;
  let producaoMult = 1.0;
  if (perfil === "agressivo_preco") {
    precoRatio = jitter(0.85, 0.95); tier = "standard";
    marketing = Math.round(jitter(3000, 4200));
    salario = jitter(1.00, 1.03); idOrc = Math.round(jitter(500, 1500));
    producaoMult = jitter(1.05, 1.20);
  } else if (perfil === "foco_qualidade") {
    precoRatio = jitter(1.05, 1.20); tier = r() < 0.5 ? "fine" : "standard";
    marketing = Math.round(jitter(3500, 5000));
    salario = jitter(1.03, 1.08); idOrc = Math.round(jitter(2500, 4500));
    producaoMult = jitter(0.85, 1.00);
  } else {
    precoRatio = jitter(0.97, 1.05); tier = "standard";
    marketing = Math.round(jitter(2500, 3500));
    salario = jitter(1.00, 1.05); idOrc = Math.round(jitter(1000, 2500));
    producaoMult = jitter(0.95, 1.10);
  }

  const producao = {
    cadeira: Math.round(1400 * producaoMult * procuraMult),
    mesa: Math.round(500 * producaoMult * procuraMult),
    armario: Math.round(260 * producaoMult * procuraMult),
  };
  const preco = {
    cadeira: Math.round(72 * precoRatio),
    mesa: Math.round(150 * precoRatio),
    armario: Math.round(245 * precoRatio),
  };

  return {
    CEO: { linhas_saida: [], teto_divida: 200000, dividendos: 0, postura: `IA:${perfil}` },
    CFO: {
      markup: 0.25, emprestimo: 0, amortizar: 0, capex: 0,
      id_orcamento: idOrc, tesouraria: "equilibrado", usar_prejuizos: true, seguro: false,
    },
    COO: {
      producao, tier, comprar_maquinas: 0, ritmo: "normal",
      subcontratacao: 0, id_modo: "interno",
    },
    CMO: {
      preco, marketing, canal: "direto",
      forca_vendas: 3, pesquisa_mercado: 0,
    },
    CHRO: {
      salario, formacao: perfil === "foco_qualidade" ? 1500 : 500, bonus: 0,
      contratar: 0, despedir: 0, promover_supervisor: false, contratar_investigadores: 0,
    },
  };
}

