// Cálculo dos custos COMPROMETIDOS no turno actual, a partir dos payloads
// efectivos (decisão submetida + rascunho em edição) de cada lugar.
//
// Constantes têm de bater certo com o resolver (supabase/functions/resolver_ronda):
//   custo_hora = 20,74 €/h · 160 h/mês
//   supervisor ×1,4 · investigador ×1,6
//   força de vendas = 2.500 €/vendedor · máquina = 60.000 € · licença I&D = 45.000 €
//   indemnização = 2 × (salario_mult · 160 · 20,74)
import type { Lugar } from "@/lib/jogo/tipos";
import { LUGARES } from "@/lib/jogo/tipos";
import type { Colaborador, DecisaoRegisto, PesquisaRegisto, Snapshot } from "@/components/jogo/JogoContext";
import type { AcaoPessoa } from "@/lib/jogo/schema-decisoes";

export const CUSTO_HORA = 20.74;
export const HORAS_MES = 160;
export const MULT_SUP = 1.4;
export const MULT_INV = 1.6;
export const CUSTO_VENDEDOR = 2500;
export const CUSTO_MAQUINA = 60000;
export const CUSTO_LICENCA_ID = 45000;
export const SAL_MENSAL_BASE = CUSTO_HORA * HORAS_MES; // ≈ 3318 €/mês

export type LinhaCusto = { rotulo: string; valor: number; nota?: string };
export type GrupoCusto = { titulo: string; linhas: LinhaCusto[]; subtotal: number };

export type CustosComprometidos = {
  grupos: GrupoCusto[];
  total: number;
};

function num(x: unknown, d = 0): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

function payloadEfectivo(
  lugar: Lugar,
  decisoes: Partial<Record<Lugar, DecisaoRegisto>>,
  rascunho: Partial<Record<Lugar, Record<string, unknown>>>,
): Record<string, unknown> {
  const guardado = (decisoes[lugar]?.payload ?? {}) as Record<string, unknown>;
  const local = (rascunho[lugar] ?? {}) as Record<string, unknown>;
  return { ...guardado, ...local };
}

function pesquisasDoTurno(
  pesquisas: Partial<Record<Lugar, PesquisaRegisto[]>>,
  ronda_id: string | null,
  ronda_indice: number,
  modo: "real" | "demo",
): number {
  let s = 0;
  for (const l of LUGARES) {
    for (const p of pesquisas[l] ?? []) {
      const doTurno =
        modo === "real" ? (!!ronda_id && p.ronda_id === ronda_id) : p.ronda_indice === ronda_indice;
      if (doTurno) s += num(p.custo);
    }
  }
  return s;
}

