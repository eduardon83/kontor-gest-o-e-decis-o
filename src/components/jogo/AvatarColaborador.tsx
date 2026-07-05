import type { Arquetipo } from "@/lib/jogo/tipos";

/**
 * 10 avatares = 5 arquétipos × 2 variantes.
 * Ilustração plana, retratos cabeça+ombros, paleta navy/gold/paper.
 * Tons de pele variados, ambos os sexos.
 */

type Tom = { pele: string; cabelo: string; casaco: string; camisa: string };

const TOM: Record<Arquetipo, [Tom, Tom]> = {
  Veterano: [
    { pele: "#E8C4A0", cabelo: "#C4B5A0", casaco: "#0E2740", camisa: "#F5F1E8" }, // homem grisalho
    { pele: "#B8895F", cabelo: "#5E4A3A", casaco: "#08182B", camisa: "#C9A24B" }, // mulher morena
  ],
  Talento: [
    { pele: "#F3D5B5", cabelo: "#3A2A1A", casaco: "#C9A24B", camisa: "#0E2740" }, // homem jovem
    { pele: "#6B4423", cabelo: "#1A1208", casaco: "#0E2740", camisa: "#F5F1E8" }, // mulher pele escura
  ],
  Esteio: [
    { pele: "#D4A574", cabelo: "#2A1F14", casaco: "#0E2740", camisa: "#F5F1E8" }, // homem médio
    { pele: "#8B6239", cabelo: "#4A3520", casaco: "#08182B", camisa: "#C9A24B" }, // mulher média
  ],
  Inquieto: [
    { pele: "#EBC9A0", cabelo: "#8B4513", casaco: "#5E6E7E", camisa: "#F5F1E8" }, // homem ruivo
    { pele: "#A67550", cabelo: "#2A1F14", casaco: "#5E6E7E", camisa: "#F5F1E8" }, // mulher morena
  ],
  Aprendiz: [
    { pele: "#F5DCC4", cabelo: "#D4A017", casaco: "#C9A24B", camisa: "#F5F1E8" }, // homem loiro
    { pele: "#7A5230", cabelo: "#1A0F08", casaco: "#0E2740", camisa: "#C9A24B" }, // mulher pele escura
  ],
};

export function AvatarColaborador({
  arquetipo,
  variante,
  size = 56,
  className,
}: {
  arquetipo: Arquetipo;
  variante: 1 | 2;
  size?: number;
  className?: string;
}) {
  const t = TOM[arquetipo][variante - 1];
  const genero: "m" | "f" = variante === 1 ? "m" : "f";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={`Avatar ${arquetipo} variante ${variante}`}
    >
      {/* Fundo circular em paper com aro dourado */}
      <circle cx="32" cy="32" r="31" fill="#F5F1E8" stroke="#C9A24B" strokeWidth="1.5" />
      <clipPath id={`clip-${arquetipo}-${variante}`}>
        <circle cx="32" cy="32" r="30" />
      </clipPath>

      <g clipPath={`url(#clip-${arquetipo}-${variante})`}>
        {/* Ombros / casaco */}
        <path d="M6 64 C 10 48, 22 44, 32 44 C 42 44, 54 48, 58 64 Z" fill={t.casaco} />

        {/* Colarinho / camisa */}
        <path d="M24 46 L 32 54 L 40 46 L 38 60 L 26 60 Z" fill={t.camisa} />

        {/* Pescoço */}
        <path d="M27 40 L 27 47 Q 32 51 37 47 L 37 40 Z" fill={t.pele} />

        {/* Cabeça */}
        <ellipse cx="32" cy="28" rx="12" ry="14" fill={t.pele} />

        {/* Cabelo — varia por arquétipo/variante/género */}
        <CabeloPor arquetipo={arquetipo} variante={variante} genero={genero} cor={t.cabelo} />

        {/* Olhos */}
        <circle cx="27.5" cy="28" r="1.1" fill="#08182B" />
        <circle cx="36.5" cy="28" r="1.1" fill="#08182B" />

        {/* Boca */}
        <path d={boca(arquetipo)} stroke="#08182B" strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* Detalhe dourado — pin/lapela */}
        <circle cx="24" cy="52" r="1.4" fill="#C9A24B" />
      </g>
    </svg>
  );
}

