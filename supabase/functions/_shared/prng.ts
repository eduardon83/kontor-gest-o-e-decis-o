// PRNG determinístico — mulberry32 com streams independentes por rótulo.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a 32 bits — hash de rótulo p/ derivar seed de stream.
function fnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function stream(baseSeed: number, label: string): () => number {
  return mulberry32((baseSeed ^ fnv1a(label)) >>> 0);
}

export const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));

export const randRange = (r: () => number, min: number, max: number) =>
  min + (max - min) * r();

export const randInt = (r: () => number, min: number, max: number) =>
  Math.floor(min + (max - min + 1) * r());

export const pick = <T>(r: () => number, arr: readonly T[]): T =>
  arr[Math.floor(r() * arr.length)];

// Ruído gaussiano (Box-Muller) — usado nas ações de informação.
export function gaussian(r: () => number, mu = 0, sigma = 1): number {
  const u1 = Math.max(1e-12, r());
  const u2 = r();
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
