import type { Lugar } from "@/lib/jogo/tipos";

/**
 * Fundo temático por lugar: traço dourado sobre navy, ilustração vetorial simples.
 */
export function FundoGabinete({ lugar }: { lugar: Lugar }) {
  return (
    <div
      className="relative overflow-hidden rounded-sm border"
      style={{
        background: "linear-gradient(180deg, var(--navy), var(--deep))",
        borderColor: "color-mix(in oklab, var(--gold) 45%, transparent)",
        minHeight: 180,
      }}
    >
      <svg viewBox="0 0 800 200" width="100%" height="180" className="block" aria-hidden>
        <g stroke="#C9A24B" strokeWidth="1.2" fill="none" opacity="0.9">
          {lugar === "CEO" && <IlustCEO />}
          {lugar === "CFO" && <IlustCFO />}
          {lugar === "COO" && <IlustCOO />}
          {lugar === "CMO" && <IlustCMO />}
          {lugar === "CHRO" && <IlustCHRO />}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 100%, transparent 40%, var(--deep) 90%)"
      }} />
      <div className="absolute bottom-3 left-4">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-gold">Gabinete</div>
        <div className="font-serif text-2xl text-paper">{ROTULO[lugar]}</div>
      </div>
    </div>
  );
}

const ROTULO: Record<Lugar, string> = {
  CEO: "Sala do Conselho",
  CFO: "Cofre & Contas",
  COO: "Vista sobre o chão de fábrica",
  CMO: "Loja e mercado",
  CHRO: "As pessoas",
};

// Ilustrações — traço dourado, esboço rápido mas legível
function IlustCEO() {
  return (
    <>
      {/* Mesa comprida */}
      <ellipse cx="400" cy="150" rx="260" ry="18" />
      {/* Cadeiras (silhuetas) */}
      {[220, 320, 420, 520, 620].map((x) => (
        <g key={x}>
          <rect x={x - 14} y="105" width="28" height="30" rx="4" />
          <line x1={x - 10} y1="135" x2={x - 10} y2="150" />
          <line x1={x + 10} y1="135" x2={x + 10} y2="150" />
        </g>
      ))}
      {/* Candeeiro / painel */}
      <line x1="100" y1="30" x2="700" y2="30" />
      <line x1="400" y1="30" x2="400" y2="60" />
      <circle cx="400" cy="70" r="14" />
    </>
  );
}
function IlustCFO() {
  return (
    <>
      {/* Cofre */}
      <rect x="290" y="60" width="220" height="120" rx="4" />
      <circle cx="400" cy="120" r="30" />
      <circle cx="400" cy="120" r="10" />
      <line x1="400" y1="90" x2="400" y2="80" />
      <line x1="400" y1="150" x2="400" y2="160" />
      <line x1="370" y1="120" x2="360" y2="120" />
      <line x1="430" y1="120" x2="440" y2="120" />
      {/* Pilhas de moedas */}
      {[150, 180, 210].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="170" rx="18" ry="4" />
          <ellipse cx={x} cy="160" rx="18" ry="4" />
          <ellipse cx={x} cy="150" rx="18" ry="4" />
        </g>
      ))}
      {/* Livro-razão */}
      <rect x="580" y="140" width="120" height="40" />
      <line x1="600" y1="150" x2="680" y2="150" />
      <line x1="600" y1="160" x2="680" y2="160" />
      <line x1="600" y1="170" x2="680" y2="170" />
    </>
  );
}
function IlustCOO() {
  return (
    <>
      {/* Nave industrial */}
      <path d="M 60 180 L 60 100 L 200 60 L 340 100 L 340 180" />
      <path d="M 340 180 L 340 100 L 480 60 L 620 100 L 620 180" />
      {/* Maquinaria */}
      <rect x="100" y="130" width="60" height="50" />
      <circle cx="140" cy="120" r="8" />
      <rect x="230" y="140" width="70" height="40" />
      <rect x="400" y="130" width="80" height="50" />
      <rect x="540" y="140" width="50" height="40" />
      {/* Tapete rolante */}
      <line x1="60" y1="180" x2="740" y2="180" />
      <line x1="80" y1="185" x2="80" y2="180" />
      <line x1="720" y1="185" x2="720" y2="180" />
    </>
  );
}
function IlustCMO() {
  return (
    <>
      {/* Fachada de loja */}
      <path d="M 200 180 L 200 80 L 400 40 L 600 80 L 600 180 Z" />
      <rect x="360" y="110" width="80" height="70" />
      <line x1="400" y1="110" x2="400" y2="180" />
      {/* Toldo */}
      <path d="M 220 90 L 580 90 L 560 110 L 240 110 Z" />
      {/* Placa */}
      <rect x="320" y="60" width="160" height="24" />
      {/* Passeio */}
      <line x1="60" y1="182" x2="740" y2="182" />
      {/* Passeantes */}
      {[100, 130, 660, 700].map((x) => (
        <g key={x}>
          <circle cx={x} cy="160" r="5" />
          <line x1={x} y1="165" x2={x} y2="180" />
        </g>
      ))}
    </>
  );
}
function IlustCHRO() {
  return (
    <>
      {/* Grupo de pessoas */}
      {[
        [180, 130], [260, 140], [340, 125], [420, 145],
        [500, 130], [580, 140], [660, 125],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y - 20} r="12" />
          <path d={`M ${x - 22} 180 Q ${x} ${y} ${x + 22} 180`} />
        </g>
      ))}
      <line x1="60" y1="180" x2="740" y2="180" />
    </>
  );
}
