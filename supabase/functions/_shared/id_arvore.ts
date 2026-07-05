// Árvore de I&D e perfis emergentes — motor (Deno).
// Mantém-se em paralelo com src/lib/jogo/id-arvore.ts para o cliente.

export type IdRamo = "processo" | "produto";
export type IdNo = {
  id: string; ramo: IdRamo; nome: string; descricao: string;
  custo: number; prereq: string[];
};

export const ID_NOS: IdNo[] = [
  { id: "FINE", ramo: "processo", nome: "Acabamento fino", descricao: "Desbloqueia o tier 'fine'.", custo: 8, prereq: [] },
  { id: "ARTISAN", ramo: "processo", nome: "Manufatura artesanal", descricao: "Desbloqueia o tier 'artisan'.", custo: 14, prereq: ["FINE"] },
  { id: "AUTOMACAO", ramo: "processo", nome: "Automação", descricao: "Capacidade máquina ×1.15.", custo: 12, prereq: [] },
  { id: "LEAN", ramo: "processo", nome: "Lean manufacturing", descricao: "COGS −8%.", custo: 16, prereq: ["AUTOMACAO"] },
  { id: "SECRETARIA", ramo: "produto", nome: "Secretária", descricao: "Nova linha (a definir).", custo: 10, prereq: [] },
  { id: "ESTANTE", ramo: "produto", nome: "Estante", descricao: "Nova linha (a definir).", custo: 10, prereq: [] },
  { id: "MODULAR", ramo: "produto", nome: "Coleção modular", descricao: "Combina secretária + estante.", custo: 18, prereq: ["SECRETARIA", "ESTANTE"] },
];

export type IdEstado = { desbloqueados: string[]; progresso: number };
export const ID_INICIAL: IdEstado = { desbloqueados: [], progresso: 0 };

export function proximoElegivel(estado: IdEstado): IdNo | null {
  const feitos = new Set(estado.desbloqueados);
  const cand = ID_NOS.filter((n) => !feitos.has(n.id) && n.prereq.every((p) => feitos.has(p)));
  if (!cand.length) return null;
  cand.sort((a, b) => a.custo - b.custo);
  return cand[0];
}

// ─── Perfis emergentes ───────────────────────────────────────────────────────
export type Profile = { apMod: number; greveMod: number; pushMod: number; rdMod: number; qMod: number };
export const PROFILE_NEUTRO: Profile = { apMod: 1, greveMod: 1, pushMod: 1, rdMod: 1, qMod: 1 };

export type PerfilNome = "Inovação" | "Pessoas" | "Mercado" | "Produção" | "Equilibrada";

// Média sobre a janela dos últimos até 3 turnos (últimas decisões consolidadas).
export type JanelaDec = {
  id_orcamento: number;
  contratar_investigadores: number;
  wageRatio: number;
  formacao: number;
  marketing: number;
  producao_total: number;
};

export function mediaJanela(amostras: JanelaDec[]): JanelaDec {
  const n = Math.max(1, amostras.length);
  const soma = amostras.reduce<JanelaDec>((s, a) => ({
    id_orcamento: s.id_orcamento + a.id_orcamento,
    contratar_investigadores: s.contratar_investigadores + a.contratar_investigadores,
    wageRatio: s.wageRatio + a.wageRatio,
    formacao: s.formacao + a.formacao,
    marketing: s.marketing + a.marketing,
    producao_total: s.producao_total + a.producao_total,
  }), { id_orcamento: 0, contratar_investigadores: 0, wageRatio: 0, formacao: 0, marketing: 0, producao_total: 0 });
  return {
    id_orcamento: soma.id_orcamento / n,
    contratar_investigadores: soma.contratar_investigadores / n,
    wageRatio: soma.wageRatio / n,
    formacao: soma.formacao / n,
    marketing: soma.marketing / n,
    producao_total: soma.producao_total / n,
  };
}

export function detetarPerfil(m: JanelaDec): { nome: PerfilNome; profile: Profile } {
  const rd = m.id_orcamento + m.contratar_investigadores * 1500;
  // Precedência exata pela ordem da especificação.
  if (rd >= 4000) return { nome: "Inovação", profile: { apMod: 1, greveMod: 1, pushMod: 1, rdMod: 1.4, qMod: 1.05 } };
  if (m.wageRatio >= 1.08 && m.formacao > 0) return { nome: "Pessoas", profile: { apMod: 1, greveMod: 0.5, pushMod: 1, rdMod: 1, qMod: 1 } };
  if (m.marketing >= 3500) return { nome: "Mercado", profile: { apMod: 1.1, greveMod: 1, pushMod: 1, rdMod: 1, qMod: 1 } };
  if (m.producao_total >= 1000) return { nome: "Produção", profile: { apMod: 1, greveMod: 1, pushMod: 1.5, rdMod: 1, qMod: 1 } };
  return { nome: "Equilibrada", profile: PROFILE_NEUTRO };
}
