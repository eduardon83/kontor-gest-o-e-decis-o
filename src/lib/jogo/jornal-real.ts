// Geradores determinísticos do Jornal em modo real.
// Regra: poucos moldes bem escritos, com variação por dados. PT-PT.
// Nada de texto genérico repetido turno após turno.

import type { Rival, Snapshot, SnapshotRegisto, DecisaoRegisto } from "@/components/jogo/JogoContext";
import type { Lugar } from "@/lib/jogo/tipos";

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
}): Manchete {
  const { rivaisAtuais, rivaisAnteriores, snapshotAtual, competicao_nome, equipa_nome, turno } = args;

  // Falências (valor ≤ 0)
  const falidos = rivaisAtuais.filter((r) => r.valor <= 0);
  if (falidos.length) {
    const nomes = falidos.map((f) => f.nome).join(" e ");
    return {
      tag: "Falência",
      titulo: falidos.length === 1
        ? `Casa ${nomes} colapsa na praça`
        : `Duas casas colapsam: ${nomes}`,
      sub: `A praça de ${competicao_nome} regista o fecho no turno ${turno}.`,
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
      if (top.delta > 0) {
        return {
          tag: "Movimento",
          titulo: `${top.r.nome} dispara ${eur(top.delta)} em valor`,
          sub: `Passa a valer ${eur(top.r.valor)} — a maior subida do turno.`,
        };
      }
      return {
        tag: "Queda",
        titulo: `${top.r.nome} perde ${eur(Math.abs(top.delta))} em valor`,
        sub: `Recua para ${eur(top.r.valor)} — a maior queda do turno.`,
      };
    }
  }

  // Líder destacado (top vs 2º com folga)
  if (rivaisAtuais.length >= 2) {
    const ord = [...rivaisAtuais].sort((a, b) => b.valor - a.valor);
    const folga = ord[0].valor - ord[1].valor;
    if (folga > ord[1].valor * 0.35) {
      return {
        tag: "Liderança",
        titulo: `${ord[0].nome} destaca-se e lidera a praça`,
        sub: `Vale ${eur(ord[0].valor)}, distância ${eur(folga)} sobre ${ord[1].nome}.`,
      };
    }
    return {
      tag: "Praça",
      titulo: `${ord[0].nome} à cabeça, ${ord[1].nome} a curta distância`,
      sub: `Diferença de apenas ${eur(folga)} entre as duas primeiras casas.`,
    };
  }

  // Fallback com dados da equipa
  const rl = Number((snapshotAtual as any)?.financeiro?.pnl?.resultado_liquido ?? 0);
  if (Math.abs(rl) >= 1) {
    return {
      tag: "Resultados",
      titulo: rl >= 0
        ? `${equipa_nome} fecha turno com lucro de ${eur(rl)}`
        : `${equipa_nome} apura prejuízo de ${eur(Math.abs(rl))}`,
    };
  }
  return { tag: competicao_nome, titulo: `Turno ${turno} sem eventos de mercado dignos de manchete` };
}

/* ============================================================
 * NOTÍCIAS DE ECONOMIA — política monetária, preços, ciclo
 * ============================================================ */
export function noticiasEconomia(args: {
  macroAtual: any;
  macroAnterior: any;
  faseEcon: string | null;
}): Manchete[] {
  const { macroAtual, macroAnterior, faseEcon } = args;
  const out: Manchete[] = [];
  if (faseEcon) out.push({ tag: "Ciclo", titulo: `Fase macroeconómica: ${faseEcon}` });
  if (macroAtual) {
    const dJuro = macroAnterior ? macroAtual.juro - macroAnterior.juro : 0;
    if (Math.abs(dJuro) >= 0.25) {
      out.push({
        tag: "Política monetária",
        titulo: `Juro base ${dJuro > 0 ? "sobe" : "desce"} para ${macroAtual.juro.toFixed(2)}%`,
        sub: `Variação de ${dJuro > 0 ? "+" : "−"}${Math.abs(dJuro).toFixed(2)} pontos.`,
      });
    } else {
      out.push({ tag: "Política monetária", titulo: `Juro base estável em ${macroAtual.juro.toFixed(2)}%` });
    }
    const dInf = macroAnterior ? macroAtual.inflacao - macroAnterior.inflacao : 0;
    out.push({
      tag: "Preços",
      titulo: `Inflação ${dInf > 0 ? "acelera" : dInf < 0 ? "abranda" : "mantém-se"} em ${macroAtual.inflacao.toFixed(1)}%`,
    });
    out.push({
      tag: "Confiança",
      titulo: `Índice de confiança em ${Math.round(macroAtual.confianca)}`,
      sub: `Crescimento ${(macroAtual.crescimento * 100 - 100).toFixed(1)}%.`,
    });
  }
  return out;
}

/* ============================================================
 * COLUNA DE OPINIÃO — "Fradique da Praça", tom seco e irónico
 * ============================================================ */
