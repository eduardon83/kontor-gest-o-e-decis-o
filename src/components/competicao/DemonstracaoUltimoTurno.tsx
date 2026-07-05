// Demonstração condensada. Professor vê tudo; jogador só vê valor total dos rivais
// (não valores internos como receita/custos).
const fmt = (v: number | undefined) =>
  v == null ? "—" : Math.round(v).toLocaleString("pt-PT") + " €";

export function DemonstracaoUltimoTurno({ equipas, snapshots, rondaId, visao }: {
  equipas: any[]; snapshots: any[]; rondaId: string; visao: "professor" | "jogador";
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-slate">
            <th className="py-2">Equipa</th>
            <th className="text-right">Receita</th>
            <th className="text-right">CMV</th>
            <th className="text-right">Fixos</th>
            <th className="text-right">Juros</th>
            <th className="text-right">Impostos</th>
            <th className="text-right">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {equipas.map((eq) => {
            const snap = snapshots.find((s) => s.equipa_id === eq.id && s.ronda_id === rondaId)?.snapshot;
            const podeVer = visao === "professor" || !!snap;
            if (!podeVer || !snap) {
              return (
                <tr key={eq.id} className="border-b border-border/50">
                  <td className="py-2">{eq.nome}{eq.is_ia && <span className="ml-1 rounded bg-navy/10 px-1 font-mono text-[9px] uppercase">IA</span>}</td>
                  <td colSpan={6} className="text-right text-xs text-muted-foreground">— internos ocultos —</td>
                </tr>
              );
            }
            return (
              <tr key={eq.id} className="border-b border-border/50">
                <td className="py-2">{eq.nome}{eq.is_ia && <span className="ml-1 rounded bg-navy/10 px-1 font-mono text-[9px] uppercase">IA</span>}</td>
                <td className="text-right font-mono">{fmt(snap.receita)}</td>
                <td className="text-right font-mono">{fmt(snap.prodCost)}</td>
                <td className="text-right font-mono">{fmt(snap.fixed)}</td>
                <td className="text-right font-mono">{fmt(snap.interest)}</td>
                <td className="text-right font-mono">{fmt(snap.imposto)}</td>
                <td className={"text-right font-mono " + ((snap.resultado ?? 0) >= 0 ? "text-gold" : "text-destructive")}>
                  {fmt(snap.resultado)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
