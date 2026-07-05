// Constantes económicas e catálogo de produtos/tiers/arquétipos.

export const CONST = {
  madeira_m3: 320,
  eletricidade_kwh: 0.15,
  carbono_kwh: 0.021,
  custo_hora: 20.74, // 17 × 1,22
  exportacao_mult: 0.72,
  elast_default: 1.85,
  imposto: 0.30,
  capital_inicial_default: 60000,
} as const;

export type Produto = "cadeira" | "mesa" | "armario";
export const PRODUTOS: Record<
  Produto,
  { madeira: number; mao: number; energia: number; consumivel: number; ref: number; procura_base: number }
> = {
  cadeira: { madeira: 0.025, mao: 0.6, energia: 8, consumivel: 3.5, ref: 72, procura_base: 2600 },
  mesa: { madeira: 0.08, mao: 1.4, energia: 14, consumivel: 9, ref: 150, procura_base: 900 },
  armario: { madeira: 0.12, mao: 2.2, energia: 18, consumivel: 14, ref: 245, procura_base: 480 },
};

export type Tier = "standard" | "fine" | "artisan";
export const TIERS: Record<Tier, { mao_mult: number; qual: number }> = {
  standard: { mao_mult: 1.00, qual: 0.70 },
  fine: { mao_mult: 1.58, qual: 0.86 },
  artisan: { mao_mult: 2.10, qual: 0.96 },
};

export type Arquetipo = "veterano" | "talento" | "esteio" | "inquieto" | "aprendiz";

// Intervalos [min,max] por atributo — origem da geração de colaboradores.
export const ARQUETIPOS: Record<
  Arquetipo,
  {
    competencia: [number, number];
    ambicao: [number, number];
    produtividade: [number, number];
    motivacao: [number, number];
    stress: [number, number];
    resiliencia: [number, number];
    aptidao_gestao: [number, number];
  }
> = {
  veterano: {
    competencia: [75, 95], ambicao: [15, 40], produtividade: [55, 75],
    motivacao: [55, 80], stress: [15, 40], resiliencia: [70, 90], aptidao_gestao: [60, 85],
  },
  talento: {
    competencia: [55, 75], ambicao: [70, 95], produtividade: [75, 95],
    motivacao: [60, 90], stress: [30, 60], resiliencia: [40, 65], aptidao_gestao: [45, 70],
  },
  esteio: {
    competencia: [55, 75], ambicao: [35, 55], produtividade: [55, 75],
    motivacao: [65, 85], stress: [20, 40], resiliencia: [70, 90], aptidao_gestao: [40, 65],
  },
  inquieto: {
    competencia: [50, 70], ambicao: [55, 80], produtividade: [70, 95],
    motivacao: [35, 80], stress: [45, 75], resiliencia: [30, 55], aptidao_gestao: [30, 55],
  },
  aprendiz: {
    competencia: [20, 45], ambicao: [45, 75], produtividade: [35, 60],
    motivacao: [55, 85], stress: [25, 50], resiliencia: [45, 70], aptidao_gestao: [20, 45],
  },
};

// Guardrails macro.
export const GUARDRAILS = {
  juro:        { min: 0,    max: 8,    delta: 0.5 },
  inflacao:    { min: -1,   max: 12,   delta: 1.0 },
  crescimento: { min: 0.85, max: 1.15, delta: 0.04 },
  confianca:   { min: 70,   max: 130,  delta: 8 },
} as const;

// Precedência de decisões dentro da equipa.
export const PRECEDENCIA = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;
