// Motor determinístico da "Crónica da Casa".
// Só escreve quando aconteceu algo notável. Voz sóbria, pretérito, 3ª pessoa.
// Sem IA. Moldes PT-PT com variação por dados.

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
  primeiroLucro: boolean; // este é o primeiro lucro alguma vez
  primeiroPrejuizo: boolean;
  regressoLucro: number; // se >0, número de turnos negativos consecutivos antes deste positivo
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

export function gerarCronica(ctx: CronicaCtx): CronicaEntrada[] {
  const out: CronicaEntrada[] = [];
  const push = (tipo: string, texto: string, destaque = false, dados: Record<string, unknown> = {}) =>
    out.push({
      equipa_id: ctx.equipa_id, ronda_id: ctx.ronda_id, indice_turno: ctx.turno,
      tipo, texto, destaque, dados,
    });

  const s = ctx.snapshotAtual;
  const p = ctx.snapshotAnterior;

  // ─── Resultado: primeiro lucro / primeiro prejuízo / regresso ao lucro ────
  if (ctx.primeiroLucro && s.resultado > 0) {
    push("primeiro_lucro",
      `A casa fechou o turno ${ctx.turno} com o seu primeiro lucro: ${fmtEur(s.resultado)}. Ficou assente que era possível.`,
      true, { resultado: s.resultado });
  } else if (ctx.primeiroPrejuizo && s.resultado < 0) {
    push("primeiro_prejuizo",
      `Pela primeira vez, a casa fechou o turno em prejuízo: ${fmtEur(s.resultado)}. Ficou o registo por escrito.`,
      true, { resultado: s.resultado });
  } else if (ctx.regressoLucro >= 2 && s.resultado > 0) {
    push("regresso_lucro",
      `Depois de ${ctx.regressoLucro} turnos no vermelho, a casa voltou ao lucro no turno ${ctx.turno} (${fmtEur(s.resultado)}).`,
      false, { turnos_negativos: ctx.regressoLucro });
  }

  // ─── Séries de 3 ────────────────────────────────────────────────────────
  if (ctx.valoresPrevios.length >= 2) {
    const [v2, v1] = ctx.valoresPrevios; // t-2, t-1
    const v0 = s.valor;
    if (v0 > v1 && v1 > v2) {
      push("serie_crescimento",
        `Terceiro turno consecutivo a valorizar: ${fmtEur(v2)} → ${fmtEur(v1)} → ${fmtEur(v0)}.`);
    } else if (v0 < v1 && v1 < v2) {
      push("serie_queda",
        `Terceiro turno consecutivo a perder valor: ${fmtEur(v2)} → ${fmtEur(v1)} → ${fmtEur(v0)}.`);
    }
  }

  // ─── Posição / quota ─────────────────────────────────────────────────────
  if (ctx.posicaoAtual != null && ctx.posicaoAnterior != null && ctx.posicaoAtual !== ctx.posicaoAnterior) {
    if (ctx.posicaoAtual < ctx.posicaoAnterior) {
      push("subiu_ranking",
        `A casa subiu ao ${ctx.posicaoAtual}º lugar no mercado (era ${ctx.posicaoAnterior}º).`,
        ctx.posicaoAtual === 1, { anterior: ctx.posicaoAnterior, atual: ctx.posicaoAtual });
    } else {
      push("desceu_ranking",
        `A casa desceu para o ${ctx.posicaoAtual}º lugar (vinha do ${ctx.posicaoAnterior}º).`,
        false, { anterior: ctx.posicaoAnterior, atual: ctx.posicaoAtual });
    }
  }
  if (p) {
    const dq = s.quota - p.quota;
    if (Math.abs(dq) >= 5) {
      push(dq > 0 ? "quota_ganha" : "quota_perdida",
        dq > 0
          ? `Ganhou ${dq.toFixed(1)} pontos de quota, para ${s.quota.toFixed(1)}%.`
          : `Perdeu ${Math.abs(dq).toFixed(1)} pontos de quota, para ${s.quota.toFixed(1)}%.`,
        false, { delta: dq, atual: s.quota });
    }
  }

  // ─── Finanças: crédito, teto de dívida, empréstimo novo ─────────────────
  const auditTipos = new Set(ctx.auditoria.map((a) => a.acao));
  if (auditTipos.has("linha_credito_automatica")) {
    const a = ctx.auditoria.find((x) => x.acao === "linha_credito_automatica");
    const m = Number((a?.payload as { montante?: number } | undefined)?.montante ?? 0);
    push("credito_emergencia",
      `A caixa fechou negativa e obrigou a recorrer a uma linha de crédito de emergência de ${fmtEur(m)}, a juro punitivo.`,
      true, { montante: m });
  }
  if (auditTipos.has("teto_divida_ultrapassado")) {
    push("teto_divida",
      `A dívida ultrapassou o teto que a casa tinha fixado para si própria.`,
      false, {});
  }

  // ─── Eventos internos ────────────────────────────────────────────────────
  for (const ev of ctx.eventos) {
    if (ev === "greve") {
      push("greve",
        `Houve greve nas linhas. A produção do turno saiu bem abaixo do previsto.`,
        false, {});
    } else if (ev === "push_output") {
      push("push_output",
        `A moral alta empurrou a produção para além do previsto: o turno rendeu mais do que se pediu.`);
    } else if (ev === "breakthrough_ID") {
      push("breakthrough",
        `O laboratório teve uma noite feliz: um avanço inesperado destrancou trabalho de meses.`,
        true, {});
    } else if (ev === "saida_talento") {
      push("saida_talento",
        `A casa perdeu um talento para a concorrência. A investigação ficou mais pobre.`,
        false, {});
    } else if (ev === "burnout") {
      push("burnout",
        `Registaram-se casos de esgotamento. O ritmo cobrou preço.`,
        false, {});
    } else if (ev.startsWith("ID_desbloqueado:")) {
      const noId = ev.split(":")[1];
      push("id_desbloqueado",
        `O laboratório desbloqueou um novo nó de I&D (${noId}).`,
        false, { no: noId });
    }
  }

  // ─── Decisões anuladas / ajustadas ──────────────────────────────────────
  const ajustes = ctx.auditoria.filter((a) => a.acao === "id_alvo_ignorado" || a.acao === "promo_invalida");
  if (ajustes.length) {
    push("decisoes_ajustadas",
      `Nem tudo o que se decidiu chegou a acontecer: ${ajustes.length} decisão(ões) foram anuladas ou ajustadas por precedência.`,
      false, { n: ajustes.length });
  }

  // ─── Pessoas ─────────────────────────────────────────────────────────────
  const metaById = new Map(ctx.colabsMeta.map((c) => [c.id, c]));
  for (const a of ctx.auditoria) {
    if (a.acao === "contratacao") {
      const cid = String((a.payload as { candidato_id?: string }).candidato_id ?? "");
      push("contratacao",
        `Entrou alguém para o chão de fábrica no turno ${ctx.turno}.`,
        false, { candidato_id: cid });
    } else if (a.acao === "pessoa_despedida") {
      const id = String((a.payload as { id?: string }).id ?? "");
      const c = metaById.get(id);
      const nome = (c?.nome && c.nome.trim()) || "um colaborador";
      const arq = nomeArquetipo(c?.arquetipo ?? null);
      const entrou = c?.entrou_ronda ?? null;
      const anos = entrou != null ? ctx.turno - entrou : (c?.antiguidade ?? null);
      const veteranoLongo = arq === "veterano" && (anos ?? 0) >= 4;
      if (veteranoLongo) {
        push("saida_veterano",
          `A casa despediu-se de ${nome}, veterano que aqui esteve ${anos} turnos. Poucos ficaram indiferentes.`,
          true, { id, anos });
      } else {
        push("despedimento",
          `${nome} foi despedido(a) no turno ${ctx.turno}${anos != null ? `, após ${anos} turnos na casa` : ""}.`,
          false, { id, anos });
      }
    } else if (a.acao === "pessoa_promovida") {
      const id = String((a.payload as { id?: string }).id ?? "");
      const novo = String((a.payload as { novo?: string }).novo ?? "");
      const c = metaById.get(id);
      const nome = (c?.nome && c.nome.trim()) || "um colaborador";
      const arq = nomeArquetipo(c?.arquetipo ?? null);
      const foiAprendiz = arq === "aprendiz";
      push(foiAprendiz ? "promocao_aprendiz" : "promocao",
        foiAprendiz
          ? `${nome}, que entrou como aprendiz, foi promovido(a) a ${papelRotulo(novo)}. A casa cresceu-lhe dentro.`
          : `${nome} foi promovido(a) a ${papelRotulo(novo)}.`,
        foiAprendiz, { id, novo });
    } else if (a.acao === "promocao_merito") {
      const id = String((a.payload as { id?: string }).id ?? "");
      const c = metaById.get(id);
      const nome = (c?.nome && c.nome.trim()) || "um colaborador";
      push("promocao_merito",
        `${nome} teve promoção de mérito.`,
        false, { id });
    }
  }

  // ─── Fallback: turno sem registo digno de nota ──────────────────────────
  if (out.length === 0) {
    push("silencio",
      `Turno ${ctx.turno} — sem registo digno de nota.`,
      false, {});
  }

  return out;
}