export function calcularCustosComprometidos(args: {
  modo: "real" | "demo";
  ronda_id: string | null;
  ronda_indice: number;
  snapshot: Snapshot | null;
  colaboradores: readonly Colaborador[];
  decisoes: Partial<Record<Lugar, DecisaoRegisto>>;
  rascunho: Partial<Record<Lugar, Record<string, unknown>>>;
  pesquisas: Partial<Record<Lugar, PesquisaRegisto[]>>;
}): CustosComprometidos {
  const { snapshot, colaboradores, decisoes, rascunho, pesquisas, ronda_id, ronda_indice, modo } = args;

  const CEO = payloadEfectivo("CEO", decisoes, rascunho);
  const CFO = payloadEfectivo("CFO", decisoes, rascunho);
  const COO = payloadEfectivo("COO", decisoes, rascunho);
  const CMO = payloadEfectivo("CMO", decisoes, rascunho);
  const CHRO = payloadEfectivo("CHRO", decisoes, rascunho);

  const salarioRatio = num(CHRO.salario, 1);
  const trab = num((snapshot as any)?.trabalhadores);
  const sup = num((snapshot as any)?.supervisores);
  const inv = num((snapshot as any)?.investigadores);

  const wageTrab = trab * HORAS_MES * CUSTO_HORA * salarioRatio;
  const wageSup = sup * HORAS_MES * CUSTO_HORA * MULT_SUP * salarioRatio;
  const wageInv = inv * HORAS_MES * CUSTO_HORA * MULT_INV * salarioRatio;
  const salarios: GrupoCusto = {
    titulo: "Salários (CHRO)",
    linhas: [
      { rotulo: `${trab} trabalhador(es)`, valor: wageTrab, nota: `${HORAS_MES}h · ${salarioRatio.toFixed(2)}×` },
      { rotulo: `${sup} supervisor(es)`, valor: wageSup, nota: `×${MULT_SUP.toFixed(1)}` },
      { rotulo: `${inv} investigador(es)`, valor: wageInv, nota: `×${MULT_INV.toFixed(1)}` },
    ],
    subtotal: wageTrab + wageSup + wageInv,
  };

  const marketing = Math.max(0, num(CMO.marketing));
  const forcaN = Math.max(0, Math.floor(num(CMO.forca_vendas)));
  const pesquisaMkt = Math.max(0, num(CMO.pesquisa_mercado));
  const cmoGroup: GrupoCusto = {
    titulo: "Marketing e vendas (CMO)",
    linhas: [
      { rotulo: "Marketing", valor: marketing },
      { rotulo: `Força de vendas · ${forcaN} un`, valor: forcaN * CUSTO_VENDEDOR, nota: `${CUSTO_VENDEDOR} €/un` },
      { rotulo: "Pesquisa de mercado", valor: pesquisaMkt },
    ],
    subtotal: marketing + forcaN * CUSTO_VENDEDOR + pesquisaMkt,
  };

  const formacao = Math.max(0, num(CHRO.formacao));
  const bonus = Math.max(0, num(CHRO.bonus));
  const chroGroup: GrupoCusto = {
    titulo: "Pessoas (CHRO)",
    linhas: [
      { rotulo: "Formação", valor: formacao },
      { rotulo: "Bónus", valor: bonus },
    ],
    subtotal: formacao + bonus,
  };

  const idModo = String(COO.id_modo ?? "interno");
  const idOrc = idModo === "licenca" ? CUSTO_LICENCA_ID : Math.max(0, num(CFO.id_orcamento));
  const idSalInv = inv * HORAS_MES * CUSTO_HORA;
  const idGroup: GrupoCusto = {
    titulo: "I&D",
    linhas: [
      { rotulo: idModo === "licenca" ? "Licença de tecnologia" : "Orçamento I&D (CFO)", valor: idOrc },
      { rotulo: "Salário dos investigadores", valor: idSalInv, nota: "já contado nos salários" },
    ],
    subtotal: idOrc + idSalInv,
  };

  const maquinas = Math.max(0, Math.floor(num(COO.comprar_maquinas)));
  const capexGroup: GrupoCusto = {
    titulo: "Investimento (COO/CFO)",
    linhas: [
      { rotulo: `Comprar máquinas · ${maquinas}`, valor: maquinas * CUSTO_MAQUINA, nota: `${CUSTO_MAQUINA.toLocaleString("pt-PT")} €/un` },
    ],
    subtotal: maquinas * CUSTO_MAQUINA,
  };

  const acoes = (Array.isArray(CHRO.acoes_pessoas) ? CHRO.acoes_pessoas : []) as AcaoPessoa[];
  const despedimentos = acoes.filter((a) => a.tipo === "despedir");
  let indemn = 0;
  const linhasIndemn: LinhaCusto[] = [];
  for (const d of despedimentos) {
    const c = colaboradores.find((x) => x.id === d.colaborador_id);
    if (!c) continue;
    const v = Math.round(SAL_MENSAL_BASE * num(c.salario_mult, 1) * 2);
    indemn += v;
    linhasIndemn.push({ rotulo: `Indemnizar ${c.nome || "colaborador"}`, valor: v, nota: "2× salário mensal" });
  }
  const indemnGroup: GrupoCusto | null =
    linhasIndemn.length > 0
      ? { titulo: "Indemnizações", linhas: linhasIndemn, subtotal: indemn }
      : null;

  const pesq = pesquisasDoTurno(pesquisas, ronda_id, ronda_indice, modo);
  const infoGroup: GrupoCusto | null =
    pesq > 0
      ? { titulo: "Pesquisas de informação", linhas: [{ rotulo: "Ações já usadas neste turno", valor: pesq }], subtotal: pesq }
      : null;

  const amort = Math.max(0, num(CFO.amortizar));
  const divid = Math.max(0, num(CEO.dividendos));
  const finGroup: GrupoCusto | null =
    amort + divid > 0
      ? {
          titulo: "Financeiro",
          linhas: [
            ...(amort > 0 ? [{ rotulo: "Amortização (CFO)", valor: amort }] : []),
            ...(divid > 0 ? [{ rotulo: "Dividendos (CEO)", valor: divid }] : []),
          ],
          subtotal: amort + divid,
        }
      : null;

  // Total: salários dos investigadores só entram uma vez (via 'Salários'), não somamos idSalInv.
  const total =
    salarios.subtotal +
    cmoGroup.subtotal +
    chroGroup.subtotal +
    idOrc + // apenas o custo directo de I&D (licença ou orçamento)
    capexGroup.subtotal +
    (indemnGroup?.subtotal ?? 0) +
    (infoGroup?.subtotal ?? 0) +
    (finGroup?.subtotal ?? 0);

  const grupos: GrupoCusto[] = [salarios, cmoGroup, chroGroup, idGroup, capexGroup];
  if (indemnGroup) grupos.push(indemnGroup);
  if (infoGroup) grupos.push(infoGroup);
  if (finGroup) grupos.push(finGroup);

  return { grupos, total };
}

const fmtEur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
export function formatarEur(v: number): string {
  return fmtEur.format(Math.round(v));
}
