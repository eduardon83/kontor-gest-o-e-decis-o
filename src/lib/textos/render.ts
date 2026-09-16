// Motor de moldes de texto: interpolação, variantes determinísticas e validação.
// SEM IMPORTS — este ficheiro é espelhado para supabase/functions/_shared/textos-render.ts

export type VarsMolde = Record<string, string | number | null | undefined>;

const RE_VAR = /\{([a-zA-Z0-9_]+)\}/g;

/** Nomes das variáveis usadas num texto, sem repetições. */
export function variaveisDoTexto(texto: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  RE_VAR.lastIndex = 0;
  while ((m = RE_VAR.exec(texto)) !== null) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/** Substitui {variavel} pelos valores dados. Variáveis sem valor ficam vazias. */
export function interpolar(texto: string, vars: VarsMolde = {}): string {
  return texto.replace(RE_VAR, (_all, nome: string) => {
    const v = vars[nome];
    return v === undefined || v === null ? "" : String(v);
  }).replace(/\s{2,}/g, " ").trim();
}

/** Hash estável (FNV-1a de 32 bits) para escolha determinística. */
export function hashTexto(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Escolhe uma variante de forma determinística a partir de uma seed textual. */
export function escolherVariante(variantes: string[], seed: string): string {
  const lista = variantes.filter((v) => v.trim().length > 0);
  if (lista.length === 0) return "";
  if (lista.length === 1) return lista[0];
  return lista[hashTexto(seed) % lista.length];
}

/** Texto do editor (uma variante por linha) → lista de variantes. */
export function linhasParaVariantes(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Lista de variantes → texto do editor. */
export function variantesParaTexto(variantes: string[]): string {
  return variantes.join("\n");
}

/** Variáveis usadas que não constam da lista de permitidas. */
export function variaveisInvalidas(variantes: string[], permitidas: string[]): string[] {
  const set = new Set(permitidas);
  const mas: string[] = [];
  for (const v of variantes) {
    for (const nome of variaveisDoTexto(v)) {
      if (!set.has(nome) && !mas.includes(nome)) mas.push(nome);
    }
  }
  return mas;
}

export type FuncaoTexto = (chave: string, vars?: VarsMolde, seed?: string) => string;

/**
 * Cria a função de texto com cascata:
 *   competição → instituição → global → defaults no código.
 * `mapa` já deve vir resolvido por escopo; `defaults` é o fallback final.
 */
export function criarFuncaoTexto(
  mapa: Record<string, string[]>,
  defaults: Record<string, string[]>,
): FuncaoTexto {
  return (chave, vars = {}, seed = "") => {
    const variantes = (mapa[chave]?.length ? mapa[chave] : defaults[chave]) ?? [];
    if (!variantes.length) return "";
    return interpolar(escolherVariante(variantes, `${chave}|${seed}`), vars);
  };
}

export type LinhaMolde = {
  chave: string;
  texto: string;
  escopo: "global" | "instituicao" | "competicao";
  instituicao_id: string | null;
  competicao_id: string | null;
  ativo: boolean;
};

/** Aplica a cascata de escopos sobre as linhas lidas da base de dados. */
export function resolverCascata(
  linhas: LinhaMolde[],
  alvo: { instituicao_id?: string | null; competicao_id?: string | null },
): Record<string, string[]> {
  const peso = (l: LinhaMolde): number => {
    if (l.escopo === "competicao") return l.competicao_id && l.competicao_id === alvo.competicao_id ? 3 : -1;
    if (l.escopo === "instituicao") return l.instituicao_id && l.instituicao_id === alvo.instituicao_id ? 2 : -1;
    return 1;
  };
  const melhor: Record<string, { p: number; variantes: string[] }> = {};
  for (const l of linhas) {
    if (!l.ativo) continue;
    const p = peso(l);
    if (p < 0) continue;
    const variantes = linhasParaVariantes(l.texto ?? "");
    if (!variantes.length) continue;
    if (!melhor[l.chave] || melhor[l.chave].p < p) melhor[l.chave] = { p, variantes };
  }
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(melhor)) out[k] = v.variantes;
  return out;
}
