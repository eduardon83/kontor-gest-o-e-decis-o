// Geração determinística de candidatos e do representante do turno.
// Chamado tanto pela edge function `gerar_candidatos` como pelo `resolver_ronda`
// para revalidar os ids que o cliente enviou nas contratações.
import { stream, randRange, randInt, pick } from "./prng.ts";
import { ARQUETIPOS, type Arquetipo } from "./constants.ts";

export type Candidato = {
  id: string; // determinístico: "cand:{seed}:{i}"
  arquetipo: Arquetipo;
  avatar_variante: 1 | 2;
  atributos: {
    competencia: number;
    ambicao: number;
    produtividade: number;
    motivacao: number;
    stress: number;
    resiliencia: number;
    aptidao_gestao: number;
  };
  salario_mensal_pedido: number;   // €
  salario_mult: number;            // relativo à base de mercado
  pistas: string[];                // frases vagas
  nota: string | null;             // ex.: "pechincha", "pede caro"
};

const ARQ_LIST: Arquetipo[] = ["veterano", "talento", "esteio", "inquieto", "aprendiz"];

// Base de salário mensal a 1.0 (aprox. custo_hora × 160h × 1.0 ≈ 3320 €).
const BASE_SALARIO_MENSAL = 3320;

const PISTAS_POR_ARQ: Record<Arquetipo, string[]> = {
  veterano: ["Parece experiente.", "Fala pouco, escuta muito.", "Cita anos de fábrica."],
  talento: ["Confiante — talvez demais.", "Traz portefólio.", "Perguntas técnicas afiadas."],
  esteio: ["Discreto, pontual.", "Recomenda-se por três colegas.", "Aceita rotinas."],
  inquieto: ["Enérgico, algo disperso.", "Quer mudar tudo à primeira.", "Reage mal a crítica."],
  aprendiz: ["Recém-chegado à área.", "Curioso, ainda verde.", "Aceita começar por baixo."],
};

export type FonteCandidatos = { competicaoSeed: number; rondaIndice: number; equipaId: string };

export function gerarPoolCandidatos(fonte: FonteCandidatos): Candidato[] {
  const r = stream(
    Number(fonte.competicaoSeed) + Number(fonte.rondaIndice) * 611953,
    `candidatos:${fonte.equipaId}`,
  );
  const n = 4 + Math.floor(r() * 2); // 4 ou 5
  const out: Candidato[] = [];
  for (let i = 0; i < n; i++) {
    const arq = pick(r, ARQ_LIST);
    const spec = ARQUETIPOS[arq];
    const rng = (k: keyof typeof spec) => Math.round(randRange(r, spec[k][0], spec[k][1]));
    const atributos = {
      competencia: rng("competencia"),
      ambicao: rng("ambicao"),
      produtividade: rng("produtividade"),
      motivacao: rng("motivacao"),
      stress: rng("stress"),
      resiliencia: rng("resiliencia"),
      aptidao_gestao: rng("aptidao_gestao"),
    };

    // Salário "justo" baseia-se em competência + produtividade;
    // mas com ruído grande e 20% de probabilidade de inversão (pechincha ou "pede caro").
    const talento = (atributos.competencia * 0.6 + atributos.produtividade * 0.4) / 100;
    const mercado = 0.85 + talento * 0.55; // 0.85..1.40 aprox
    let mult = mercado * randRange(r, 0.85, 1.15);
    let nota: string | null = null;
    const inversao = r();
    if (inversao < 0.10) {
      mult = mult * randRange(r, 0.55, 0.75);
      nota = "pechincha";
    } else if (inversao > 0.90) {
      mult = mult * randRange(r, 1.30, 1.60);
      nota = "pede caro";
    }
    mult = Math.max(0.7, Math.min(2.2, Number(mult.toFixed(3))));
    const salario_mensal_pedido = Math.round(BASE_SALARIO_MENSAL * mult / 10) * 10;

    // Pistas: 2 do arquétipo (aleatórias) + 1 ambígua sobre salário quando invertido.
    const pool = [...PISTAS_POR_ARQ[arq]];
    const pistas: string[] = [];
    for (let k = 0; k < 2 && pool.length; k++) {
      const idx = randInt(r, 0, pool.length - 1);
      pistas.push(pool.splice(idx, 1)[0]);
    }

    out.push({
      id: `cand:${fonte.competicaoSeed}:${fonte.rondaIndice}:${fonte.equipaId.slice(0, 8)}:${i}`,
      arquetipo: arq,
      avatar_variante: (r() < 0.5 ? 1 : 2) as 1 | 2,
      atributos,
      salario_mensal_pedido,
      salario_mult: mult,
      pistas,
      nota,
    });
  }
  return out;
}

export function escolherRepresentante(
  fonte: FonteCandidatos,
  colaboradorIds: string[],
): string | null {
  if (!colaboradorIds.length) return null;
  const r = stream(
    Number(fonte.competicaoSeed) + Number(fonte.rondaIndice) * 2749,
    `representante:${fonte.equipaId}`,
  );
  return colaboradorIds[Math.floor(r() * colaboradorIds.length)];
}