const COLUNISTA = "Fradique da Praça";

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
}): { autor: string; titulo: string; corpo: string } | null {
  const { rivaisAtuais, rivaisAnteriores, snapshotAtual, snapshotAnterior, turno } = args;

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
  if (conc >= 4500) {
    return {
      autor: COLUNISTA,
      titulo: "O tabuleiro está a ficar pequeno",
      corpo:
        `Diz-se pela praça que a concorrência é saudável. Neste turno ${turno}, a concentração de quota fala por si — ` +
        `poucos nomes, muita margem, e um índice de dominância a rondar os ${Math.round(conc)}. ` +
        `Quem vive à sombra dos gigantes que se cubra: a próxima geada não perdoa os pequenos.`,
    };
  }
  if (dConc <= -400) {
    return {
      autor: COLUNISTA,
      titulo: "A praça fragmenta-se",
      corpo:
        `Ao contrário do turno anterior, ninguém se destaca de forma insolente. ` +
        `A concentração cede ${Math.round(Math.abs(dConc))} pontos e há espaço para todos os cotovelos. ` +
        `É costume dizer-se que mercados abertos convidam a estratégias tímidas — este colunista discorda.`,
    };
  }
  if (dPreco < -3) {
    return {
      autor: COLUNISTA,
      titulo: "Guerra de preços declarada",
      corpo:
        `A tabela caiu ${Math.abs(dPreco).toFixed(1)} pontos em média e alguém, algures, decidiu que a margem é um luxo. ` +
        `Os consumidores agradecem no imediato; os contabilistas hão-de ajustar as expectativas no fim do trimestre. ` +
        `Aviso à navegação: quem entra em guerras de preço raramente escreve as memórias.`,
    };
  }
  if (dTier > 0.2) {
    return {
      autor: COLUNISTA,
      titulo: "Corrida à qualidade",
      corpo:
        `Sobe o tier médio dos produtos ${dTier.toFixed(1)} degraus. Traduzindo: as casas estão a subir a fasquia ` +
        `e a passar a fatura ao cliente. Falta ver se o cliente paga com sorriso ou com carteira encolhida.`,
    };
  }
  if (dPreco > 2) {
    return {
      autor: COLUNISTA,
      titulo: "Preços em alta — coragem ou distração?",
      corpo:
        `Os preços médios sobem ${dPreco.toFixed(1)} pontos face ao turno anterior. Há quem chame a isto pricing power; ` +
        `outros preferem chamar-lhe teste de paciência. O mercado dirá.`,
    };
  }
  // Ângulo genérico só se houver mesmo pouco para dizer
  if (turno <= 1) return null;
  return {
    autor: COLUNISTA,
    titulo: "Um turno sem sobressaltos",
    corpo:
      `Se a virtude estivesse em não mexer, teríamos hoje um turno virtuoso. As posições consolidam-se, ` +
      `as manchetes escasseiam e este colunista prepara-se para a próxima ronda com esperança renovada — ou, ` +
      `pelo menos, com café mais forte.`,
  };
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
}): Anuncio[] {
  const { rivaisAtuais, rivaisAnteriores, snapshotAtual, decisoes, equipa_nome } = args;
  const out: Anuncio[] = [];

  // Anúncio da NOSSA casa — derivado das nossas decisões reais
  const cmo = (decisoes.CMO?.payload ?? {}) as any;
  const ceo = (decisoes.CEO?.payload ?? {}) as any;
  const coo = (decisoes.COO?.payload ?? {}) as any;
  const marketing = Number(cmo?.marketing_total ?? cmo?.marketing ?? 0);
  const exportacao = Boolean(cmo?.exportar ?? cmo?.canal_exportacao ?? false);
  const tierMedio = (() => {
    const t = coo?.tier ?? coo?.tiers ?? {};
    if (typeof t === "number") return t;
    if (t && typeof t === "object") {
      const vals = Object.values(t).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    return 0;
  })();
  const postura = (ceo?.postura ?? ceo?.postura_estrategica ?? null) as string | null;

  if (marketing >= 8000) {
    out.push({
      casa: equipa_nome,
      tamanho: "grande",
      titulo: `${equipa_nome.toUpperCase()} — a marca que enche a rua`,
      corpo: `Da praça ao porto, todos falam. Descubra o catálogo da estação e sinta a diferença de uma casa que investe em si.`,
    });
  } else if (exportacao) {
    out.push({
      casa: equipa_nome,
      tamanho: "media",
      titulo: `${equipa_nome} anuncia no porto`,
      corpo: `Mercadoria pronta para embarque. Contactos preferenciais para clientes de além-mar.`,
    });
  } else if (tierMedio >= 2.4) {
    out.push({
      casa: equipa_nome,
      tamanho: "media",
      titulo: `${equipa_nome} — qualidade superior`,
      corpo: `Peças de tier alto, acabamento cuidado. Recomenda-se a exigentes.`,
    });
  } else if (postura === "agressiva") {
    out.push({
      casa: equipa_nome,
      tamanho: "pequena",
      titulo: `${equipa_nome} avança`,
      corpo: `Nova postura, novos preços. Aproxime-se e negocie.`,
    });
  }

  // Anúncios das rivais — derivados de rank e trajetória de valor
  const mapaAnt = new Map(rivaisAnteriores.map((r) => [r.equipa_id, r.valor]));
  const ord = [...rivaisAtuais].sort((a, b) => b.valor - a.valor);
  const nossa = new Set([equipa_nome]);

  // Líder → anúncio de prestígio
  const lider = ord.find((r) => !nossa.has(r.nome));
  if (lider && lider.valor > 0) {
    out.push({
      casa: lider.nome,
      tamanho: "media",
      titulo: `Casa ${lider.nome} — reputação com selo`,
      corpo: `A liderar a praça com ${eur(lider.valor)}. Encomendas atendidas por ordem de chegada.`,
    });
  }

  // Maior salto → anúncio de expansão
  const saltador = rivaisAtuais
    .map((r) => ({ r, delta: r.valor - (mapaAnt.get(r.equipa_id) ?? r.valor) }))
    .filter((x) => !nossa.has(x.r.nome) && x.delta > 3000)
    .sort((a, b) => b.delta - a.delta)[0];
  if (saltador) {
    out.push({
      casa: saltador.r.nome,
      tamanho: "pequena",
      titulo: `${saltador.r.nome} anuncia expansão`,
      corpo: `Nova capacidade instalada. Contratações em curso.`,
    });
  }

  // Maior queda → anúncio discreto
  const cadente = rivaisAtuais
    .map((r) => ({ r, delta: r.valor - (mapaAnt.get(r.equipa_id) ?? r.valor) }))
    .filter((x) => !nossa.has(x.r.nome) && x.delta < -3000)
    .sort((a, b) => a.delta - b.delta)[0];
  if (cadente && cadente.r.valor > 0) {
    out.push({
      casa: cadente.r.nome,
      tamanho: "pequena",
      titulo: `${cadente.r.nome} — liquidação de existências`,
      corpo: `Aproveite condições especiais enquanto durar o stock.`,
    });
  }

  return out.slice(0, 4);
}

/* ============================================================
 * CARTAS AO DIRETOR — ocasionais, disparadas por eventos
 * ============================================================ */
export function cartasAoDiretor(notas: { acao: string; payload?: any }[]): Carta[] {
  const cartas: Carta[] = [];
  const acoes = notas.map((n) => n.acao);

  if (acoes.some((a) => /greve|paraliza/i.test(a))) {
    cartas.push({
      autor: "Um operário anónimo",
      assunto: "Paragem no chão de fábrica",
      corpo:
        "Senhor Diretor: escrevo-lhe com a mão suja de graxa e a paciência gasta. A greve não é capricho — é a soma " +
        "de turnos calados e promessas por cumprir. Deem-nos o que é justo, e voltamos ao torno.",
    });
  }
  if (acoes.some((a) => /breakthrough|descoberta|patent/i.test(a))) {
    cartas.push({
      autor: "Um investigador entusiasmado",
      assunto: "Um passo em frente",
      corpo:
        "Senhor Diretor: permita-me a euforia — o laboratório encontrou o que procurava. Não é ainda um milagre, mas é " +
        "seguramente uma vantagem. Peço que a administração dê o tempo justo antes de exigir o retorno.",
    });
  }
  if (acoes.some((a) => /credito_automatica|linha_credito/i.test(a))) {
    cartas.push({
      autor: "Um credor prudente",
      assunto: "Sobre a nova linha de crédito",
      corpo:
        "Senhor Diretor: aceito com desagrado que a casa tenha recorrido à linha automática. Compreendo a urgência, ` +" +
        " mas os juros não perdoam sentimentos. Aguardo o plano de amortização com o interesse de sempre.",
    });
  }
  if (acoes.some((a) => /despedi/i.test(a))) {
    cartas.push({
      autor: "Um antigo colega",
      assunto: "Sobre a despedida",
      corpo:
        "Senhor Diretor: a decisão foi tomada e o portão fechou-se. Fica o registo: quem parte leva o que sabia, e " +
        "quem fica lembra-se. Que a próxima admissão seja feita com o mesmo cuidado com que se assinou a saída.",
    });
  }

  return cartas.slice(0, 2);
}

/* ============================================================
 * NECROLOGIA — quando uma casa colapsa
 * ============================================================ */
export function necrologia(args: {
  rivaisAtuais: Rival[];
  rivaisAnteriores: Rival[];
}): string[] {
  const { rivaisAtuais, rivaisAnteriores } = args;
  const mapaAnt = new Map(rivaisAnteriores.map((r) => [r.equipa_id, r.valor]));
  const mortas = rivaisAtuais.filter((r) => r.valor <= 0 && (mapaAnt.get(r.equipa_id) ?? 0) > 0);
  return mortas.map((m) => `Casa ${m.nome} — encerrou portas no turno atual, após ter valido ${eur(mapaAnt.get(m.equipa_id) ?? 0)}. Deixa saudades entre os credores.`);
}

/* ============================================================
 * WATERFALL — dados para o ritual e para o jornal
 * ============================================================ */
export type PassoWaterfall = { rotulo: string; valor: number; tipo: "positivo" | "negativo" | "acumulado" };

export function waterfallDaP&L(fin: any): PassoWaterfall[] {
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
