// Estrutura do tema. Persiste em competicoes.tema (override) e instituicoes.tema (base).

export type TemaTokens = {
  navy?: string;
  gold?: string;
  paper?: string;
  goldForeground?: string;
  fonteSerif?: string;
  fonteMono?: string;
};

export type TemaSlots = {
  logo?: string;
  cena_sede?: string;
  gabinete_CEO?: string;
  gabinete_CFO?: string;
  gabinete_COO?: string;
  gabinete_CMO?: string;
  gabinete_CHRO?: string;
  blueprint?: string;
  jornal_cabecalho?: string;
  landing?: string;
};

export type Tema = {
  tokens?: TemaTokens;
  slots?: TemaSlots;
};

export const TEMA_DEFAULT: Required<Tema> = {
  tokens: {
    navy: "oklch(0.28 0.06 250)",
    gold: "oklch(0.74 0.12 82)",
    goldForeground: "oklch(0.18 0.04 255)",
    paper: "oklch(0.96 0.015 85)",
    fonteSerif: '"Fraunces", ui-serif, Georgia, serif',
    fonteMono: '"JetBrains Mono", ui-monospace, monospace',
  },
  slots: {},
};

export function combinarTema(...temas: (Tema | null | undefined)[]): Required<Tema> {
  const tokens: TemaTokens = { ...TEMA_DEFAULT.tokens };
  const slots: TemaSlots = { ...TEMA_DEFAULT.slots };
  for (const t of temas) {
    if (!t) continue;
    if (t.tokens) for (const [k, v] of Object.entries(t.tokens)) if (v) (tokens as any)[k] = v;
    if (t.slots) for (const [k, v] of Object.entries(t.slots)) if (v) (slots as any)[k] = v;
  }
  return { tokens, slots };
}
