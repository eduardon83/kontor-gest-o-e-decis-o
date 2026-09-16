// Motor determinístico da "Crónica da Casa".
// Só escreve quando aconteceu algo notável. Voz sóbria, pretérito, 3ª pessoa.
// Sem IA. Moldes PT-PT editáveis (tabela moldes_texto), com defaults no código.

import { criarFuncaoTexto, type FuncaoTexto } from "./textos-render.ts";
import { DEFAULTS_TEXTO } from "./textos-catalogo.ts";

export type CronicaCtx = {
  equipa_id: string;
  ronda_id: string;
  turno: number;
  nomeEmpresa: string;
  snapshotAtual: {
    valor: number;
    resultado: number;
    quota: number;
    caixa: number;
    divida: number;
    marca: number;
    tier?: string;
    moral: number;
  };
  snapshotAnterior: {
    valor: number;
    resultado: number;
    quota: number;
    caixa: number;
    divida: number;
    marca: number;
  } | null;
  valoresPrevios: number[]; // até 2 valores anteriores (t-1, t-2), mais antigo primeiro
  resultadosPrevios: number[]; // resultados líquidos anteriores (t-1, t-2)
  posicaoAtual: number | null;
  posicaoAnterior: number | null;
  totalEquipasMercado: number;
  eventos: string[]; // greve, push_output, breakthrough_ID, saida_talento, burnout, ID_desbloqueado:xxx
  auditoria: { acao: string; payload: Record<string, unknown> }[];
  colabsMeta: Array<{
    id: string;
    nome: string | null;
    arquetipo: string | null;
    papel_org: string;
    entrou_ronda: number | null;
    antiguidade: number | null;
  }>;
  primeiroLucro: boolean;
  primeiroPrejuizo: boolean;
  regressoLucro: number;
};

export type CronicaEntrada = {
  equipa_id: string;
  ronda_id: string;
  indice_turno: number;
  tipo: string;
  texto: string;
  destaque: boolean;
  dados: Record<string, unknown>;
};

function nomeArquetipo(a: string | null): string {
  const t = (a ?? "").toLowerCase();
  if (t.includes("veter")) return "veterano";
  if (t.includes("talent")) return "talento";
  if (t.includes("estei")) return "esteio";
  if (t.includes("inqui")) return "inquieto";
  if (t.includes("aprend")) return "aprendiz";
  return "colaborador";
}

function papelRotulo(p: string): string {
  return ({ trabalhador: "trabalhador", supervisor: "supervisor", gestor_linha: "chefe de linha", investigador: "investigador" } as Record<string, string>)[p] ?? p;
}

