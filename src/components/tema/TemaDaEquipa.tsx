import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TemaProvider } from "@/components/tema/TemaProvider";
import type { Tema } from "@/lib/tema/tipos";

/**
 * Lê o tema da competição a que a equipa pertence (e o tema da instituição
 * como fallback), e aplica-os globalmente via CSS variables.
 */
export function TemaDaEquipa({ equipaId, children }: { equipaId?: string | null; children: ReactNode }) {
  const [temaComp, setTemaComp] = useState<Tema | null>(null);
  const [temaInst, setTemaInst] = useState<Tema | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!equipaId) { setTemaComp(null); setTemaInst(null); return; }
      const { data: eq } = await supabase
        .from("equipas")
        .select("mercados(competicoes(tema, instituicoes(tema)))")
        .eq("id", equipaId)
        .maybeSingle();
      if (!vivo) return;
      const comp = (eq as any)?.mercados?.competicoes;
      setTemaComp((comp?.tema as Tema) ?? null);
      setTemaInst((comp?.instituicoes?.tema as Tema) ?? null);
    })();
    return () => { vivo = false; };
  }, [equipaId]);

  return (
    <TemaProvider temaCompeticao={temaComp} temaInstituicao={temaInst} escopo="root">
      {children}
    </TemaProvider>
  );
}
