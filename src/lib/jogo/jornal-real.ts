// Geradores determinísticos do Jornal em modo real.
// Os textos vêm dos moldes editáveis (cascata competição → instituição → global),
// com os defaults do catálogo como fallback final. PT-PT.

import type { Rival, Snapshot, SnapshotRegisto, DecisaoRegisto } from "@/components/jogo/JogoContext";
import type { Lugar } from "@/lib/jogo/tipos";
import { criarFuncaoTexto, type FuncaoTexto } from "@/lib/textos/render";
import { DEFAULTS_TEXTO } from "@/lib/textos/catalogo";

/** Função de texto por omissão: só defaults do código. */
const T_DEFAULT: FuncaoTexto = criarFuncaoTexto({}, DEFAULTS_TEXTO);

export type Manchete = { tag: string; titulo: string; sub?: string };
export type Anuncio = { casa: string; tamanho: "grande" | "media" | "pequena"; titulo: string; corpo: string };
export type Carta = { autor: string; assunto: string; corpo: string };

function eur(n: number): string {
  const abs = Math.abs(Math.round(n));
  if (abs >= 1000) return `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k €`;
  return `${Math.round(n)} €`;
}

function pct(n: number, casas = 0): string {
  return `${n.toFixed(casas)}%`;
}

/* ============================================================
 * MANCHETE PRINCIPAL — o acontecimento mais saliente do mercado
 * ============================================================ */
export function manchetePrincipal(args: {
  rivaisAtuais: Rival[];
  rivaisAnteriores: Rival[];
  snapshotAtual: Snapshot | null;
  snapshotAnterior: Snapshot | null;
  competicao_nome: string;
  equipa_nome: string;
  turno: number;
  t?: FuncaoTexto;
}): Manchete {
  const { rivaisAtuais, rivaisAnteriores, snapshotAtual, competicao_nome, equipa_nome, turno } = args;
  const t = args.t ?? T_DEFAULT;
  const seed = `jornal:${competicao_nome}:${turno}`;

  // Falências (valor ≤ 0)
  const falidos = rivaisAtuais.filter((r) => r.valor <= 0);
  if (falidos.length) {
    const vars = { turno, nomes: falidos.map((f) => f.nome).join(" e "), n: falidos.length, competicao: competicao_nome };
    return {
      tag: "Falência",
      titulo: t("jornal.manchete.falencia.titulo", vars, seed),
      sub: t("jornal.manchete.falencia.sub", vars, seed),
    };
  }

  // Maior variação de valor (subida ou queda) desde a ronda anterior
  if (rivaisAnteriores.length && rivaisAtuais.length) {
    const mapaAnt = new Map(rivaisAnteriores.map((r) => [r.equipa_id, r.valor]));
    const variacoes = rivaisAtuais
      .map((r) => ({ r, delta: r.valor - (mapaAnt.get(r.equipa_id) ?? r.valor) }))
      .filter((x) => Math.abs(x.delta) > 1000);
    variacoes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const top = variacoes[0];
    if (top && Math.abs(top.delta) >= 5000) {
      const chave = top.delta > 0 ? "subida" : "queda";
      const vars = { turno, rival: top.r.nome, valor: eur(top.r.valor), delta: eur(Math.abs(top.delta)) };
      return {
        tag: top.delta > 0 ? "Movimento" : "Queda",
        titulo: t(`jornal.manchete.${chave}.titulo`, vars, seed),
        sub: t(`jornal.manchete.${chave}.sub`, vars, seed),
      };
    }
  }

  // Líder destacado (top vs 2º com folga)
  if (rivaisAtuais.length >= 2) {
    const ord = [...rivaisAtuais].sort((a, b) => b.valor - a.valor);
    const folga = ord[0].valor - ord[1].valor;
    const vars = {
      turno,
      lider: ord[0].nome,
      segundo: ord[1].nome,
      valor: eur(ord[0].valor),
      folga: eur(folga),
    };
    if (folga > ord[1].valor * 0.35) {
      return {
        tag: "Liderança",
        titulo: t("jornal.manchete.lideranca.titulo", vars, seed),
        sub: t("jornal.manchete.lideranca.sub", vars, seed),
      };
    }
    return {
      tag: "Praça",
      titulo: t("jornal.manchete.praca.titulo", vars, seed),
      sub: t("jornal.manchete.praca.sub", vars, seed),
    };
  }

  // Fallback com dados da equipa
  const rl = Number((snapshotAtual as any)?.financeiro?.pnl?.resultado_liquido ?? 0);
  if (Math.abs(rl) >= 1) {
    const vars = { turno, equipa: equipa_nome, resultado: eur(Math.abs(rl)) };
    return {
      tag: "Resultados",
      titulo: t(`jornal.manchete.${rl >= 0 ? "lucro" : "prejuizo"}.titulo`, vars, seed),
    };
  }
  return { tag: competicao_nome, titulo: t("jornal.manchete.sem_eventos.titulo", { turno }, seed) };
}

