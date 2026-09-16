// Carregamento dos moldes de texto no servidor, com cascata:
// competição → instituição → global → defaults no código.
import { DEFAULTS_TEXTO } from "./textos-catalogo.ts";
import {
  criarFuncaoTexto,
  resolverCascata,
  type FuncaoTexto,
  type LinhaMolde,
} from "./textos-render.ts";

export type { FuncaoTexto };

export async function carregarTextos(
  sb: { from: (t: string) => any },
  alvo: { competicao_id?: string | null; instituicao_id?: string | null },
): Promise<FuncaoTexto> {
  try {
    const { data, error } = await sb
      .from("moldes_texto")
      .select("chave, texto, escopo, instituicao_id, competicao_id, ativo")
      .eq("ativo", true);
    if (error) throw new Error(error.message);
    const mapa = resolverCascata((data ?? []) as LinhaMolde[], alvo);
    return criarFuncaoTexto(mapa, DEFAULTS_TEXTO);
  } catch (e) {
    console.warn("[moldes_texto] fallback para defaults:", (e as Error).message);
    return criarFuncaoTexto({}, DEFAULTS_TEXTO);
  }
}
