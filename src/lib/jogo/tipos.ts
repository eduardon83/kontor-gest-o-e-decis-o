export const LUGARES = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;
export type Lugar = (typeof LUGARES)[number];

export const NOME_LUGAR: Record<Lugar, string> = {
  CEO: "CEO",
  CFO: "CFO",
  COO: "COO",
  CMO: "CMO",
  CHRO: "CHRO",
};

export const PAPEL_COMPLETO: Record<Lugar, string> = {
  CEO: "Direção Executiva",
  CFO: "Finanças",
  COO: "Operações",
  CMO: "Mercado",
  CHRO: "Pessoas",
};

export const ARQUETIPOS = [
  "Veterano",
  "Talento",
  "Esteio",
  "Inquieto",
  "Aprendiz",
] as const;
export type Arquetipo = (typeof ARQUETIPOS)[number];

export const SALAS = [
  { id: "gabinete", nome: "O meu gabinete" },
  { id: "board", nome: "Sala da Board" },
  { id: "fabrica", nome: "Chão de fábrica" },
  { id: "laboratorio", nome: "Laboratório" },
  { id: "ruas", nome: "Ruas" },
  { id: "jornal", nome: "Jornal do turno" },
] as const;
export type SalaId = (typeof SALAS)[number]["id"];

export type Acesso =
  | { modo: "docente" }
  | { modo: "jogador"; meuLugar: Lugar }
  | { modo: "condutor" };
