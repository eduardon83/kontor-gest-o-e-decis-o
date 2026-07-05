import { RUAS } from "@/lib/jogo/dados-exemplo";
import { Livre } from "../Livre";
import { Anchor } from "lucide-react";

export function Ruas() {
  return (
    <div className="space-y-6">
      <section className="rounded-sm border bg-card p-6">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">A minha loja</div>
        <div className="mt-3 flex items-center gap-4">
          <Livre inicial={RUAS.minhaLoja.nome.charAt(0)} size={56} />
          <div>
            <div className="font-serif text-2xl">{RUAS.minhaLoja.nome}</div>
            <div className="mono text-xs text-muted-foreground">
              Valor <span className="text-foreground">{(RUAS.minhaLoja.valor / 1000).toFixed(0)}k €</span>{" · "}
              Quota <span className="text-foreground">{RUAS.minhaLoja.quota}%</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-lg">Lojas rivais</h3>
        <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Apenas o valor de cada rival está visível
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {RUAS.rivais.map((r) => (
            <li key={r.inicial} className="rounded-sm border bg-card p-4">
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
      </section>

      <section className="rounded-sm border bg-card p-6">
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-lg">Porto</h3>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Navios em rota</dt>
            <dd className="font-serif text-2xl">{RUAS.porto.navios}</dd>
          </div>
          <div>
            <dt className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Contentores em espera</dt>
            <dd className="font-serif text-2xl">{RUAS.porto.contentores_espera}</dd>
          </div>
          <div>
            <dt className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Custo de frete</dt>
            <dd className="mono text-2xl">{RUAS.porto.custo_frete} €</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
