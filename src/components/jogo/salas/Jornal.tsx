import { JORNAL } from "@/lib/jogo/dados-exemplo";
import { useJogo } from "../JogoContext";
import { fmtEUR, financeiroDo } from "../RelatorioFinanceiro";

const CORES_ESTADO = {
  aplicado: "text-gold",
  ajustado: "text-slate",
  anulado: "text-destructive",
} as const;

export function Jornal() {
  return (
    <div className="space-y-6">
      {/* Jornal principal */}
      <article
        className="rounded-sm border p-8"
        style={{
          backgroundColor: "var(--paper)",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 27px, color-mix(in oklab, var(--slate) 8%, transparent) 27px, color-mix(in oklab, var(--slate) 8%, transparent) 28px)",
        }}
      >
        <header className="border-b-2 border-navy pb-4">
          <div className="mono flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate">
            <span>Gazeta Comercial</span>
            <span>{JORNAL.data}</span>
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-none text-navy">A Semana em Revista</h1>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {JORNAL.manchetes.map((m) => (
            <div key={m.titulo} className="border-l-2 border-gold pl-4">
              <div className="mono text-[10px] uppercase tracking-widest text-gold">{m.tag}</div>
              <h2 className="mt-1 font-serif text-xl leading-tight text-navy">{m.titulo}</h2>
            </div>
          ))}
        </div>
      </article>

      {/* Faixa de dashboard */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-sm border bg-card p-4">
          <h3 className="font-serif text-lg">Demonstração de resultados</h3>
          <dl className="mono mt-3 space-y-1 text-sm">
            <Linha rotulo="Receita" valor={`${(JORNAL.demonstracao.receita / 1000).toFixed(1)}k €`} />
            <Linha rotulo="Custos" valor={`(${(JORNAL.demonstracao.custos / 1000).toFixed(1)}k €)`} />
            <Linha rotulo="EBITDA" valor={`${(JORNAL.demonstracao.ebitda / 1000).toFixed(1)}k €`} destaque />
          </dl>
        </div>

        <div className="rounded-sm border bg-card p-4">
          <h3 className="font-serif text-lg">Decisões desta ronda</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {JORNAL.decisoes.map((d, i) => (
              <li key={i} className="flex items-start justify-between gap-2">
                <div>
                  <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.pasta}</span>
                  <div className="text-foreground">{d.texto}</div>
                </div>
                <span className={`mono shrink-0 text-[10px] uppercase tracking-widest ${CORES_ESTADO[d.estado]}`}>
                  {d.estado}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border bg-card p-4">
          <h3 className="font-serif text-lg">Concorrência (valor)</h3>
          <ul className="mt-3 space-y-2">
            {JORNAL.concorrencia.map((c) => (
              <li key={c.inicial} className="flex items-center justify-between">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm border font-serif"
                  style={{ backgroundColor: "var(--navy)", color: "var(--gold)", borderColor: "var(--gold)" }}
                >
                  {c.inicial}
                </span>
                <span className="mono text-lg">{(c.valor / 1000).toFixed(0)}k €</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`flex justify-between border-b py-1 last:border-0 ${destaque ? "text-gold" : ""}`}>
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
