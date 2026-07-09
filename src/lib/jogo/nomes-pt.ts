// Gerador determinístico de nomes portugueses (PT-PT).
// Usado no modo demo e como fallback no cliente.
const PROPRIOS_M = [
  "João", "Miguel", "Pedro", "Rui", "Tiago", "André", "Nuno", "Ricardo",
  "Bruno", "Diogo", "Hugo", "Luís", "Manuel", "António", "Carlos", "Filipe",
  "Gonçalo", "Henrique", "Vasco", "Duarte", "Afonso", "Rodrigo", "Fernando", "Jorge",
];
const PROPRIOS_F = [
  "Ana", "Beatriz", "Catarina", "Inês", "Joana", "Mariana", "Sofia", "Rita",
  "Teresa", "Marta", "Luísa", "Cláudia", "Patrícia", "Sara", "Filipa", "Helena",
  "Cristina", "Susana", "Raquel", "Diana", "Leonor", "Margarida", "Carolina", "Isabel",
];
const APELIDOS = [
  "Silva", "Santos", "Ferreira", "Pereira", "Costa", "Oliveira", "Rodrigues",
  "Martins", "Sousa", "Fernandes", "Gonçalves", "Gomes", "Lopes", "Marques",
  "Alves", "Almeida", "Ribeiro", "Pinto", "Carvalho", "Teixeira", "Moreira",
  "Correia", "Mendes", "Nunes", "Soares", "Vieira", "Monteiro", "Cardoso",
  "Rocha", "Neves", "Coelho", "Cunha", "Pires", "Ramos", "Reis", "Simões",
];

function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nome PT-PT: "Próprio Apelido" — determinístico face a `chave`. `sexo` deriva do avatar (1=m, 2=f). */
export function nomePt(chave: string, sexo: "m" | "f"): string {
  const r = mulberry(seedFrom(chave));
  const proprios = sexo === "f" ? PROPRIOS_F : PROPRIOS_M;
  const prop = proprios[Math.floor(r() * proprios.length)];
  const ap1 = APELIDOS[Math.floor(r() * APELIDOS.length)];
  // 55% duplo apelido; senão simples.
  if (r() < 0.55) {
    let ap2 = APELIDOS[Math.floor(r() * APELIDOS.length)];
    if (ap2 === ap1) ap2 = APELIDOS[(APELIDOS.indexOf(ap1) + 3) % APELIDOS.length];
    return `${prop} ${ap1} ${ap2}`;
  }
  return `${prop} ${ap1}`;
}

/** Deriva o sexo do avatar_variante (1 = masculino, 2 = feminino) — coerente com AvatarColaborador. */
export function sexoDaVariante(v: number | undefined | null): "m" | "f" {
  return v === 2 ? "f" : "m";
}
