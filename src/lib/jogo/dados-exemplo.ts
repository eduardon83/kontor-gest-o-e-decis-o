import type { Arquetipo, Lugar } from "./tipos";

// ============ Empresa e turno ============
export const EMPRESA_INICIAL = {
  nome: "Marnera & Filhos",
  inicial: "M",
  caixa: 148_500,
  valor: 612_300,
  turno: 4,
  turnos_total: 10,
  fase_economica: "Expansão moderada",
  prazo: "36:12:04",
};

// ============ KPIs por CO + Global ============
export type KpiSerie = { turno: number; valor: number };
export type Kpi = {
  chave: string;
  rotulo: string;
  unidade: string;
  atual: number;
  delta: number;
  serie: KpiSerie[];
};

function serie(base: number, variacao: number[]): KpiSerie[] {
  return variacao.map((v, i) => ({ turno: i + 1, valor: +(base + v).toFixed(2) }));
}

export const KPIS: Record<Lugar | "Global", Kpi[]> = {
  Global: [
    { chave: "valor", rotulo: "Valor da empresa", unidade: "€", atual: 612_300, delta: 4.2, serie: serie(560_000, [0, 8_400, 15_200, 21_800, 34_100, 52_300]) },
    { chave: "quota", rotulo: "Quota de mercado", unidade: "%", atual: 18.4, delta: 1.1, serie: serie(14, [0, 1.2, 2.1, 3.0, 3.8, 4.4]) },
    { chave: "ebitda", rotulo: "EBITDA", unidade: "€", atual: 48_200, delta: -2.3, serie: serie(38_000, [0, 2_400, 6_100, 9_800, 12_400, 10_200]) },
    { chave: "moral", rotulo: "Moral média", unidade: "/100", atual: 68, delta: 3, serie: serie(60, [0, 2, 4, 6, 6, 8]) },
  ],
  CEO: [
    { chave: "valor", rotulo: "Valor da empresa", unidade: "€", atual: 612_300, delta: 4.2, serie: serie(560_000, [0, 8_400, 15_200, 21_800, 34_100, 52_300]) },
    { chave: "confianca", rotulo: "Confiança do conselho", unidade: "/100", atual: 71, delta: 2, serie: serie(65, [0, 1, 2, 3, 5, 6]) },
    { chave: "coesao", rotulo: "Coesão da equipa", unidade: "/100", atual: 74, delta: 1, serie: serie(70, [0, 1, 2, 3, 3, 4]) },
  ],
  CFO: [
    { chave: "caixa", rotulo: "Caixa", unidade: "€", atual: 148_500, delta: -1.2, serie: serie(120_000, [0, 6_100, 14_200, 22_400, 30_800, 28_500]) },
    { chave: "divida", rotulo: "Dívida líquida", unidade: "€", atual: 72_000, delta: 0.4, serie: serie(80_000, [0, -2_100, -4_800, -6_200, -7_500, -8_000]) },
    { chave: "margem", rotulo: "Margem bruta", unidade: "%", atual: 34.2, delta: 0.8, serie: serie(30, [0, 0.6, 1.4, 2.1, 3.2, 4.2]) },
  ],
  COO: [
    { chave: "utiliz", rotulo: "Utilização fabril", unidade: "%", atual: 82, delta: 3, serie: serie(70, [0, 2, 4, 6, 8, 12]) },
    { chave: "defeito", rotulo: "Taxa de defeito", unidade: "%", atual: 2.1, delta: -0.3, serie: serie(3.4, [0, -0.2, -0.5, -0.8, -1.1, -1.3]) },
    { chave: "ciclo", rotulo: "Tempo de ciclo", unidade: "h", atual: 6.4, delta: -0.2, serie: serie(7.6, [0, -0.2, -0.4, -0.7, -0.9, -1.2]) },
  ],
  CMO: [
    { chave: "quota", rotulo: "Quota de mercado", unidade: "%", atual: 18.4, delta: 1.1, serie: serie(14, [0, 1.2, 2.1, 3.0, 3.8, 4.4]) },
    { chave: "nps", rotulo: "NPS", unidade: "", atual: 42, delta: 4, serie: serie(28, [0, 2, 6, 9, 12, 14]) },
    { chave: "conversao", rotulo: "Conversão em loja", unidade: "%", atual: 12.6, delta: 0.5, serie: serie(10, [0, 0.4, 1.1, 1.7, 2.2, 2.6]) },
  ],
  CHRO: [
    { chave: "moral", rotulo: "Moral média", unidade: "/100", atual: 68, delta: 3, serie: serie(60, [0, 2, 4, 6, 6, 8]) },
    { chave: "rotatividade", rotulo: "Rotatividade", unidade: "%", atual: 4.2, delta: -0.6, serie: serie(6, [0, -0.3, -0.8, -1.2, -1.5, -1.8]) },
    { chave: "formacao", rotulo: "Horas de formação", unidade: "h", atual: 128, delta: 12, serie: serie(60, [0, 12, 28, 52, 84, 116]) },
  ],
};

