import { FABRICA } from "@/lib/jogo/dados-exemplo";
import { Cog, HardHat, ShieldCheck } from "lucide-react";

export function ChaoFabrica() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <Metrica icone={<Cog />} rotulo="Máquinas" valor={FABRICA.maquinas} />
        <Metrica icone={<HardHat />} rotulo="Trabalhadores" valor={FABRICA.trabalhadores} />
        <Metrica icone={<ShieldCheck />} rotulo="Supervisores" valor={FABRICA.supervisores} />
        <Metrica icone={<Cog />} rotulo="Utilização" valor={`${FABRICA.utilizacao}%`} destaque />
      </section>

      <section className="rounded-sm border bg-card">
        <header className="border-b px-4 py-3">
          <h3 className="font-serif text-lg">Linhas de produção</h3>
        </header>
        <ul className="divide-y">
          {FABRICA.linhas.map((l) => {
            const pct = (l.producao / l.capacidade) * 100;
            return (
              <li key={l.produto} className="grid gap-2 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <div className="font-serif text-base">{l.produto}</div>
                <div>
                  <div className="mono flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>Produção</span>
                    <span>{l.producao} / {l.capacidade} un</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--navy)" }} />
                  </div>
                </div>
                <div className="mono text-right text-xs">
                  <div className="text-muted-foreground">Defeito</div>
                  <div className="text-gold">{l.defeito}%</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Metrica({ icone, rotulo, valor, destaque }: { icone: React.ReactNode; rotulo: string; valor: string | number; destaque?: boolean }) {
  return (
    <div className={`rounded-sm border p-4 ${destaque ? "bg-navy text-paper" : "bg-card"}`}>
      <div className={`mono text-[10px] uppercase tracking-widest ${destaque ? "text-gold" : "text-muted-foreground"}`}>{rotulo}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={destaque ? "text-gold" : "text-muted-foreground"}>{icone}</span>
        <span className="font-serif text-2xl">{valor}</span>
      </div>
    </div>
  );
}
