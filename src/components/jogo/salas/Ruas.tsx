import { useJogo } from "../JogoContext";
import { RUAS } from "@/lib/jogo/dados-exemplo";
import { Livre } from "../Livre";
import { Anchor } from "lucide-react";

export function Ruas() {
  const { modo, nomeEmpresa, snapshotAtual, rivais, equipa_id } = useJogo();

  const minhaLoja =
    modo === "real"
      ? { nome: nomeEmpresa, valor: Number(snapshotAtual?.valor ?? 0), quota: Number(snapshotAtual?.quota ?? 0) }
      : RUAS.minhaLoja;

  const listaRivais =
    modo === "real"
      ? rivais.filter((r) => r.equipa_id !== equipa_id).map((r) => ({ inicial: r.nome.charAt(0).toUpperCase() || "?", valor: r.valor }))
      : RUAS.rivais.map((r) => ({ inicial: r.inicial, valor: r.valor }));

  return (
    <div className="space-y-6">
      <section className="rounded-sm border bg-card p-6">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">A minha loja</div>
        <div className="mt-3 flex items-center gap-4">
          <Livre inicial={minhaLoja.nome.charAt(0)} size={56} />
          <div>
            <div className="font-serif text-2xl">{minhaLoja.nome}</div>
            <div className="mono text-xs text-muted-foreground">
              Valor <span className="text-foreground">{(minhaLoja.valor / 1000).toFixed(0)}k €</span>{" · "}
              Quota <span className="text-foreground">{Number(minhaLoja.quota).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-lg">Lojas rivais</h3>
        <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Apenas o valor de cada rival está visível
        </p>
        {listaRivais.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sem resultados de rivais ainda.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {listaRivais.map((r, i) => (
              <li key={i} className="rounded-sm border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Livre inicial={r.inicial} size={40} />
                  <div>
                    <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Rival</div>
                    <div className="font-serif text-lg">Valor</div>
                  </div>
                </div>
                <div className="mono mt-3 text-2xl">{(r.valor / 1000).toFixed(0)}k €</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-sm border bg-card p-6">
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-lg">Porto</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Dados operacionais ligados na próxima fase.</p>
      </section>
    </div>
  );
}