// ============ Histórico turnos ============
export const HISTORICO_TURNOS = [
  { turno: 1, receita: 82_400, custos: 61_200, ebitda: 21_200, valor: 560_000 },
  { turno: 2, receita: 91_100, custos: 62_800, ebitda: 28_300, valor: 568_400 },
  { turno: 3, receita: 104_500, custos: 68_900, ebitda: 35_600, valor: 583_600 },
  { turno: 4, receita: 118_200, custos: 71_400, ebitda: 46_800, valor: 612_300 },
];

// ============ Pesquisas guardadas ============
export type Pesquisa = {
  id: string;
  quando: string;
  titulo: string;
  resumo: string;
  confianca: number;
};

export const PESQUISAS_INICIAIS: Record<Lugar, Pesquisa[]> = {
  CEO: [
    { id: "c1", quando: "Turno 3", titulo: "Chamada com o presidente da Câmara", resumo: "Sinaliza vontade de apoiar indústria local — sem compromissos.", confianca: 0.72 },
  ],
  CFO: [
    { id: "f1", quando: "Turno 2", titulo: "Relatório do BdP", resumo: "Juro de referência estável em 3.75%; inflação a arrefecer.", confianca: 0.88 },
  ],
  COO: [
    { id: "o1", quando: "Turno 3", titulo: "Nota do investigador", resumo: "Fornecedor de madeira pode subir preços 6% no próximo trimestre.", confianca: 0.65 },
  ],
  CMO: [
    { id: "m1", quando: "Turno 2", titulo: "Dossiê de retalho", resumo: "Rival 'Nordis' aumentou preço em 4% sem perder tráfego visível.", confianca: 0.58 },
  ],
  CHRO: [
    { id: "h1", quando: "Turno 3", titulo: "Representante sindical", resumo: "Tensão no turno da noite; ausências acima da média.", confianca: 0.7 },
  ],
};

// ============ Fábrica ============
export const FABRICA = {
  linhas: [
    { produto: "Cadeira", producao: 320, capacidade: 400, defeito: 1.8 },
    { produto: "Mesa", producao: 180, capacidade: 240, defeito: 2.4 },
    { produto: "Armário", producao: 96, capacidade: 160, defeito: 3.1 },
  ],
  maquinas: 14,
  supervisores: 2,
  trabalhadores: 38,
  utilizacao: 82,
};

// ============ I&D ============
export type NoIeD = {
  id: string;
  ramo: "produto" | "processo";
  nome: string;
  descricao: string;
  estado: "concluido" | "em_curso" | "bloqueado";
  progresso: number;
};

export const ID_ARVORE: NoIeD[] = [
  { id: "p1", ramo: "produto", nome: "Verniz mate premium", descricao: "+2 pontos de perceção de qualidade.", estado: "concluido", progresso: 100 },
  { id: "p2", ramo: "produto", nome: "Coleção modular", descricao: "Nova linha de armários encaixáveis.", estado: "em_curso", progresso: 42 },
  { id: "p3", ramo: "produto", nome: "Certificação ecológica", descricao: "Selo FSC em todas as linhas.", estado: "bloqueado", progresso: 0 },
  { id: "x1", ramo: "processo", nome: "Corte CNC otimizado", descricao: "−12% desperdício de madeira.", estado: "concluido", progresso: 100 },
  { id: "x2", ramo: "processo", nome: "Turnos escalonados", descricao: "+8% utilização com o mesmo pessoal.", estado: "em_curso", progresso: 66 },
  { id: "x3", ramo: "processo", nome: "Automação de acabamento", descricao: "Robot de lixagem na linha de mesas.", estado: "bloqueado", progresso: 0 },
];

// ============ Ruas ============
export const RUAS = {
  minhaLoja: { nome: "Marnera & Filhos", valor: 612_300, quota: 18.4 },
  rivais: [
    { inicial: "N", nome: "Rival A", valor: 704_200 },
    { inicial: "T", nome: "Rival B", valor: 588_100 },
    { inicial: "L", nome: "Rival C", valor: 462_900 },
  ],
  porto: { navios: 3, contentores_espera: 12, custo_frete: 2_400 },
};

