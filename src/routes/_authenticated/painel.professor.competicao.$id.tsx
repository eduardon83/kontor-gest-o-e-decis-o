import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PainelShell } from "@/components/painel/PainelShell";
import { resultadosCompeticao, submissoesRondaAtual, avancarRondaAgora } from "@/lib/competicao.functions";
import { MercadoBloco } from "@/components/competicao/MercadoBloco";


export const Route = createFileRoute("/_authenticated/painel/professor/competicao/$id")({
  component: Pagina,
});

function Pagina() {
  const { id } = Route.useParams();
  const router = useRouter();

  const resultadosFn = useServerFn(resultadosCompeticao);
  const submissoesFn = useServerFn(submissoesRondaAtual);
  const avancarFn = useServerFn(avancarRondaAgora);

  const resultados = useQuery({
    queryKey: ["competicao", id, "resultados", "professor"],
    queryFn: () => resultadosFn({ data: { competicao_id: id, visao: "professor" } }),
  });
  const submissoes = useQuery({
    queryKey: ["competicao", id, "submissoes"],
    queryFn: () => submissoesFn({ data: { competicao_id: id } }),
    refetchInterval: 15_000,
  });

  const [avanceErro, setAvanceErro] = useState<string | null>(null);
  const avancar = useMutation({
    mutationFn: () => avancarFn({ data: { competicao_id: id } }),
    onSuccess: () => { setAvanceErro(null); router.invalidate(); resultados.refetch(); submissoes.refetch(); },
    onError: (e) => setAvanceErro(e instanceof Error ? e.message : "Falha ao avançar."),
  });

  const dados = resultados.data;
  const sub = submissoes.data;

  return (
    <PainelShell papel="professor" titulo={dados?.competicao?.nome ?? "Competição"} descricao="Resultados por mercado, evolução e controlo de turno.">
      <Link to="/painel/professor" className="mb-4 inline-block font-mono text-xs text-slate hover:underline">
        ← voltar ao painel
      </Link>

      {/* Controlo de turno */}
      <section className="mb-8 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg">Ronda atual</h2>
            {sub?.ronda ? (
              <p className="mt-1 font-mono text-xs text-slate">
                Turno {sub.ronda.indice} · estado {sub.ronda.estado}
                {sub.ronda.prazo_em ? ` · prazo ${new Date(sub.ronda.prazo_em).toLocaleString("pt-PT")}` : " · sem prazo automático"}
              </p>
            ) : (
              <p className="mt-1 font-mono text-xs text-slate">Sem ronda aberta.</p>
            )}
          </div>
          <button
            onClick={() => avancar.mutate()}
            disabled={!sub?.ronda || avancar.isPending}
            className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-navy transition-colors hover:brightness-95 disabled:opacity-50"
          >
            {avancar.isPending ? "A resolver…" : "Avançar turno agora"}
          </button>
        </div>
        {avanceErro && (
          <p className="mt-3 rounded border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">{avanceErro}</p>
        )}

        {sub?.equipas && sub.equipas.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-slate">
                  <th className="py-2">Equipa</th>
                  <th>CEO</th><th>CFO</th><th>COO</th><th>CMO</th><th>CHRO</th>
                  <th className="text-right">Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sub.equipas.map((eq: any) => (
                  <tr key={eq.id} className="border-b border-border/50">
                    <td className="py-2">
                      {eq.nome} {eq.is_ia && <span className="ml-1 rounded bg-navy/10 px-1 font-mono text-[9px] uppercase">IA</span>}
                    </td>
                    {["CEO","CFO","COO","CMO","CHRO"].map((l) => (
                      <td key={l}>
                        <span className={eq.submissoes[l] || eq.is_ia ? "text-gold" : "text-muted-foreground"}>
                          {eq.submissoes[l] || eq.is_ia ? "●" : "○"}
                        </span>
                      </td>
                    ))}
                    <td className="text-right font-mono text-xs">
                      {eq.completo ? <span className="text-gold">completo</span> : <span className="text-muted-foreground">pendente</span>}
                    </td>
                    <td className="pl-3 text-right">
                      {!eq.is_ia && (
                        <Link
                          to="/painel/professor/conduzir/$competicao/$equipa"
                          params={{ competicao: id, equipa: eq.id }}
                          className="mono inline-block rounded-sm border border-gold px-2 py-1 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/10"
                        >
                          Conduzir
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {resultados.isLoading && <p className="font-mono text-xs text-slate">A carregar resultados…</p>}
      {resultados.error && <p className="text-sm text-destructive">{(resultados.error as Error).message}</p>}

      {dados && dados.mercados.map((mercado: any) => (
        <MercadoBloco key={mercado.id} mercado={mercado} dados={dados} visao="professor" />
      ))}
    </PainelShell>
  );
}
