import { BOARD } from "@/lib/jogo/dados-exemplo";

export function SalaBoard() {
  return (
    <div className="space-y-6">
      <section className="rounded-sm border bg-card p-6">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Missão da Administração</div>
        <p className="mt-3 font-serif text-xl leading-snug text-foreground">
          &ldquo;{BOARD.missao}&rdquo;
        </p>
        <div className="mono mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          — Presidente do Conselho de Administração
        </div>
      </section>

      <section className="rounded-sm border bg-card">
        <header className="border-b px-6 py-4">
          <div className="mono text-[10px] uppercase tracking-widest text-gold">Economia atribuída · Seed</div>
          <h2 className="font-serif text-2xl">Ponto de partida</h2>
        </header>
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <Campo rotulo="Indústria" valor={BOARD.seed.industria} />
          <Campo rotulo="Mercado-alvo" valor={BOARD.seed.mercado_alvo} />
          <Campo rotulo="Capital inicial" valor={`${(BOARD.seed.capital_inicial / 1000).toFixed(0)}k €`} mono />
          <Campo rotulo="Dívidas iniciais" valor={`${(BOARD.seed.dividas_iniciais / 1000).toFixed(0)}k €`} mono />
          <Campo rotulo="Ativos" valor={BOARD.seed.ativos_iniciais.join(" · ")} />
          <Campo rotulo="Concorrentes" valor={`${BOARD.seed.concorrentes}`} mono />
        </dl>
      </section>
    </div>
  );
}

function Campo({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <dt className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{rotulo}</dt>
      <dd className={`mt-1 ${mono ? "mono text-lg" : "font-serif text-lg"}`}>{valor}</dd>
    </div>
  );
}