/* ============================================================
 * NOTÍCIAS DE ECONOMIA — política monetária, preços, ciclo
 * ============================================================ */
export function noticiasEconomia(args: {
  macroAtual: any;
  macroAnterior: any;
  faseEcon: string | null;
  turno?: number;
  t?: FuncaoTexto;
}): Manchete[] {
  const { macroAtual, macroAnterior, faseEcon } = args;
  const t = args.t ?? T_DEFAULT;
  const seed = `economia:${args.turno ?? 0}`;
  const out: Manchete[] = [];
  if (faseEcon) out.push({ tag: "Ciclo", titulo: t("jornal.economia.ciclo", { fase: faseEcon }, seed) });
  if (macroAtual) {
    const dJuro = macroAnterior ? macroAtual.juro - macroAnterior.juro : 0;
    if (Math.abs(dJuro) >= 0.25) {
      const vars = {
        direcao: dJuro > 0 ? "sobe" : "desce",
        juro: macroAtual.juro.toFixed(2),
        delta: Math.abs(dJuro).toFixed(2),
        sinal: dJuro > 0 ? "+" : "−",
      };
      out.push({
        tag: "Política monetária",
        titulo: t("jornal.economia.juro_variacao", vars, seed),
        sub: t("jornal.economia.juro_variacao.sub", vars, seed),
      });
    } else {
      out.push({
        tag: "Política monetária",
        titulo: t("jornal.economia.juro_estavel", { juro: macroAtual.juro.toFixed(2) }, seed),
      });
    }
    const dInf = macroAnterior ? macroAtual.inflacao - macroAnterior.inflacao : 0;
    out.push({
      tag: "Preços",
      titulo: t(
        "jornal.economia.inflacao",
        {
          direcao: dInf > 0 ? "acelera" : dInf < 0 ? "abranda" : "mantém-se",
          inflacao: macroAtual.inflacao.toFixed(1),
        },
        seed,
      ),
    });
    out.push({
      tag: "Confiança",
      titulo: t("jornal.economia.confianca", { confianca: Math.round(macroAtual.confianca) }, seed),
      sub: t(
        "jornal.economia.confianca.sub",
        { crescimento: (macroAtual.crescimento * 100 - 100).toFixed(1) },
        seed,
      ),
    });
  }
  return out;
}

/* ============================================================
 * COLUNA DE OPINIÃO — voz própria e recorrente, tom seco e irónico
 * ============================================================ */
function hhi(rivais: Rival[]): number {
  const total = rivais.reduce((s, r) => s + Math.max(0, r.valor), 0);
  if (total <= 0) return 0;
  return rivais.reduce((s, r) => {
    const q = (Math.max(0, r.valor) / total) * 100;
    return s + q * q;
  }, 0);
}

export function colunaOpiniao(args: {
  rivaisAtuais: Rival[];
  rivaisAnteriores: Rival[];
  snapshotAtual: Snapshot | null;
  snapshotAnterior: Snapshot | null;
  turno: number;
  t?: FuncaoTexto;
}): { autor: string; titulo: string; corpo: string } | null {
  const { rivaisAtuais, rivaisAnteriores, snapshotAtual, snapshotAnterior, turno } = args;
  const t = args.t ?? T_DEFAULT;
  const seed = `opiniao:${turno}`;
  const autor = t("jornal.opiniao.autor", {}, seed);
  const angulo = (chave: string, vars: Record<string, string | number>) => ({
    autor,
    titulo: t(`jornal.opiniao.${chave}.titulo`, vars, seed),
    corpo: t(`jornal.opiniao.${chave}.corpo`, vars, seed),
  });

  // Sinal 1: concentração de quota (HHI)
  const conc = hhi(rivaisAtuais);
  const concAnt = hhi(rivaisAnteriores);
  const dConc = conc - concAnt;

  // Sinal 2: preços médios da nossa cesta (proxy do mercado)
  const precosAt = (snapshotAtual as any)?.precos ?? (snapshotAtual as any)?.macro?.precos ?? null;
  const precosAnt = (snapshotAnterior as any)?.precos ?? (snapshotAnterior as any)?.macro?.precos ?? null;
  const mediaPreco = (o: any) => {
    if (!o || typeof o !== "object") return 0;
    const vals = Object.values(o).map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
    if (!vals.length) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };
  const dPreco = mediaPreco(precosAt) - mediaPreco(precosAnt);

  // Sinal 3: tier médio (corrida à qualidade)
  const tiersAt = (snapshotAtual as any)?.tiers ?? null;
  const tiersAnt = (snapshotAnterior as any)?.tiers ?? null;
  const mediaTier = (o: any) => {
    if (!o || typeof o !== "object") return 0;
    const vals = Object.values(o).map((v) => Number(v)).filter((n) => Number.isFinite(n));
    if (!vals.length) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };
  const dTier = mediaTier(tiersAt) - mediaTier(tiersAnt);

  // Escolher UM ângulo dominante
  if (conc >= 4500) return angulo("concentracao", { turno, hhi: Math.round(conc) });
  if (dConc <= -400) return angulo("fragmentacao", { turno, delta: Math.round(Math.abs(dConc)) });
  if (dPreco < -3) return angulo("guerra_precos", { turno, delta: Math.abs(dPreco).toFixed(1) });
  if (dTier > 0.2) return angulo("qualidade", { turno, delta: dTier.toFixed(1) });
  if (dPreco > 2) return angulo("precos_alta", { turno, delta: dPreco.toFixed(1) });
  // Ângulo genérico só se houver mesmo pouco para dizer
  if (turno <= 1) return null;
  return angulo("calmo", { turno });
}

