export function TabelaMercado({ equipas, rondas, resultados }: {
  equipas: any[]; rondas: any[]; resultados: any[];
}) {
  const ultimaRonda = [...rondas].filter((r) => r.estado === "resolvida").pop();
  const ultimaId = ultimaRonda?.id;

  const linhas = equipas.map((eq) => {
    const resEq = resultados.filter((r) => r.equipa_id === eq.id);
    const ultimo = resEq.find((r) => r.ronda_id === ultimaId);
    const anterior = ultimaRonda
      ? resEq.find((r) => r.ronda_id === rondas.find((rr) => rr.indice === ultimaRonda.indice - 1)?.id)
      : undefined;
    const valor = ultimo?.valor ?? 0;
    const delta = ultimo && anterior ? valor - anterior.valor : null;
    return { eq, valor, delta };
  });
  linhas.sort((a, b) => b.valor - a.valor);
  const total = linhas.reduce((s, l) => s + Math.max(0, l.valor), 0) || 1;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-slate">
            <th className="py-2">#</th>
            <th>Equipa</th>
            <th className="text-right">Valor</th>
            <th className="text-right">Δ turno</th>
            <th className="text-right">Quota</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.eq.id} className="border-b border-border/50">
              <td className="py-2 font-mono text-xs">{i + 1}</td>
              <td>
                {l.eq.nome}
                {l.eq.is_ia && <span className="ml-1 rounded bg-navy/10 px-1 font-mono text-[9px] uppercase">IA</span>}
              </td>
              <td className="text-right font-mono">{Math.round(l.valor).toLocaleString("pt-PT")} €</td>
              <td className={"text-right font-mono " + (l.delta == null ? "text-muted-foreground" : l.delta >= 0 ? "text-gold" : "text-destructive")}>
                {l.delta == null ? "—" : (l.delta >= 0 ? "+" : "") + Math.round(l.delta).toLocaleString("pt-PT")}
              </td>
              <td className="text-right font-mono">
                {((Math.max(0, l.valor) / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
          {linhas.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Sem resultados ainda.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