function boca(a: Arquetipo): string {
  switch (a) {
    case "Veterano": return "M 28.5 34 Q 32 35.5 35.5 34";
    case "Talento":  return "M 28 33.5 Q 32 36 36 33.5";
    case "Esteio":   return "M 29 34 L 35 34";
    case "Inquieto": return "M 29 35 Q 32 33.5 35 35";
    case "Aprendiz": return "M 28.5 33.5 Q 32 36 35.5 33.5";
  }
}

function CabeloPor({
  arquetipo,
  variante,
  genero,
  cor,
}: {
  arquetipo: Arquetipo;
  variante: 1 | 2;
  genero: "m" | "f";
  cor: string;
}) {
  // Cabelos distintos por combinação
  if (arquetipo === "Veterano" && genero === "m") {
    // Careca com laterais
    return (
      <>
        <path d="M 21 26 Q 22 22 26 20 L 27 25 Z" fill={cor} />
        <path d="M 43 26 Q 42 22 38 20 L 37 25 Z" fill={cor} />
      </>
    );
  }
  if (arquetipo === "Veterano" && genero === "f") {
    // Cabelo curto puxado
    return <path d="M 20 26 Q 20 14 32 14 Q 44 14 44 26 L 42 24 Q 40 20 32 20 Q 24 20 22 24 Z" fill={cor} />;
  }
  if (arquetipo === "Talento" && genero === "m") {
    // Franja lateral moderna
    return <path d="M 20 26 Q 20 14 32 14 Q 44 14 44 24 L 40 22 Q 34 22 30 18 Q 24 20 22 26 Z" fill={cor} />;
  }
  if (arquetipo === "Talento" && genero === "f") {
    // Cabelo comprido
    return (
      <>
        <path d="M 20 26 Q 18 12 32 12 Q 46 12 44 26 L 46 44 L 42 42 L 42 26 Q 40 20 32 20 Q 24 20 22 26 L 22 42 L 18 44 Z" fill={cor} />
      </>
    );
  }
  if (arquetipo === "Esteio" && genero === "m") {
    // Cabelo curto liso
    return <path d="M 21 26 Q 21 16 32 16 Q 43 16 43 26 L 41 22 Q 36 20 32 20 Q 28 20 23 22 Z" fill={cor} />;
  }
  if (arquetipo === "Esteio" && genero === "f") {
    // Bob curto
    return <path d="M 19 32 Q 19 14 32 14 Q 45 14 45 32 L 43 30 L 43 24 Q 38 20 32 20 Q 26 20 21 24 L 21 30 Z" fill={cor} />;
  }
  if (arquetipo === "Inquieto" && genero === "m") {
    // Cabelo despenteado
    return (
      <>
        <path d="M 20 26 Q 20 14 32 14 Q 44 14 44 26 L 40 24 L 38 20 L 34 22 L 30 18 L 26 22 L 24 20 Z" fill={cor} />
      </>
    );
  }
  if (arquetipo === "Inquieto" && genero === "f") {
    // Cabelo apanhado com repas
    return (
      <>
        <path d="M 20 26 Q 20 14 32 14 Q 44 14 44 26 L 42 24 Q 40 20 32 20 Q 24 20 22 24 Z" fill={cor} />
        <path d="M 20 26 L 18 30 L 22 28 Z" fill={cor} />
        <path d="M 44 26 L 46 30 L 42 28 Z" fill={cor} />
      </>
    );
  }
  if (arquetipo === "Aprendiz" && genero === "m") {
    // Cabelo curto com risco ao lado
    return <path d="M 21 26 Q 21 15 32 15 Q 43 15 43 26 L 40 22 Q 36 24 30 20 Q 24 22 23 26 Z" fill={cor} />;
  }
  // Aprendiz feminino — rabo de cavalo
  return (
    <>
      <path d="M 20 26 Q 20 14 32 14 Q 44 14 44 26 L 42 24 Q 40 20 32 20 Q 24 20 22 24 Z" fill={cor} />
      <path d="M 44 22 Q 50 28 46 40 L 42 38 Q 44 30 42 26 Z" fill={cor} />
    </>
  );
}
