import { useJogo } from "./JogoContext";
import type { Lugar } from "@/lib/jogo/tipos";
import { Check, Lock } from "lucide-react";

export function ControlosPasta({ lugar }: { lugar: Lugar }) {
  const { controlos, atualizarControlo, submeter, submetidos, podeEditar, nomeEmpresa, setNomeEmpresa } = useJogo();
  const editavel = podeEditar(lugar);
  const lista = controlos[lugar];
  const submetido = submetidos[lugar];

  return (
    <section className="rounded-sm border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-serif text-lg">Decisões · {lugar}</h3>
          <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {editavel ? (submetido ? "Submetido" : "A preencher") : "Só-leitura"}
          </p>
        </div>
        {!editavel && <Lock className="h-4 w-4 text-muted-foreground" />}
      </header>

      <div className="space-y-5 p-4">
        {/* Especial: CEO pode mudar o nome da empresa */}
        {lugar === "CEO" && (
          <div>
            <label className="mono block text-[10px] uppercase tracking-widest text-muted-foreground">
              Nome da empresa
            </label>
            <input
              type="text"
              value={nomeEmpresa}
              disabled={!editavel}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="mt-1 w-full rounded-sm border bg-background px-3 py-2 font-serif text-base focus:border-gold focus:outline-none disabled:opacity-60"
            />
          </div>
        )}

        {lista.map((c) => (
          <div key={c.chave}>
            <div className="flex items-baseline justify-between">
              <label className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {c.rotulo}
              </label>
              <div className="mono text-xs text-foreground">
                {c.tipo === "toggle"
                  ? c.valor ? "Ativo" : "Inativo"
                  : `${c.valor}${c.unidade ? " " + c.unidade : ""}`}
              </div>
            </div>

            {c.tipo === "slider" && (
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.passo}
                value={c.valor as number}
                disabled={!editavel}
                onChange={(e) => atualizarControlo(lugar, c.chave, Number(e.target.value))}
                className="mt-2 w-full accent-[var(--gold)] disabled:opacity-50"
              />
            )}
            {c.tipo === "toggle" && (
              <button
                disabled={!editavel}
                onClick={() => atualizarControlo(lugar, c.chave, !c.valor)}
                className={`mt-2 inline-flex h-6 w-11 items-center rounded-full border transition-colors disabled:opacity-50 ${
                  c.valor ? "bg-gold border-gold" : "bg-muted border-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    c.valor ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            )}
            {c.tipo === "opcoes" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.opcoes!.map((o) => (
                  <button
                    key={o}
                    disabled={!editavel}
                    onClick={() => atualizarControlo(lugar, c.chave, o)}
                    className={`rounded-sm border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
                      c.valor === o ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Estado da equipa
          </div>
          <button
            disabled={!editavel || submetido}
            onClick={() => submeter(lugar)}
            className="mono inline-flex items-center gap-1.5 rounded-sm bg-navy px-3 py-2 text-[11px] uppercase tracking-widest text-paper transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submetido && <Check className="h-3 w-3 text-gold" />}
            {submetido ? "Submetido" : "Submeter o meu ecrã"}
          </button>
        </div>
      </div>
    </section>
  );
}