function fmtEur(v: number): string {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10} k€`;
  return `${Math.round(v)} €`;
}

export function gerarCronica(
  ctx: CronicaCtx,
  t: FuncaoTexto = criarFuncaoTexto({}, DEFAULTS_TEXTO),
): CronicaEntrada[] {
  const out: CronicaEntrada[] = [];
  const seed = `${ctx.equipa_id}:${ctx.turno}`;
  const base = { turno: ctx.turno, equipa: ctx.nomeEmpresa };
  const push = (
    tipo: string,
    vars: Record<string, string | number | null | undefined>,
    destaque = false,
    dados: Record<string, unknown> = {},
  ) => {
    const texto = t(`cronica.${tipo}`, { ...base, ...vars }, seed);
    if (!texto) return;
    out.push({
      equipa_id: ctx.equipa_id, ronda_id: ctx.ronda_id, indice_turno: ctx.turno,
      tipo, texto, destaque, dados,
    });
  };

  const s = ctx.snapshotAtual;
  const p = ctx.snapshotAnterior;

  // ─── Resultado: primeiro lucro / primeiro prejuízo / regresso ────────────
  if (ctx.primeiroLucro && s.resultado > 0) {
    push("primeiro_lucro", { resultado: fmtEur(s.resultado) }, true, { resultado: s.resultado });
  } else if (ctx.primeiroPrejuizo && s.resultado < 0) {
    push("primeiro_prejuizo", { resultado: fmtEur(s.resultado) }, true, { resultado: s.resultado });
  } else if (ctx.regressoLucro >= 2 && s.resultado > 0) {
    push("regresso_lucro", { resultado: fmtEur(s.resultado), turnos_negativos: ctx.regressoLucro },
      false, { turnos_negativos: ctx.regressoLucro });
  }

  // ─── Séries de 3 ─────────────────────────────────────────────────────────
  if (ctx.valoresPrevios.length >= 2) {
    const [v2, v1] = ctx.valoresPrevios; // t-2, t-1
    const v0 = s.valor;
    const vars = { v2: fmtEur(v2), v1: fmtEur(v1), v0: fmtEur(v0) };
    if (v0 > v1 && v1 > v2) push("serie_crescimento", vars);
    else if (v0 < v1 && v1 < v2) push("serie_queda", vars);
  }

  // ─── Posição / quota ─────────────────────────────────────────────────────
  if (ctx.posicaoAtual != null && ctx.posicaoAnterior != null && ctx.posicaoAtual !== ctx.posicaoAnterior) {
    const vars = { atual: ctx.posicaoAtual, anterior: ctx.posicaoAnterior };
    if (ctx.posicaoAtual < ctx.posicaoAnterior) {
      push("subiu_ranking", vars, ctx.posicaoAtual === 1, { anterior: ctx.posicaoAnterior, atual: ctx.posicaoAtual });
    } else {
      push("desceu_ranking", vars, false, { anterior: ctx.posicaoAnterior, atual: ctx.posicaoAtual });
    }
  }
  if (p) {
    const dq = s.quota - p.quota;
    if (Math.abs(dq) >= 5) {
      push(dq > 0 ? "quota_ganha" : "quota_perdida",
        { quota: s.quota.toFixed(1), quota_delta: Math.abs(dq).toFixed(1) },
        false, { delta: dq, atual: s.quota });
    }
  }

  // ─── Finanças ────────────────────────────────────────────────────────────
  const auditTipos = new Set(ctx.auditoria.map((a) => a.acao));
  if (auditTipos.has("linha_credito_automatica")) {
    const a = ctx.auditoria.find((x) => x.acao === "linha_credito_automatica");
    const m = Number((a?.payload as { montante?: number } | undefined)?.montante ?? 0);
    push("credito_emergencia", { montante: fmtEur(m) }, true, { montante: m });
  }
  if (auditTipos.has("teto_divida_ultrapassado")) {
    push("teto_divida", {});
  }

  // ─── Eventos internos ────────────────────────────────────────────────────
  for (const ev of ctx.eventos) {
    if (ev === "greve") push("greve", {});
    else if (ev === "push_output") push("push_output", {});
    else if (ev === "breakthrough_ID") push("breakthrough", {}, true);
    else if (ev === "saida_talento") push("saida_talento", {});
    else if (ev === "burnout") push("burnout", {});
    else if (ev.startsWith("ID_desbloqueado:")) {
      const noId = ev.split(":")[1];
      push("id_desbloqueado", { no: noId }, false, { no: noId });
    }
  }

  // ─── Decisões anuladas / ajustadas ───────────────────────────────────────
  const ajustes = ctx.auditoria.filter((a) => a.acao === "id_alvo_ignorado" || a.acao === "promo_invalida");
  if (ajustes.length) {
    push("decisoes_ajustadas", { n: ajustes.length }, false, { n: ajustes.length });
  }

  // ─── Pessoas ─────────────────────────────────────────────────────────────
  const metaById = new Map(ctx.colabsMeta.map((c) => [c.id, c]));
  for (const a of ctx.auditoria) {
    if (a.acao === "contratacao") {
      const cid = String((a.payload as { candidato_id?: string }).candidato_id ?? "");
      push("contratacao", {}, false, { candidato_id: cid });
    } else if (a.acao === "pessoa_despedida") {
      const id = String((a.payload as { id?: string }).id ?? "");
      const c = metaById.get(id);
      const nome = (c?.nome && c.nome.trim()) || "um colaborador";
      const arq = nomeArquetipo(c?.arquetipo ?? null);
      const entrou = c?.entrou_ronda ?? null;
      const anos = entrou != null ? ctx.turno - entrou : (c?.antiguidade ?? null);
      const veteranoLongo = arq === "veterano" && (anos ?? 0) >= 4;
      if (veteranoLongo) {
        push("saida_veterano", { nome_pessoa: nome, anos, arquetipo: arq }, true, { id, anos });
      } else {
        push("despedimento", { nome_pessoa: nome, anos, arquetipo: arq }, false, { id, anos });
      }
    } else if (a.acao === "pessoa_promovida") {
      const id = String((a.payload as { id?: string }).id ?? "");
      const novo = String((a.payload as { novo?: string }).novo ?? "");
      const c = metaById.get(id);
      const nome = (c?.nome && c.nome.trim()) || "um colaborador";
      const foiAprendiz = nomeArquetipo(c?.arquetipo ?? null) === "aprendiz";
      push(foiAprendiz ? "promocao_aprendiz" : "promocao",
        { nome_pessoa: nome, papel: papelRotulo(novo) }, foiAprendiz, { id, novo });
    } else if (a.acao === "promocao_merito") {
      const id = String((a.payload as { id?: string }).id ?? "");
      const c = metaById.get(id);
      const nome = (c?.nome && c.nome.trim()) || "um colaborador";
      push("promocao_merito", { nome_pessoa: nome }, false, { id });
    }
  }

  // ─── Fallback: turno sem registo digno de nota ───────────────────────────
  if (out.length === 0) push("silencio", {});

  return out;
}
