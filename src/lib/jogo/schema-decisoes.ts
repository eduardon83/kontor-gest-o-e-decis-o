// Esquema canónico de `decisoes.payload` — fonte única de verdade.
// A página do jogo escreve exatamente estes campos; o resolver lê exatamente
// os mesmos. Objetos aninhados (producao/tier/preco), NÃO chaves planas.

export type Produto = "cadeira" | "mesa" | "armario";
export type Tier = "standard" | "fine" | "artisan";
export type Ritmo = "ferias" | "folga" | "normal" | "horas_extra";
export type Canal = "grosso" | "direto" | "exportacao";
export type Tesouraria = "conservador" | "equilibrado" | "agressivo";
export type IdModo = "interno" | "licenca";

export type PayloadCEO = {
  linhas_saida: Produto[];   // produtos a descontinuar (anula produção COO)
  teto_divida: number;       // € — limite absoluto de dívida total
  dividendos: number;        // €
  postura: string;           // free-form estratégica
};

export type PayloadCFO = {
  markup: number;                    // 0..1 (informativo; preço vem do CMO)
  emprestimo: number;                // € (novo pedido; sujeito a teto CEO)
  amortizar: number;                 // €
  capex: number;                     // €
  id_orcamento: number;              // €
  tesouraria: Tesouraria;
  usar_prejuizos: boolean;           // aplica prejuízos acumulados ao imposto
  seguro: boolean;
};

export type PayloadCOO = {
  producao: Record<Produto, number>; // unidades por produto
  tier: Tier;                        // um tier por turno (aplicado a todas as linhas)
  comprar_maquinas: number;
  ritmo: Ritmo;                      // horas_extra deriva daqui (overtime=40)
  subcontratacao: number;            // 0..1
  id_modo: IdModo;
};

export type PayloadCMO = {
  preco: Record<Produto, number>;    // € por unidade
  marketing: number;                 // €
  canal: Canal;
  forca_vendas: number;              // nº de vendedores
  pesquisa_mercado: number;          // €
};

export type PayloadCHRO = {
  salario: number;                   // ratio (ex.: 1.10 = 10% acima do mercado)
  formacao: number;                  // €
  bonus: number;                     // €
  contratar: number;
  despedir: number;
  promover_supervisor: boolean;
  contratar_investigadores: number;
};

export type PayloadPorLugar = {
  CEO: PayloadCEO;
  CFO: PayloadCFO;
  COO: PayloadCOO;
  CMO: PayloadCMO;
  CHRO: PayloadCHRO;
};
