import { useJogo } from "./JogoContext";
import { OBJETO_SECRETARIA, RESULTADOS_PESQUISA } from "@/lib/jogo/dados-exemplo";
import type { Lugar } from "@/lib/jogo/tipos";

export function ObjetoPesquisa({ lugar }: { lugar: Lugar }) {
  const { pesquisas, adicionarPesquisa, podeEditar } = useJogo();
  const obj = OBJETO_SECRETARIA[lugar];
  const lista = pesquisas[lugar];
  const editavel = podeEditar(lugar);

  function investigar() {
    const pool = RESULTADOS_PESQUISA[lugar];
    const escolha = pool[Math.floor(Math.random() * pool.length)];
    adicionarPesquisa(lugar, {
      id: crypto.randomUUID(),
      quando: `Turno 4 · agora`,
      titulo: escolha.titulo,
      resumo: escolha.resumo,
      confianca: escolha.confianca,
    });
  }

  return (
    <section className="rounded-sm border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-serif text-lg">Pesquisar · {obj.rotulo}</h3>
        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {lista.length} registo{lista.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="flex items-center gap-4 border-b bg-muted/30 p-4">
        <button
          disabled={!editavel}
          onClick={investigar}
          aria-label={obj.acao}
          className="group flex h-16 w-16 items-center justify-center rounded-sm border bg-navy text-3xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: "var(--gold)" }}
          title={obj.acao}
        >
          <span aria-hidden>{obj.icone}</span>
        </button>
        <div>
          <div className="font-serif text-base">{obj.acao}</div>
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Clica no objeto para investigar
          </div>
        </div>
      </div>

      <ul className="divide-y">
        {lista.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">Sem pesquisas ainda.</li>
        )}
        {lista.map((p) => (
          <li key={p.id} className="p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-serif text-sm">{p.titulo}</div>
              <span className="mono shrink-0 text-[10px] uppercase tracking-widest text-gold">
                conf. {(p.confianca * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.resumo}</p>
            <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {p.quando}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
