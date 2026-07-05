import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { combinarTema, TEMA_DEFAULT, type Tema, type TemaSlots, type TemaTokens } from "@/lib/tema/tipos";

type Estado = {
  tokens: TemaTokens;
  slots: TemaSlots;
  slot: (nome: keyof TemaSlots, fallback?: string) => string | undefined;
};

const Ctx = createContext<Estado | null>(null);

/**
 * Aplica os tokens do tema como CSS variables no elemento raiz (opcional
 * scope via `escopo`). Resolve os slots de imagem por URL, com fallback
 * para as imagens do produto quando estão vazios.
 */
export function TemaProvider({
  temaCompeticao,
  temaInstituicao,
  escopo,
  children,
}: {
  temaCompeticao?: Tema | null;
  temaInstituicao?: Tema | null;
  escopo?: "root" | "container";
  children: ReactNode;
}) {
  const resolvido = useMemo(
    () => combinarTema(TEMA_DEFAULT, temaInstituicao, temaCompeticao),
    [temaCompeticao, temaInstituicao],
  );

  const cssVars = useMemo<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    const t = resolvido.tokens;
    if (t.navy) v["--navy"] = t.navy;
    if (t.gold) v["--gold"] = t.gold;
    if (t.goldForeground) v["--gold-foreground"] = t.goldForeground;
    if (t.paper) v["--paper"] = t.paper;
    if (t.fonteSerif) v["--font-serif"] = t.fonteSerif;
    if (t.fonteMono) v["--font-mono"] = t.fonteMono;
    return v;
  }, [resolvido]);

  useEffect(() => {
    if (escopo !== "root") return;
    const root = document.documentElement;
    const anteriores: [string, string][] = [];
    for (const [k, val] of Object.entries(cssVars)) {
      anteriores.push([k, root.style.getPropertyValue(k)]);
      root.style.setProperty(k, val);
    }
    return () => {
      for (const [k, val] of anteriores) {
        if (val) root.style.setProperty(k, val);
        else root.style.removeProperty(k);
      }
    };
  }, [cssVars, escopo]);

  const value = useMemo<Estado>(
    () => ({
      tokens: resolvido.tokens,
      slots: resolvido.slots,
      slot: (nome, fallback) => resolvido.slots[nome] || fallback,
    }),
    [resolvido],
  );

  if (escopo === "container") {
    return (
      <Ctx.Provider value={value}>
        <div style={cssVars as React.CSSProperties}>{children}</div>
      </Ctx.Provider>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTema() {
  return useContext(Ctx) ?? {
    tokens: TEMA_DEFAULT.tokens,
    slots: TEMA_DEFAULT.slots,
    slot: (n: keyof TemaSlots) => TEMA_DEFAULT.slots[n],
  };
}