// ============ Jornal ============
export const JORNAL = {
  data: "Gazeta · Turno 4",
  manchetes: [
    { titulo: "Banco central mantém juro em 3.75%", tag: "Juro" },
    { titulo: "Inflação desacelera para 2.4% homóloga", tag: "Inflação" },
    { titulo: "Procura por mobiliário sobe 3% no trimestre", tag: "Procura" },
    { titulo: "Emprego industrial em máximos de 5 anos", tag: "Emprego" },
  ],
  demonstracao: { receita: 118_200, custos: 71_400, ebitda: 46_800 },
  decisoes: [
    { pasta: "COO", texto: "Aumentar linha de mesas em 15%", estado: "aplicado" as const },
    { pasta: "CMO", texto: "Baixar preço da cadeira em 5%", estado: "ajustado" as const },
    { pasta: "CFO", texto: "Emitir dívida de 40k€", estado: "anulado" as const },
  ],
  concorrencia: [
    { inicial: "N", valor: 704_200 },
    { inicial: "T", valor: 588_100 },
    { inicial: "L", valor: 462_900 },
  ],
};

// ============ Board (missão + seed) ============
export const BOARD = {
  missao:
    "Consolidar a Marnera & Filhos como referência ibérica em mobiliário funcional e durável, mantendo margem operacional acima de 20% até ao fim do mandato.",
  seed: {
    industria: "Mobiliário doméstico",
    mercado_alvo: "Zona metropolitana de Lisboa",
    capital_inicial: 500_000,
    dividas_iniciais: 80_000,
    ativos_iniciais: ["1 fábrica", "1 loja", "38 colaboradores"],
    concorrentes: 3,
  },
};

// ============ Colaboradores (CHRO) ============
export type ColaboradorDemo = {
  id: string;
  nome: string;
  arquetipo: Arquetipo;
  variante: 1 | 2;
  papel_org: string;
  moral: number;
  stress: number;
  antiguidade: number;
};

export const COLABORADORES_DEMO: ColaboradorDemo[] = [
  { id: "1", nome: "Alberto Reis", arquetipo: "Veterano", variante: 1, papel_org: "Supervisor · Cadeiras", moral: 74, stress: 28, antiguidade: 22 },
  { id: "2", nome: "Fátima Cardoso", arquetipo: "Veterano", variante: 2, papel_org: "Supervisor · Armários", moral: 68, stress: 34, antiguidade: 18 },
  { id: "3", nome: "Rui Antunes", arquetipo: "Talento", variante: 1, papel_org: "Investigador · Processo", moral: 82, stress: 42, antiguidade: 3 },
  { id: "4", nome: "Yara Sampaio", arquetipo: "Talento", variante: 2, papel_org: "Investigador · Produto", moral: 79, stress: 46, antiguidade: 2 },
  { id: "5", nome: "Manuel Torres", arquetipo: "Esteio", variante: 1, papel_org: "Gestor de linha", moral: 71, stress: 30, antiguidade: 11 },
  { id: "6", nome: "Isabel Neves", arquetipo: "Esteio", variante: 2, papel_org: "Gestor de linha", moral: 66, stress: 32, antiguidade: 9 },
  { id: "7", nome: "Diogo Barreto", arquetipo: "Inquieto", variante: 1, papel_org: "Trabalhador · Mesas", moral: 52, stress: 61, antiguidade: 4 },
  { id: "8", nome: "Aisha Mendes", arquetipo: "Inquieto", variante: 2, papel_org: "Trabalhador · Cadeiras", moral: 48, stress: 66, antiguidade: 5 },
  { id: "9", nome: "Tomás Ferreira", arquetipo: "Aprendiz", variante: 1, papel_org: "Trabalhador · Armários", moral: 76, stress: 22, antiguidade: 1 },
  { id: "10", nome: "Nadia Bento", arquetipo: "Aprendiz", variante: 2, papel_org: "Trabalhador · Mesas", moral: 72, stress: 24, antiguidade: 1 },
];

// ============ Decisões por pasta (controlos) ============
export type ControloDec = {
  chave: string;
  rotulo: string;
  tipo: "slider" | "toggle" | "opcoes";
  valor: number | boolean | string;
  min?: number;
  max?: number;
  passo?: number;
  unidade?: string;
  opcoes?: string[];
};

