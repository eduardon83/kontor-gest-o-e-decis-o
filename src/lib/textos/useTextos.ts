import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { textosResolvidos } from "@/lib/textos.functions";
import { criarFuncaoTexto, type FuncaoTexto } from "@/lib/textos/render";
import { DEFAULTS_TEXTO } from "@/lib/textos/catalogo";

/**
 * Textos da interface com cascata competição → instituição → global → defaults.
 * Enquanto carrega (ou se a leitura falhar) devolve já os defaults no código.
 */
export function useTextos(competicao_id?: string | null): FuncaoTexto {
  const carregar = useServerFn(textosResolvidos);
  const { data } = useQuery({
    queryKey: ["textos", competicao_id ?? "global"],
    queryFn: () => carregar({ data: { competicao_id: competicao_id ?? null } }),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const mapa = (data as { mapa?: Record<string, string[]> } | undefined)?.mapa ?? {};
  return useMemo(() => criarFuncaoTexto(mapa, DEFAULTS_TEXTO), [data]);
}
