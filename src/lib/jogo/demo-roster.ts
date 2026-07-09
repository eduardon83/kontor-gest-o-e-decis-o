// Gerador determinístico de dados fictícios para o gabinete do CHRO em modo demo.
// Não escreve na base de dados: alimenta apenas o estado local do JogoContext.
import type { Colaborador, Candidato, PesquisaRegisto } from "@/components/jogo/JogoContext";
import type { Arquetipo } from "@/lib/jogo/tipos";
import { nomePt, sexoDaVariante } from "@/lib/jogo/nomes-pt";

// PRNG determinístico simples (mulberry32) para não depender do backend.
function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rr(r: () => number, a: number, b: number) { return a + (b - a) * r(); }
function ri(r: () => number, a: number, b: number) { return Math.floor(rr(r, a, b + 1)); }
function pick<T>(r: () => number, arr: readonly T[]): T { return arr[Math.floor(r() * arr.length)]; }

const ARQ: Arquetipo[] = ["Veterano", "Talento", "Esteio", "Inquieto", "Aprendiz"];
const BASE_SAL_MENSAL = 3320;

/** Roster fictício coerente: 8-10 pessoas, mistura de papéis, atributos plausíveis. */
export function gerarRosterDemo(seedKey = "demo:marnera:1"): Colaborador[] {
  const r = mulberry32(seedFrom(seedKey));
  const n = 9; // fixo para leitura pedagógica estável
  const out: Colaborador[] = [];

  // Distribuição forçada: 1 chefe de linha, 2 supervisores, 5 trabalhadores, 1 investigador.
  const papeis: string[] = [
    "gestor_linha",
    "supervisor", "supervisor",
    "trabalhador", "trabalhador", "trabalhador", "trabalhador", "trabalhador",
    "investigador",
  ];

  const necessidadesPool = [
    { formacao: true },
    { pausa: true },
    { reconhecimento: true },
    {},
    {},
  ];

  for (let i = 0; i < n; i++) {
    const arq = pick(r, ARQ);
    const papel = papeis[i];
    const salBase = papel === "gestor_linha" ? 2.0
      : papel === "supervisor" ? 1.4
      : papel === "investigador" ? 1.6
      : 1.0;
    // Variação individual de mérito (±10%).
    const salario_mult = Number((salBase * rr(r, 0.95, 1.12)).toFixed(3));
    const variante = (r() < 0.5 ? 1 : 2) as 1 | 2;
    const id = `demo-col-${i.toString().padStart(2, "0")}`;
    out.push({
      id,
      nome: nomePt(`${seedKey}:${id}`, sexoDaVariante(variante)),
      arquetipo: arq,
      avatar_variante: variante,
      papel_org: papel,
      motivacao: Math.round(rr(r, 42, 88)),
      stress_individual: Math.round(rr(r, 18, 72)),
      antiguidade: ri(r, 1, 14),
      necessidades: pick(r, necessidadesPool),
      salario_mult,
    });
  }
  return out;
}

/** Pool de candidatos fictícios: 4-5, com pechinchas e "medíocres caros". */
export function gerarCandidatosDemo(seedKey = "demo:marnera:1:cands"): Candidato[] {
  const r = mulberry32(seedFrom(seedKey));
  const n = 5;
  const pistasArq: Record<Arquetipo, string[]> = {
    Veterano: ["Parece experiente.", "Fala pouco, escuta muito.", "Cita anos de fábrica."],
    Talento: ["Confiante — talvez demais.", "Traz portefólio.", "Perguntas técnicas afiadas."],
    Esteio: ["Discreto, pontual.", "Recomenda-se por três colegas.", "Aceita rotinas."],
    Inquieto: ["Enérgico, algo disperso.", "Quer mudar tudo à primeira.", "Reage mal a crítica."],
    Aprendiz: ["Recém-chegado à área.", "Curioso, ainda verde.", "Aceita começar por baixo."],
  };
  const out: Candidato[] = [];
  // Forçamos 1 pechincha e 1 "pede caro" para leitura pedagógica.
  const notas: (null | "pechincha" | "pede caro")[] = ["pechincha", null, "pede caro", null, null];
  for (let i = 0; i < n; i++) {
    const arq = pick(r, ARQ);
    const talento = rr(r, 0.4, 0.95);
    let mult = 0.85 + talento * 0.55;
    const nota = notas[i];
    if (nota === "pechincha") mult *= rr(r, 0.6, 0.78);
    else if (nota === "pede caro") mult *= rr(r, 1.35, 1.55);
    mult = Math.max(0.7, Math.min(2.2, Number(mult.toFixed(3))));
    const salario_mensal_pedido = Math.round(BASE_SAL_MENSAL * mult / 10) * 10;
    const pool = [...pistasArq[arq]];
    const pistas: string[] = [];
    for (let k = 0; k < 2 && pool.length; k++) {
      pistas.push(pool.splice(ri(r, 0, pool.length - 1), 1)[0]);
    }
    const variante = (r() < 0.5 ? 1 : 2) as 1 | 2;
    const id = `demo-cand-${i}`;
    out.push({
      id,
      nome: nomePt(`${seedKey}:${id}`, sexoDaVariante(variante)),
      arquetipo: arq,
      avatar_variante: variante,
      atributos: {
        competencia: Math.round(rr(r, 35, 90)),
        ambicao: Math.round(rr(r, 25, 85)),
        produtividade: Math.round(rr(r, 30, 90)),
        motivacao: Math.round(rr(r, 40, 85)),
        stress: Math.round(rr(r, 20, 70)),
        resiliencia: Math.round(rr(r, 30, 85)),
        aptidao_gestao: Math.round(rr(r, 20, 80)),
      },
      salario_mensal_pedido,
      salario_mult: mult,
      pistas,
      nota,
    });
  }
  return out;
}

