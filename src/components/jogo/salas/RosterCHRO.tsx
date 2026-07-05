import { AvatarColaborador } from "../AvatarColaborador";
import { COLABORADORES_DEMO } from "@/lib/jogo/dados-exemplo";

export function RosterCHRO() {
  return (
    <section className="rounded-sm border bg-card">
      <header className="flex items-baseline justify-between border-b px-4 py-3">
        <h3 className="font-serif text-lg">Pessoas · Roster</h3>
        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {COLABORADORES_DEMO.length} colaboradores
        </span>
      </header>
      <ul className="grid gap-3 p-4 sm:grid-cols-2">
        {COLABORADORES_DEMO.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-sm border bg-background p-3">
            <AvatarColaborador arquetipo={c.arquetipo} variante={c.variante} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-serif text-sm">{c.nome}</div>
                <span className="mono text-[9px] uppercase tracking-widest text-gold">{c.arquetipo}</span>
              </div>
              <div className="mono truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                {c.papel_org} · {c.antiguidade}a
              </div>
              <div className="mt-2 space-y-1">
                <Barra rotulo="Moral" valor={c.moral} />
                <Barra rotulo="Stress" valor={c.stress} inverso />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Barra({ rotulo, valor, inverso }: { rotulo: string; valor: number; inverso?: boolean }) {
  const bom = inverso ? valor < 40 : valor > 60;
  return (
    <div>
      <div className="mono flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
        <span>{rotulo}</span>
        <span>{valor}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${valor}%`,
            background: bom ? "var(--gold)" : "var(--slate)",
          }}
        />
      </div>
    </div>
  );
}
