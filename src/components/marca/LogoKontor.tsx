type Cor = "gold" | "navy" | "paper";

const CORES: Record<Cor, string> = {
  gold: "#C9A24B",
  navy: "#0E2740",
  paper: "#F5F1E8",
};

export function LogoKontor({
  size = 40,
  cor = "gold",
  className,
}: {
  size?: number;
  cor?: Cor;
  className?: string;
}) {
  const stroke = CORES[cor];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="42" stroke={stroke} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="35" stroke={stroke} strokeWidth="1" opacity="0.55" />
      <path d="M38 32 V68" stroke={stroke} strokeWidth="5" strokeLinecap="square" />
      <path
        d="M62 32 L42 50 L62 68"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function LockupKontor({
  size = 40,
  cor = "gold",
  corTexto = "paper",
  tagline = false,
}: {
  size?: number;
  cor?: Cor;
  corTexto?: Cor;
  tagline?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoKontor size={size} cor={cor} />
      <span className="leading-tight">
        <span
          className="block font-serif"
          style={{ color: CORES[corTexto], fontWeight: 800, fontSize: size * 0.55 }}
        >
          Kontor
        </span>
        {tagline && (
          <span
            className="mono block uppercase"
            style={{
              color: CORES.gold,
              fontSize: 8.5,
              letterSpacing: "0.28em",
              marginTop: 2,
            }}
          >
            Simulador de gestão
          </span>
        )}
      </span>
    </span>
  );
}