export function escolherRepresentanteDemo(
  colaboradores: Colaborador[],
  turno: number,
): string | null {
  if (!colaboradores.length) return null;
  const r = mulberry32(seedFrom(`demo:representante:${turno}`));
  return colaboradores[Math.floor(r() * colaboradores.length)].id;
}

/** Gera uma leitura fictícia coerente de um diálogo com o representante. */
export function gerarResultadoDialogoDemo(
  rep: Colaborador | null,
  todos: Colaborador[],
  turno: number,
): Record<string, unknown> {
  if (!rep) return { erro: "sem_representante" };
  const media = (k: "motivacao" | "stress_individual") =>
    todos.length ? Math.round(todos.reduce((s, c) => s + Number(c[k]), 0) / todos.length) : 0;
  const climaMoral = media("motivacao");
  const climaStress = media("stress_individual");
  const humor = rep.motivacao > 65 ? "otimista" : rep.motivacao < 45 ? "desanimado" : "reservado";
  const queixas: string[] = [];
  const n = rep.necessidades as Record<string, unknown>;
  if (n.formacao) queixas.push("Sente falta de formação técnica.");
  if (n.pausa) queixas.push("Pede pausas mais previsíveis.");
  if (n.reconhecimento) queixas.push("Gostava de mais reconhecimento visível.");
  if (rep.stress_individual > 60) queixas.push("Refere cansaço acumulado ao fim do dia.");
  if (rep.motivacao > 75) queixas.push("Está entusiasmado com o rumo da equipa.");
  return {
    confianca: 1,
    representante: {
      id: rep.id,
      nome: rep.nome,
      arquetipo: rep.arquetipo,
      papel_org: rep.papel_org,
      avatar_variante: rep.avatar_variante,
      antiguidade: rep.antiguidade,
      moral: rep.motivacao,
      stress: rep.stress_individual,
      necessidades: rep.necessidades,
      salario_mult: rep.salario_mult,
    },
    humor,
    queixas: queixas.length ? queixas : [],
    clima: {
      moral_media: climaMoral,
      stress_medio: climaStress,
      n: todos.length,
      leitura: climaMoral > 65
        ? "bom clima geral"
        : climaMoral < 45 ? "clima frio — atenção às saídas" : "clima estável, sem grande entusiasmo",
    },
    turno,
  };
}

/** Utilidade: constrói um PesquisaRegisto local para o histórico de diálogos. */
export function novoDialogoRegistoDemo(
  rep: Colaborador | null,
  todos: Colaborador[],
  turno: number,
): PesquisaRegisto {
  return {
    id: `demo-dialogo-${turno}-${Date.now()}`,
    tipo: "dialogo",
    nivel: null,
    custo: 0,
    confianca: 1,
    resultado: gerarResultadoDialogoDemo(rep, todos, turno),
    criado_em: new Date().toISOString(),
    ronda_indice: turno,
    ronda_id: null,
    lugar: "CHRO",
  };
}

/* ============================================================
 * Geradores fictícios para outras pesquisas (demo).
 * A forma casa com src/components/jogo/ResultadoPesquisa.tsx.
 * ============================================================ */

const CONF_POR_NIVEL: Record<string, number> = { L1: 0.75, L2: 0.85, L3: 0.95 };

function confDe(nivel?: string | null): number {
  return CONF_POR_NIVEL[String(nivel ?? "L2")] ?? 0.85;
}

