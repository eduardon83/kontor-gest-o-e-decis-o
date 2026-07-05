import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PainelShell } from "@/components/painel/PainelShell";
import { resultadosCompeticao } from "@/lib/competicao.functions";
import { MercadoBloco } from "@/components/competicao/MercadoBloco";

export const Route = createFileRoute("/_authenticated/painel/jogador/competicao")({
  validateSearch: (s) => z.object({
    competicao: z.string().uuid(),
    equipa: z.string().uuid(),
  }).parse(s),
  component: Pagina,
});

function Pagina() {
  const { competicao, equipa } = Route.useSearch();
  const fn = useServerFn(resultadosCompeticao);
  const query = useQuery({
    queryKey: ["competicao", competicao, "resultados", "jogador", equipa],
    queryFn: () => fn({ data: { competicao_id: competicao, visao: "jogador", equipa_id: equipa } }),
  });

  const dados = query.data;

  return (
    <PainelShell papel="jogador" titulo={dados?.competicao?.nome ?? "Competição"} descricao="Classificação do seu mercado.">
      <Link to="/painel/jogador" search={{ equipa }} className="mb-4 inline-block font-mono text-xs text-slate hover:underline">
        ← voltar ao jogo
      </Link>
      {query.isLoading && <p className="font-mono text-xs text-slate">A carregar…</p>}
      {query.error && <p className="text-sm text-destructive">{(query.error as Error).message}</p>}
      {dados && dados.mercados.map((m: any) => (
        <MercadoBloco key={m.id} mercado={m} dados={dados} visao="jogador" />
      ))}
    </PainelShell>
  );
}