export const CONTROLOS_INICIAIS: Record<Lugar, ControloDec[]> = {
  CEO: [
    { chave: "prioridade", rotulo: "Prioridade estratégica", tipo: "opcoes", valor: "Crescimento", opcoes: ["Crescimento", "Rentabilidade", "Consolidação"] },
    { chave: "risco", rotulo: "Apetite ao risco", tipo: "slider", valor: 55, min: 0, max: 100, passo: 5, unidade: "/100" },
    { chave: "comunicar", rotulo: "Comunicar resultados ao conselho", tipo: "toggle", valor: true },
  ],
  CFO: [
    { chave: "divida_nova", rotulo: "Emissão de dívida", tipo: "slider", valor: 0, min: 0, max: 200_000, passo: 10_000, unidade: "€" },
    { chave: "dividendo", rotulo: "Distribuir dividendo", tipo: "toggle", valor: false },
    { chave: "reserva", rotulo: "Reserva de tesouraria", tipo: "slider", valor: 30, min: 0, max: 100, passo: 5, unidade: "%" },
  ],
  COO: [
    { chave: "cadeira", rotulo: "Produção · Cadeira", tipo: "slider", valor: 320, min: 0, max: 400, passo: 10, unidade: "un" },
    { chave: "mesa", rotulo: "Produção · Mesa", tipo: "slider", valor: 180, min: 0, max: 240, passo: 10, unidade: "un" },
    { chave: "armario", rotulo: "Produção · Armário", tipo: "slider", valor: 96, min: 0, max: 160, passo: 8, unidade: "un" },
  ],
  CMO: [
    { chave: "preco_cadeira", rotulo: "Preço · Cadeira", tipo: "slider", valor: 89, min: 40, max: 160, passo: 1, unidade: "€" },
    { chave: "preco_mesa", rotulo: "Preço · Mesa", tipo: "slider", valor: 249, min: 120, max: 480, passo: 5, unidade: "€" },
    { chave: "publicidade", rotulo: "Investimento em publicidade", tipo: "slider", valor: 8_000, min: 0, max: 40_000, passo: 500, unidade: "€" },
  ],
  CHRO: [
    { chave: "contratar", rotulo: "Contratar novos trabalhadores", tipo: "slider", valor: 0, min: 0, max: 10, passo: 1, unidade: "pessoas" },
    { chave: "formacao", rotulo: "Horas de formação", tipo: "slider", valor: 128, min: 0, max: 400, passo: 8, unidade: "h" },
    { chave: "bonus", rotulo: "Bónus de desempenho", tipo: "toggle", valor: false },
  ],
};

// ============ Objetos na secretária ============
export const OBJETO_SECRETARIA: Record<Lugar, { rotulo: string; icone: string; acao: string }> = {
  CEO: { rotulo: "Telefone", icone: "📞", acao: "Ligar a um contacto" },
  CFO: { rotulo: "Relatório do banco", icone: "📊", acao: "Ler relatório financeiro" },
  COO: { rotulo: "Nota do investigador", icone: "🧪", acao: "Investigar processo" },
  CMO: { rotulo: "Dossiê do mercado", icone: "📁", acao: "Abrir dossiê de rivais" },
  CHRO: { rotulo: "Representante", icone: "🤝", acao: "Ouvir representante" },
};

// ============ Pesquisas possíveis (mock) ============
export const RESULTADOS_PESQUISA: Record<Lugar, { titulo: string; resumo: string; confianca: number }[]> = {
  CEO: [
    { titulo: "Chamada com o Ministério", resumo: "Nova linha de apoios à indústria em preparação.", confianca: 0.6 },
    { titulo: "Reunião com a Presidente do Conselho", resumo: "Aprova estratégia atual; pede prudência com dívida.", confianca: 0.8 },
  ],
  CFO: [
    { titulo: "Estudo BCE", resumo: "Espera-se subida de 25pb no próximo semestre.", confianca: 0.55 },
    { titulo: "Análise de crédito", resumo: "Empresa mantém rating BBB estável.", confianca: 0.9 },
  ],
  COO: [
    { titulo: "Auditoria de linha", resumo: "Gargalo detetado na estação de lixagem.", confianca: 0.75 },
    { titulo: "Fornecedor alternativo", resumo: "Preço 4% inferior, prazo 2 semanas mais longo.", confianca: 0.7 },
  ],
  CMO: [
    { titulo: "Estudo de mercado", resumo: "Segmento premium cresce 6% ao ano.", confianca: 0.65 },
    { titulo: "Análise de rival", resumo: "'Rival A' abriu nova loja no centro.", confianca: 0.8 },
  ],
  CHRO: [
    { titulo: "Pulso interno", resumo: "78% da equipa quer horários mais previsíveis.", confianca: 0.7 },
    { titulo: "Mercado laboral", resumo: "Salários da concorrência subiram 3%.", confianca: 0.75 },
  ],
};
