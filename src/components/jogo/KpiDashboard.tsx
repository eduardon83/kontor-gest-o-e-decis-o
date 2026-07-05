import { useState } from "react";
import { Sparkline } from "./Sparkline";
import type { Kpi } from "@/lib/jogo/dados-exemplo";
import { HISTORICO_TURNOS } from "@/lib/jogo/dados-exemplo";
import { LUGARES, type Lugar } from "@/lib/jogo/tipos";
import { KPIS } from "@/lib/jogo/dados-exemplo";
import { ChevronDown, ChevronUp } from "lucide-react";

function fmt(v: number, u: string) {
  if (u === "€") return `${(v / 1000).toFixed(1)}k €`;
  if (u === "%") return `${v.toFixed(1)}%`;
  if (u === "/100") return `${Math.round(v)}/100`;
  if (u === "h") return `${v}h`;
  return `${v}${u ? " " + u : ""}`;
}

function CartaoKpi({ k }: { k: Kpi }) {
  const positivo = k.delta >= 0;
  return (
    <div className="rounded-sm border bg-card p-4">
      <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{k.rotulo}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="font-serif text-2xl text-foreground">{fmt(k.atual, k.unidade)}</div>
        <div className={`mono text-xs ${positivo ? "text-gold" : "text-destructive"}`}>
          {positivo ? "+" : ""}{k.delta}%
        </div>
      </div>
      <div className="mt-3">
        <Sparkline pontos={k.serie.map((s) => s.valor)} />
      </div>
    </div>
  );
}

export function KpiDashboard({ lugar, comSeparadores }: { lugar: Lugar | "Global"; comSeparadores?: boolean }) {
  const [aba, setAba] = useState<Lugar | "Global">(lugar);
  const [historico, setHistorico] = useState(false);

  const lista = comSeparadores ? KPIS[aba] : KPIS[lugar];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg">Dashboard</h3>
        <button
          onClick={() => setHistorico((h) => !h)}
          className="mono inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-widest hover:bg-muted"
        >
          {historico ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Ver histórico
        </button>
      </div>

      {comSeparadores && (
        <div className="flex gap-1 overflow-x-auto border-b">
          {(["Global", ...LUGARES] as const).map((l) => (
            <button
              key={l}
              onClick={() => setAba(l)}
              className={`mono border-b-2 px-3 py-1.5 text-[10px] uppercase tracking-widest ${
                aba === l ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((k) => <CartaoKpi key={k.chave} k={k} />)}
      </div>

      {historico && (
        <div className="rounded-sm border bg-card">
          <div className="border-b px-4 py-2">
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Histórico por turno</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="mono border-b text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-2 text-left">Turno</th>
                <th className="px-4 py-2 text-right">Receita</th>
                <th className="px-4 py-2 text-right">Custos</th>
                <th className="px-4 py-2 text-right">EBITDA</th>
                <th className="px-4 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {HISTORICO_TURNOS.map((t) => (
                <tr key={t.turno} className="border-b last:border-0">
                  <td className="mono px-4 py-2">T{t.turno}</td>
                  <td className="mono px-4 py-2 text-right">{(t.receita / 1000).toFixed(1)}k</td>
                  <td className="mono px-4 py-2 text-right">{(t.custos / 1000).toFixed(1)}k</td>
                  <td className="mono px-4 py-2 text-right text-gold">{(t.ebitda / 1000).toFixed(1)}k</td>
                  <td className="mono px-4 py-2 text-right">{(t.valor / 1000).toFixed(0)}k</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
