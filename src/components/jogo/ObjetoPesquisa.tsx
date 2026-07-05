import { useState } from "react";
import { useJogo } from "./JogoContext";
import { OBJETO_SECRETARIA } from "@/lib/jogo/dados-exemplo";
import type { Lugar } from "@/lib/jogo/tipos";

const TIPO_POR_LUGAR: Record<Lugar, string> = {
  CEO: "dialogo",
  CFO: "estudo_economico",
  COO: "analise_id",
  CMO: "pesquisa_mercado",
  CHRO: "concorrencia_parcial",
};

export function ObjetoPesquisa({ lugar }: { lugar: Lugar }) {
  const { pesquisas, usarPesquisa, podeEditar } = useJogo();
  const obj = OBJETO_SECRETARIA[lugar];
  const lista = pesquisas[lugar] ?? [];
  const editavel = podeEditar(lugar);
  const [nivel, setNivel] = useState<"1" | "2" | "3">("1");
  const [ocupado, setOcupado] = useState(false);

  async function investigar() {
    setOcupado(true);
    try {
      await usarPesquisa(lugar, TIPO_POR_LUGAR[lugar], nivel);
    } finally {
      setOcupado(false);
    }
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
          disabled={!editavel || ocupado}
          onClick={investigar}
          aria-label={obj.acao}
          className="group flex h-16 w-16 items-center justify-center rounded-sm border bg-navy text-3xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: "var(--gold)" }}
          title={obj.acao}
        >
          <span aria-hidden>{obj.icone}</span>
        </button>
        <div className="flex-1">
          <div className="font-serif text-base">{obj.acao}</div>
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Máx. 1 por turno · escolha o nível
          </div>
          <div className="mt-2 flex gap-1.5">
            {(["1", "2", "3"] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNivel(n)}
                disabled={!editavel}
                className={`rounded-sm border px-2.5 py-1 text-xs disabled:opacity-50 ${nivel === n ? "border-gold bg-gold/10" : "border-border text-muted-foreground"}`}
              >
                Nível {n}
              </button>
            ))}
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
              <div className="font-serif text-sm capitalize">{p.tipo.replace(/_/g, " ")}{p.nivel ? ` · Nv ${p.nivel}` : ""}</div>
              {p.confianca != null && (
                <span className="mono shrink-0 text-[10px] uppercase tracking-widest text-gold">
                  conf. {Math.round(Number(p.confianca) * 100)}%
                </span>
              )}
            </div>
            {p.resultado && (
              <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                {JSON.stringify(p.resultado, null, 2)}
              </pre>
            )}
            <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {new Date(p.criado_em).toLocaleString("pt-PT")}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
