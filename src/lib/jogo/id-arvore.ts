// Árvore de I&D — definições partilhadas (resolver + cliente).
export type IdRamo = "processo" | "produto";

export type IdNo = {
  id: string;
  ramo: IdRamo;
  nome: string;
  descricao: string;
  custo: number;         // progresso necessário para desbloquear
  prereq: string[];      // ids que têm de estar desbloqueados antes
};

export const ID_NOS: IdNo[] = [
  // Processo
  { id: "FINE", ramo: "processo", nome: "Acabamento fino", descricao: "Desbloqueia o tier 'fine'.", custo: 8, prereq: [] },
  { id: "ARTISAN", ramo: "processo", nome: "Manufatura artesanal", descricao: "Desbloqueia o tier 'artisan'.", custo: 14, prereq: ["FINE"] },
  { id: "AUTOMACAO", ramo: "processo", nome: "Automação", descricao: "Capacidade máquina ×1.15.", custo: 12, prereq: [] },
  { id: "LEAN", ramo: "processo", nome: "Lean manufacturing", descricao: "COGS −8%.", custo: 16, prereq: ["AUTOMACAO"] },
  // Produto (efeitos ficam para depois — estrutura registada).
  { id: "SECRETARIA", ramo: "produto", nome: "Secretária", descricao: "Nova linha (a definir).", custo: 10, prereq: [] },
  { id: "ESTANTE", ramo: "produto", nome: "Estante", descricao: "Nova linha (a definir).", custo: 10, prereq: [] },
  { id: "MODULAR", ramo: "produto", nome: "Coleção modular", descricao: "Combina secretária + estante.", custo: 18, prereq: ["SECRETARIA", "ESTANTE"] },
];

export type IdEstado = { desbloqueados: string[]; progresso: number };

export const ID_INICIAL: IdEstado = { desbloqueados: [], progresso: 0 };

// Nó "próximo elegível" — menor custo entre os que ainda não estão
// desbloqueados e cujos pré-requisitos estão satisfeitos.
export function proximoElegivel(estado: IdEstado, nos: IdNo[] = ID_NOS): IdNo | null {
  const feitos = new Set(estado.desbloqueados);
  const cand = nos.filter((n) => !feitos.has(n.id) && n.prereq.every((p) => feitos.has(p)));
  if (!cand.length) return null;
  cand.sort((a, b) => a.custo - b.custo);
  return cand[0];
}

// Estado de UI por nó.
export type IdEstadoNo = "desbloqueado" | "em_curso" | "bloqueado";
export function estadoDoNo(no: IdNo, estado: IdEstado): IdEstadoNo {
  if (estado.desbloqueados.includes(no.id)) return "desbloqueado";
  const prereqOk = no.prereq.every((p) => estado.desbloqueados.includes(p));
  if (!prereqOk) return "bloqueado";
  const prox = proximoElegivel(estado);
  return prox?.id === no.id ? "em_curso" : "bloqueado";
}