/** Estudo económico (CFO) — próximos 4 turnos. */
export function gerarResultadoEstudoEconomicoDemo(turno: number, nivel?: string | null) {
  const r = mulberry32(seedFrom(`demo:econ:${turno}:${nivel ?? "L2"}`));
  const janela = [];
  let juro = 3 + rr(r, -0.3, 0.3);
  let inflacao = 2.4 + rr(r, -0.4, 0.4);
  let cresc = 1.6 + rr(r, -0.3, 0.4);
  for (let i = 1; i <= 4; i++) {
    juro = Math.max(0.5, juro + rr(r, -0.25, 0.25));
    inflacao = Math.max(0, inflacao + rr(r, -0.2, 0.2));
    cresc = cresc + rr(r, -0.2, 0.2);
    janela.push({
      turno: turno + i,
      juro: Number(juro.toFixed(2)),
      inflacao: Number(inflacao.toFixed(2)),
      crescimento: Number(cresc.toFixed(2)),
      confianca_mercado: Math.round(rr(r, 40, 80)),
    });
  }
  return { confianca: confDe(nivel), janela };
}

/** Pesquisa de mercado (CMO) — sem números exatos de procura. */
export function gerarResultadoPesquisaMercadoDemo(turno: number, nivel?: string | null) {
  const r = mulberry32(seedFrom(`demo:mkt:${turno}:${nivel ?? "L2"}`));
  const base = { cadeira: rr(r, 0.6, 1.2), mesa: rr(r, 0.5, 1.3), armario: rr(r, 0.4, 1.1) };
  const emergs = [
    { nome: "Linha Nórdica", produto: "cadeira", ganho: rr(r, 0.08, 0.18) },
    { nome: "Contract HORECA", produto: "mesa", ganho: rr(r, 0.06, 0.14) },
  ];
  return {
    confianca: confDe(nivel),
    procura_relativa: {
      cadeira: Number(base.cadeira.toFixed(2)),
      mesa: Number(base.mesa.toFixed(2)),
      armario: Number(base.armario.toFixed(2)),
    },
    emergentes_visiveis: r() < 0.6 ? [emergs[Math.floor(r() * emergs.length)]] : [],
  };
}

/** Concorrência (CEO) — perfil aparente de rivais. */
export function gerarResultadoConcorrenciaDemo(
  rivais: { equipa_id: string; nome: string; valor: number }[],
  turno: number,
  nivel?: string | null,
) {
  const r = mulberry32(seedFrom(`demo:conc:${turno}:${nivel ?? "L2"}`));
  const ritmos = ["cauteloso", "estável", "agressivo"];
  return {
    confianca: confDe(nivel),
    rivais: rivais.map((v) => ({
      nome: v.nome,
      marca: Math.round(rr(r, 28, 62)),
      ritmo: pick(r, ritmos),
      precos: {
        cadeira: Math.round(rr(r, 60, 90) / 2) * 2,
        mesa: Math.round(rr(r, 140, 210) / 2) * 2,
        armario: Math.round(rr(r, 260, 360) / 5) * 5,
      },
    })),
  };
}

/** Análise I&D (COO). */
export function gerarResultadoAnaliseIdDemo(turno: number, nivel?: string | null) {
  const r = mulberry32(seedFrom(`demo:id:${turno}:${nivel ?? "L2"}`));
  const bt = [
    { nome: "Encaixe Modular", produto: "cadeira", ganho: rr(r, 0.08, 0.18) },
    { nome: "Verniz Rápido", produto: "mesa", ganho: rr(r, 0.05, 0.12) },
    { nome: "Ferragem Silenciosa", produto: "armario", ganho: rr(r, 0.06, 0.14) },
  ];
  return {
    confianca: confDe(nivel),
    progresso: Math.round(rr(r, 40, 180)),
    distancia_breakthrough: Math.round(rr(r, 20, 120)),
    breakthroughs_visiveis: r() < 0.7 ? [bt[Math.floor(r() * bt.length)]] : [],
  };
}

/** Constrói um PesquisaRegisto local para qualquer tipo (demo). */
export function novoPesquisaRegistoDemo(args: {
  lugar: import("@/lib/jogo/tipos").Lugar;
  tipo: string;
  nivel?: string | null;
  custo?: number | null;
  turno: number;
  resultado: Record<string, unknown>;
}): PesquisaRegisto {
  return {
    id: `demo-${args.tipo}-${args.turno}-${Date.now()}`,
    tipo: args.tipo,
    nivel: args.nivel ?? null,
    custo: args.custo ?? 0,
    confianca: Number((args.resultado as any)?.confianca ?? null) || null,
    resultado: args.resultado,
    criado_em: new Date().toISOString(),
    ronda_indice: args.turno,
    lugar: args.lugar,
  };
}
