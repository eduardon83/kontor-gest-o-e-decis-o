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
    out.push({
      id: `demo-cand-${i}`,
      arquetipo: arq,
      avatar_variante: (r() < 0.5 ? 1 : 2) as 1 | 2,
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
    representante: {
      id: rep.id,
      arquetipo: rep.arquetipo,
      motivacao: rep.motivacao,
      stress: rep.stress_individual,
      antiguidade: rep.antiguidade,
    },
    humor,
    queixas: queixas.length ? queixas : ["Sem queixas relevantes desta vez."],
    clima_equipa: {
      moral_media: climaMoral,
      stress_media: climaStress,
      leitura: climaMoral > 65
        ? "Equipa em bom clima geral."
        : climaMoral < 45 ? "Clima frio — atenção às saídas." : "Clima estável, sem grande entusiasmo.",
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
    confianca: null,
    resultado: gerarResultadoDialogoDemo(rep, todos, turno),
    criado_em: new Date().toISOString(),
    ronda_indice: turno,
    lugar: "CHRO",
  };
}
