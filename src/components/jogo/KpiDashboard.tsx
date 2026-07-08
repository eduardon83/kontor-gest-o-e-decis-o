import { useState } from "react";
import { Sparkline } from "./Sparkline";
import { useJogo } from "./JogoContext";
import type { Kpi } from "@/lib/jogo/dados-exemplo";
import { HISTORICO_TURNOS, KPIS } from "@/lib/jogo/dados-exemplo";
import { LUGARES, type Lugar } from "@/lib/jogo/tipos";
import { ChevronDown, ChevronUp, ChevronRight, Download } from "lucide-react";
import { PnLBalanco, relatorioParaCSV, descarregarCSV } from "./RelatorioFinanceiro";

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
          {positivo ? "+" : ""}{k.delta.toFixed(1)}%
        </div>
      </div>
      <div className="mt-3">
        <Sparkline pontos={k.serie.map((s) => s.valor)} />
      </div>
    </div>
  );
}

function serieKpi(snapshots: { snapshot: any; ronda_indice: number }[], chave: string): { turno: number; valor: number }[] {
  return snapshots.map((s) => ({ turno: s.ronda_indice, valor: Number(s.snapshot?.[chave] ?? 0) }));
}

function kpisReais(lugar: Lugar | "Global", snapshots: any[]): Kpi[] {
  function mk(chave: string, rotulo: string, unidade: string): Kpi {
    const serie = serieKpi(snapshots, chave);
    const atual = serie.length ? serie[serie.length - 1].valor : 0;
    const anterior = serie.length > 1 ? serie[serie.length - 2].valor : atual;
    const delta = anterior === 0 ? 0 : ((atual - anterior) / Math.abs(anterior)) * 100;
    return { chave, rotulo, unidade, atual, delta, serie };
  }
  const global = [mk("valor", "Valor da empresa", "€"), mk("quota", "Quota de mercado", "%"), mk("ebitda", "EBITDA", "€"), mk("moral", "Moral média", "/100")];
  const porLugar: Record<Lugar, Kpi[]> = {
    CEO: [mk("valor", "Valor da empresa", "€"), mk("caixa", "Caixa", "€"), mk("divida", "Dívida", "€")],
    CFO: [mk("caixa", "Caixa", "€"), mk("divida", "Dívida", "€"), mk("resultado", "Resultado", "€")],
    COO: [mk("producao_total", "Produção", ""), mk("utilizacao", "Utilização", "%"), mk("defeito", "Defeito", "%")],
    CMO: [mk("quota", "Quota", "%"), mk("marca", "Marca", "/100"), mk("procura", "Procura", "")],
    CHRO: [mk("moral", "Moral", "/100"), mk("stress", "Stress", "/100"), mk("rotatividade", "Rotatividade", "%")],
  };
  return lugar === "Global" ? global : porLugar[lugar];
}

export function KpiDashboard({ lugar, comSeparadores }: { lugar: Lugar | "Global"; comSeparadores?: boolean }) {
  const { modo, snapshots } = useJogo();
  const [aba, setAba] = useState<Lugar | "Global">(lugar);
  const [historico, setHistorico] = useState(false);

  const alvo = comSeparadores ? aba : lugar;
  const lista =
    modo === "real"
      ? kpisReais(alvo, snapshots)
      : KPIS[alvo];

  const historicoLinhas =
    modo === "real"
      ? snapshots.map((s: any) => ({
          turno: s.ronda_indice,
          receita: Number(s.snapshot?.receita ?? 0),
          custos: Number(s.snapshot?.custos ?? 0),
          ebitda: Number(s.snapshot?.ebitda ?? 0),
          valor: Number(s.snapshot?.valor ?? 0),
        }))
      : HISTORICO_TURNOS;

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

      {modo === "real" && snapshots.length === 0 ? (
        <div className="rounded-sm border bg-card p-6 text-sm text-muted-foreground">
          Ainda sem turnos resolvidos — os KPIs aparecem depois da primeira resolução.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((k) => <CartaoKpi key={k.chave} k={k} />)}
        </div>
      )}

      {historico && (
        <div className="rounded-sm border bg-card">
          <div className="border-b px-4 py-2">
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Histórico por turno</div>
          </div>
          {historicoLinhas.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Sem histórico ainda.</div>
          ) : (
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
                {historicoLinhas.map((t) => (
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
          )}
        </div>
      )}
    </section>
  );
}