/* ============================================================
 * ANÚNCIOS DAS CASAS — deriva de decisões reais (via snapshot)
 * ============================================================ */
export function anunciosDasCasas(args: {
  rivaisAtuais: Rival[];
  rivaisAnteriores: Rival[];
  snapshotAtual: Snapshot | null;
  decisoes: Partial<Record<Lugar, DecisaoRegisto>>;
  equipa_nome: string;
  turno?: number;
  t?: FuncaoTexto;
}): Anuncio[] {
  const { rivaisAtuais, rivaisAnteriores, decisoes, equipa_nome } = args;
  const t = args.t ?? T_DEFAULT;
  const seed = `anuncios:${equipa_nome}:${args.turno ?? 0}`;
  const out: Anuncio[] = [];

  // Anúncio da NOSSA casa — derivado das nossas decisões reais
  const cmo = (decisoes.CMO?.payload ?? {}) as any;
  const ceo = (decisoes.CEO?.payload ?? {}) as any;
  const coo = (decisoes.COO?.payload ?? {}) as any;
  const marketing = Number(cmo?.marketing_total ?? cmo?.marketing ?? 0);
  const exportacao = Boolean(cmo?.exportar ?? cmo?.canal_exportacao ?? false);
  const tierMedio = (() => {
    const tt = coo?.tier ?? coo?.tiers ?? {};
    if (typeof tt === "number") return tt;
    if (tt && typeof tt === "object") {
      const vals = Object.values(tt).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    return 0;
  })();
  const postura = (ceo?.postura ?? ceo?.postura_estrategica ?? null) as string | null;

  const nosso = (chave: string, tamanho: Anuncio["tamanho"]) => {
    const vars = { equipa: equipa_nome, equipa_maiusculas: equipa_nome.toUpperCase() };
    out.push({
      casa: equipa_nome,
      tamanho,
      titulo: t(`jornal.anuncio.${chave}.titulo`, vars, seed),
      corpo: t(`jornal.anuncio.${chave}.corpo`, vars, seed),
    });
  };

  if (marketing >= 8000) nosso("marketing", "grande");
  else if (exportacao) nosso("exportacao", "media");
  else if (tierMedio >= 2.4) nosso("qualidade", "media");
  else if (postura === "agressiva") nosso("agressiva", "pequena");

  // Anúncios das rivais — derivados de rank e trajetória de valor
  const mapaAnt = new Map(rivaisAnteriores.map((r) => [r.equipa_id, r.valor]));
  const ord = [...rivaisAtuais].sort((a, b) => b.valor - a.valor);
  const nossa = new Set([equipa_nome]);

  // Líder → anúncio de prestígio
  const lider = ord.find((r) => !nossa.has(r.nome));
  if (lider && lider.valor > 0) {
    const vars = { rival: lider.nome, valor: eur(lider.valor) };
    out.push({
      casa: lider.nome,
      tamanho: "media",
      titulo: t("jornal.anuncio.lider.titulo", vars, seed),
      corpo: t("jornal.anuncio.lider.corpo", vars, seed),
    });
  }

  // Maior salto → anúncio de expansão
  const saltador = rivaisAtuais
    .map((r) => ({ r, delta: r.valor - (mapaAnt.get(r.equipa_id) ?? r.valor) }))
    .filter((x) => !nossa.has(x.r.nome) && x.delta > 3000)
    .sort((a, b) => b.delta - a.delta)[0];
  if (saltador) {
    const vars = { rival: saltador.r.nome };
    out.push({
      casa: saltador.r.nome,
      tamanho: "pequena",
      titulo: t("jornal.anuncio.expansao.titulo", vars, seed),
      corpo: t("jornal.anuncio.expansao.corpo", vars, seed),
    });
  }

  // Maior queda → anúncio discreto
  const cadente = rivaisAtuais
    .map((r) => ({ r, delta: r.valor - (mapaAnt.get(r.equipa_id) ?? r.valor) }))
    .filter((x) => !nossa.has(x.r.nome) && x.delta < -3000)
    .sort((a, b) => a.delta - b.delta)[0];
  if (cadente && cadente.r.valor > 0) {
    const vars = { rival: cadente.r.nome };
    out.push({
      casa: cadente.r.nome,
      tamanho: "pequena",
      titulo: t("jornal.anuncio.liquidacao.titulo", vars, seed),
      corpo: t("jornal.anuncio.liquidacao.corpo", vars, seed),
    });
  }

  return out.slice(0, 4);
}

/* ============================================================
 * CARTAS AO DIRETOR — ocasionais, disparadas por eventos
 * ============================================================ */
export function cartasAoDiretor(
  notas: { acao: string; payload?: any }[],
  opcoes?: { turno?: number; t?: FuncaoTexto },
): Carta[] {
  const t = opcoes?.t ?? T_DEFAULT;
  const turno = opcoes?.turno ?? 0;
  const seed = `cartas:${turno}`;
  const cartas: Carta[] = [];
  const acoes = notas.map((n) => n.acao);

  const carta = (chave: string) =>
    cartas.push({
      autor: t(`jornal.carta.${chave}.autor`, { turno }, seed),
      assunto: t(`jornal.carta.${chave}.assunto`, { turno }, seed),
      corpo: t(`jornal.carta.${chave}.corpo`, { turno }, seed),
    });

  if (acoes.some((a) => /greve|paraliza/i.test(a))) carta("greve");
  if (acoes.some((a) => /breakthrough|descoberta|patent/i.test(a))) carta("breakthrough");
  if (acoes.some((a) => /credito_automatica|linha_credito/i.test(a))) carta("credito");
  if (acoes.some((a) => /despedi/i.test(a))) carta("despedimento");

  return cartas.slice(0, 2);
}

/* ============================================================
 * NECROLOGIA — quando uma casa colapsa
 * ============================================================ */
export function necrologia(args: {
  rivaisAtuais: Rival[];
  rivaisAnteriores: Rival[];
  turno?: number;
  t?: FuncaoTexto;
}): string[] {
  const { rivaisAtuais, rivaisAnteriores } = args;
  const t = args.t ?? T_DEFAULT;
  const turno = args.turno ?? 0;
  const seed = `necrologia:${turno}`;
  const mapaAnt = new Map(rivaisAnteriores.map((r) => [r.equipa_id, r.valor]));
  const mortas = rivaisAtuais.filter((r) => r.valor <= 0 && (mapaAnt.get(r.equipa_id) ?? 0) > 0);
  return mortas.map((m) =>
    t("jornal.necrologia", { rival: m.nome, valor: eur(mapaAnt.get(m.equipa_id) ?? 0), turno }, seed),
  );
}

/* ============================================================
 * WATERFALL — dados para o ritual e para o jornal
 * ============================================================ */
export type PassoWaterfall = { rotulo: string; valor: number; tipo: "positivo" | "negativo" | "acumulado" };

export function waterfallDaPnL(fin: any): PassoWaterfall[] {
  if (!fin?.pnl) return [];
  const p = fin.pnl;
  return [
    { rotulo: "Receita", valor: Number(p.receita?.total ?? 0), tipo: "positivo" },
    { rotulo: "Custo das vendas", valor: -Number(p.cogs?.total ?? 0), tipo: "negativo" },
    { rotulo: "Margem bruta", valor: Number(p.margem_bruta ?? 0), tipo: "acumulado" },
    { rotulo: "Estrutura", valor: -Number(p.estrutura?.total ?? 0), tipo: "negativo" },
    { rotulo: "I&D", valor: -Number(p.id?.total ?? 0), tipo: "negativo" },
    { rotulo: "Juros", valor: -Number(p.juros ?? 0), tipo: "negativo" },
    { rotulo: "Imposto", valor: -Number(p.imposto?.valor ?? 0), tipo: "negativo" },
    { rotulo: "Resultado líquido", valor: Number(p.resultado_liquido ?? 0), tipo: "acumulado" },
  ];
}
