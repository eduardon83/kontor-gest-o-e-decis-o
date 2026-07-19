// Capacidade de produção — motor partilhado (UI + resolver).
// Se editares este ficheiro, sincroniza com supabase/functions/_shared/capacidade.ts.

export type Produto = "cadeira" | "mesa" | "armario";
export type Tier = "standard" | "fine" | "artisan";
export type Ritmo = "ferias" | "folga" | "normal" | "horas_extra";

export const MAO_MULT: Record<Tier, number> = { standard: 1.0, fine: 1.58, artisan: 2.1 };
export const MAO_H: Record<Produto, number> = { cadeira: 0.6, mesa: 1.4, armario: 2.2 };
export const MACH_H: Record<Produto, number> = { cadeira: 1, mesa: 2.5, armario: 4 };
export const HORAS_BASE = 160;
export const HORAS_OVERTIME = 40;
export const HORAS_POR_MAQUINA = 450;

// Efeito do ritmo sobre a capacidade de mão-de-obra (multiplicativo sobre as horas).
// Férias ~0 (produção parada), Folga −30%, Normal base, Horas extra base (o overtime é somado à parte).
export const RITMO_MULT: Record<Ritmo, number> = {
  ferias: 0,
  folga: 0.7,
  normal: 1,
  horas_extra: 1,
};

export function overtimeDoRitmo(ritmo: Ritmo | string): number {
  return ritmo === "horas_extra" ? HORAS_OVERTIME : 0;
}

// Tier efetivo — cai para o mais alto desbloqueado quando o pedido não tem I&D.
export function tierEfetivo(pedido: Tier | string, desbloqueados: readonly string[]): {
  aplicado: Tier;
  reduzido: boolean;
  faltaNo: string | null;
} {
  const set = new Set(desbloqueados);
  if (pedido === "fine") {
    if (set.has("FINE")) return { aplicado: "fine", reduzido: false, faltaNo: null };
    return { aplicado: "standard", reduzido: true, faltaNo: "FINE" };
  }
  if (pedido === "artisan") {
    if (set.has("ARTISAN")) return { aplicado: "artisan", reduzido: false, faltaNo: null };
    const fallback: Tier = set.has("FINE") ? "fine" : "standard";
    return { aplicado: fallback, reduzido: true, faltaNo: "ARTISAN" };
  }
  return { aplicado: "standard", reduzido: false, faltaNo: null };
}

export type EntradaCapacidade = {
  trabalhadores: number;
  maquinas: number;
  prodMult: number;
  tier: Tier;
  ritmo: Ritmo | string;
  alvo: Partial<Record<Produto, number>>;
  subcontratacao: number;
  automacao: boolean;
};

export type SaidaCapacidade = {
  capLabour: number;
  capMachine: number;
  labNeed: number;
  machNeed: number;
  totalAlvo: number;
  rawLab: number;
  rawMach: number;
  scaleInt: number;
  subEff: number;
  scale: number;
  limitante: "mão-de-obra" | "máquinas" | "nenhum";
  producaoUn: number;
  capIntUn: number;
  subUn: number;
  maxTotalUn: number;
  folga: number;
  ritmoMult: number;
  overtime: number;
};

const PRODS: Produto[] = ["cadeira", "mesa", "armario"];

export function capacidadeCOO(e: EntradaCapacidade): SaidaCapacidade {
  const ritmoMult = RITMO_MULT[(e.ritmo as Ritmo)] ?? 1;
  const overtime = overtimeDoRitmo(e.ritmo);
  const horasPorTrab = (HORAS_BASE + overtime) * ritmoMult;
  const capLabour = e.trabalhadores * horasPorTrab * e.prodMult;
  const automMult = e.automacao ? 1.15 : 1;
  const capMachine = e.maquinas * HORAS_POR_MAQUINA * e.prodMult * automMult;

  const labNeed = PRODS.reduce((s, p) => s + Number(e.alvo[p] ?? 0) * MAO_H[p] * MAO_MULT[e.tier], 0);
  const machNeed = PRODS.reduce((s, p) => s + Number(e.alvo[p] ?? 0) * MACH_H[p], 0);
  const totalAlvo = PRODS.reduce((s, p) => s + Number(e.alvo[p] ?? 0), 0);

  const rawLab = labNeed > 0 ? capLabour / labNeed : Infinity;
  const rawMach = machNeed > 0 ? capMachine / machNeed : Infinity;
  const rawInt = Math.min(rawLab, rawMach);
  const scaleInt = Math.min(1, rawInt);
  const sub = Math.max(0, Math.min(1, e.subcontratacao ?? 0));
  const subEff = Math.min(0.5, sub);
  const scale = Math.min(1, scaleInt * (1 + subEff));

  const limitante: SaidaCapacidade["limitante"] =
    labNeed === 0 && machNeed === 0 ? "nenhum" : rawLab < rawMach ? "mão-de-obra" : "máquinas";

  const capIntUn = Math.floor(totalAlvo * scaleInt);
  const producaoUn = Math.floor(totalAlvo * scale);
  const subUn = Math.max(0, producaoUn - capIntUn);
  const maxTotalUn = Number.isFinite(rawInt) ? Math.floor(totalAlvo * rawInt * (1 + subEff)) : producaoUn;
  const folga = maxTotalUn > 0 && totalAlvo > 0 ? Math.max(0, 1 - totalAlvo / maxTotalUn) : 0;

  return {
    capLabour, capMachine, labNeed, machNeed, totalAlvo,
    rawLab, rawMach, scaleInt, subEff, scale,
    limitante, producaoUn, capIntUn, subUn, maxTotalUn, folga,
    ritmoMult, overtime,
  };
}
