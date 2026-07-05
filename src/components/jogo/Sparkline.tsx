export function Sparkline({
  pontos,
  w = 120,
  h = 32,
}: {
  pontos: number[];
  w?: number;
  h?: number;
}) {
  if (pontos.length < 2) return null;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const rng = max - min || 1;
  const step = w / (pontos.length - 1);
  const d = pontos
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / rng) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((pontos[pontos.length - 1] - min) / rng) * h} r="2" fill="var(--gold)" />
    </svg>
  );
}
