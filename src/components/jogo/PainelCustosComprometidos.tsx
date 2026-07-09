import { useMemo } from "react";
import { useJogo } from "./JogoContext";
import { calcularCustosComprometidos, formatarEur } from "@/lib/jogo/custos-comprometidos";

export function useCustosComprometidos() {
  const {
    modo, ronda_id, ronda_indice, snapshotAtual, colaboradores, decisoes, rascunho, pesquisas,
  } = useJogo();
  return useMemo(
    () => calcularCustosComprometidos({
      modo, ronda_id, ronda_indice, snapshot: snapshotAtual, colaboradores, decisoes, rascunho, pesquisas,
    }),
    [modo, ronda_id, ronda_indice, snapshotAtual, colaboradores, decisoes, rascunho, pesquisas],
  );
}

export function PainelCustosComprometidos() {
  const { grupos, total } = useCustosComprometidos();
  return (
    <section className="rounded-sm border bg-card">
      <header className="border-b px-4 py-3">
        <h3 className="font-serif text-lg">Custos comprometidos este turno</h3>
        <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Saídas em compromisso a partir das decisões actuais · Receita depende do mercado · Juros liquidados na resolução
        </p>
      </header>
      <div className="divide-y">
        {grupos.map((g) => (
          <div key={g.titulo} className="px-4 py-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{g.titulo}</div>
              <div className="mono text-sm">{formatarEur(g.subtotal)}</div>
            </div>
            <ul className="space-y-0.5">
              {g.linhas.map((l, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-serif">{l.rotulo}</span>
                    {l.nota && (
                      <span className="mono ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {l.nota}
                      </span>
                    )}
                  </span>
                  <span className="mono shrink-0 text-muted-foreground">{formatarEur(l.valor)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <footer className="flex items-baseline justify-between border-t bg-muted/30 px-4 py-3">
        <div className="mono text-[11px] uppercase tracking-widest">Total comprometido</div>
        <div className="font-serif text-xl text-gold">{formatarEur(total)}</div>
      </footer>
    </section>
  );
}

export function TotalComprometidoCompacto() {
  const { total } = useCustosComprometidos();
  return (
    <div className="flex items-baseline justify-between rounded-sm border border-dashed border-gold/40 bg-gold/5 px-3 py-2">
      <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Comprometido este turno
      </span>
      <span className="mono text-sm text-gold">{formatarEur(total)}</span>
    </div>
  );
}
