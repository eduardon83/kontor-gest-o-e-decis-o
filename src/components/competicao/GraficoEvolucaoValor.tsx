const CORES = ["#c9a24a", "#1e3a5f", "#7a8fa6", "#5a3b1e", "#3d5a3d", "#a04545", "#8b6d3f", "#4a5a7e"];

export function GraficoEvolucaoValor({ equipas, rondas, resultados }: {
  equipas: any[]; rondas: any[]; resultados: any[];
}) {
  const rondasResolvidas = [...rondas].filter((r) => r.estado === "resolvida").sort((a, b) => a.indice - b.indice);
  if (rondasResolvidas.length === 0) {
    return <p className="font-mono text-xs text-slate">Ainda sem turnos resolvidos.</p>;
  }
  const W = 640, H = 200, padL = 48, padR = 12, padT = 12, padB = 24;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const pontos: Record<string, { x: number; v: number }[]> = {};
  let maxV = 1;
  for (const eq of equipas) {
    const arr: { x: number; v: number }[] = [];
    rondasResolvidas.forEach((r, i) => {
      const res = resultados.find((rr: any) => rr.equipa_id === eq.id && rr.ronda_id === r.id);
      if (res) {
        arr.push({ x: i, v: res.valor });
        if (res.valor > maxV) maxV = res.valor;
      }
    });
    pontos[eq.id] = arr;
  }

  const xScale = (i: number) => padL + (rondasResolvidas.length === 1 ? iw / 2 : (i / (rondasResolvidas.length - 1)) * iw);
  const yScale = (v: number) => padT + ih - (v / maxV) * ih;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-full" style={{ minWidth: 400 }}>
        {/* eixos */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + ih} stroke="hsl(var(--border))" />
        <line x1={padL} y1={padT + ih} x2={W - padR} y2={padT + ih} stroke="hsl(var(--border))" />
        {/* labels turno */}
        {rondasResolvidas.map((r, i) => (
          <text key={r.id} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="10" fontFamily="monospace" fill="hsl(var(--muted-foreground))">
            T{r.indice}
          </text>
        ))}
        {/* label y (max) */}
        <text x={padL - 6} y={padT + 10} textAnchor="end" fontSize="10" fontFamily="monospace" fill="hsl(var(--muted-foreground))">
          {Math.round(maxV).toLocaleString("pt-PT")}€
        </text>
        <text x={padL - 6} y={padT + ih} textAnchor="end" fontSize="10" fontFamily="monospace" fill="hsl(var(--muted-foreground))">0</text>
        {/* linhas */}
        {equipas.map((eq, idx) => {
          const pts = pontos[eq.id];
          if (!pts || pts.length === 0) return null;
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x)},${yScale(p.v)}`).join(" ");
          const cor = CORES[idx % CORES.length];
          return (
            <g key={eq.id}>
              <path d={d} fill="none" stroke={cor} strokeWidth={2} />
              {pts.map((p) => (
                <circle key={p.x} cx={xScale(p.x)} cy={yScale(p.v)} r={3} fill={cor} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {equipas.map((eq, idx) => (
          <div key={eq.id} className="flex items-center gap-2 font-mono text-[11px]">
            <span className="inline-block h-2 w-4" style={{ background: CORES[idx % CORES.length] }} />
            {eq.nome}{eq.is_ia && " (IA)"}
          </div>
        ))}
      </div>
    </div>
  );
}
