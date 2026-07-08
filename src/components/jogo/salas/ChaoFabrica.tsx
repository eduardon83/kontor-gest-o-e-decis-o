import { Cog, HardHat, ShieldCheck, ClipboardList } from "lucide-react";
import { useJogo } from "../JogoContext";

const MAO_MULT: Record<string, number> = { standard: 1.0, fine: 1.58, artisan: 2.1 };
const MAO: Record<string, number> = { cadeira: 0.6, mesa: 1.4, armario: 2.2 };
const MACH_H: Record<string, number> = { cadeira: 1, mesa: 2.5, armario: 4 };
const PRODS = ["cadeira", "mesa", "armario"] as const;
const NOMES: Record<string, string> = { cadeira: "Cadeira", mesa: "Mesa", armario: "Armário" };

export function ChaoFabrica() {
  const { snapshotAtual, rascunho, decisoes, ronda_indice } = useJogo();
  const snap = (snapshotAtual ?? {}) as Record<string, any>;

  const trabalhadores = Number(snap.trabalhadores ?? 0);
  const supervisores = Number(snap.supervisores ?? 0);
  const maquinas = Number(snap.maquinas ?? 0);
  const prodMultReal = Number(snap.prodMult ?? 1);
  const idDesbl: string[] = Array.isArray(snap.id?.desbloqueados) ? snap.id.desbloqueados : [];
  const automacao = idDesbl.includes("AUTOMACAO") ? 1.15 : 1;

  // ── ÚLTIMO TURNO RESOLVIDO ─────────────────────────────────────────
  const turnoResolvido = Number(snap.turno ?? 0);
  const ritmoReal = String(snap.ritmo ?? "normal");
  const overtimeReal = ritmoReal === "horas_extra" ? 40 : 0;
  const tierReal = Object.values(snap.tiers ?? {})[0] as string ?? "standard";
  const capLabReal = (trabalhadores * 160 + overtimeReal * trabalhadores) * prodMultReal;
  const capMachReal = maquinas * 450 * prodMultReal * automacao;
  const producaoResumo = Number(snap.decisoes_resumo?.producao_total ?? 0);

  // ── TURNO ATUAL — planeado (rascunho ou decisão submetida do COO) ──
  const cooDec = (decisoes.COO?.payload ?? {}) as Record<string, any>;
  const cooLoc = (rascunho.COO ?? {}) as Record<string, any>;
  const cooEff = { ...cooDec, ...cooLoc } as Record<string, any>;
  const alvo = (cooEff.producao ?? {}) as Record<string, number>;
  const tierPlan = String(cooEff.tier ?? "standard");
  const ritmoPlan = String(cooEff.ritmo ?? "normal");
  const overtimePlan = ritmoPlan === "horas_extra" ? 40 : 0;
  const maquinasPlan = maquinas + Math.max(0, Number(cooEff.comprar_maquinas ?? 0));
  const capLabPlan = (trabalhadores * 160 + overtimePlan * trabalhadores) * prodMultReal;
  const capMachPlan = maquinasPlan * 450 * prodMultReal * automacao;
  const totalAlvo = PRODS.reduce((s, p) => s + Number(alvo[p] ?? 0), 0);
  const labNeed = PRODS.reduce((s, p) => s + Number(alvo[p] ?? 0) * MAO[p] * MAO_MULT[tierPlan], 0);
  const machNeed = PRODS.reduce((s, p) => s + Number(alvo[p] ?? 0) * MACH_H[p], 0);
  const scale = Math.min(1,
    labNeed > 0 ? capLabPlan / labNeed : 1,
    machNeed > 0 ? capMachPlan / machNeed : 1);
  const utilizacao = Math.min(1, Math.max(labNeed / Math.max(1, capLabPlan), machNeed / Math.max(1, capMachPlan)));
  const descobertos = Math.max(0, trabalhadores - supervisores * 8);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <Metrica icone={<Cog />} rotulo="Máquinas" valor={maquinas} />
        <Metrica icone={<HardHat />} rotulo="Trabalhadores" valor={trabalhadores} />
        <Metrica icone={<ShieldCheck />} rotulo="Supervisores" valor={supervisores} />
        <Metrica icone={<Cog />} rotulo="Utilização (plano)" valor={`${Math.round(utilizacao * 100)}%`} destaque />
      </section>

      {/* Turno atual — planeado */}
      <section className="rounded-sm border bg-card">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-gold">Turno atual · planeado</div>
            <h3 className="font-serif text-lg">Linhas de produção · T{ronda_indice}</h3>
          </div>
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            tier {tierPlan} · ritmo {ritmoPlan.replace("_", " ")} · máq. finais {maquinasPlan}
          </div>
        </header>
        <ul className="divide-y">
          {PRODS.map((p) => {
            const alv = Number(alvo[p] ?? 0);
            const capUn = Math.floor(alv * scale);
            const pct = alv > 0 ? (capUn / alv) * 100 : 0;
            return (
              <li key={p} className="grid gap-2 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <div className="font-serif text-base">{NOMES[p]}</div>
                <div>
                  <div className="mono flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>Capacidade / alvo</span>
                    <span>{capUn} / {alv} un</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--navy)" }} />
                  </div>
                </div>
                <div className="mono text-right text-[10px] uppercase text-muted-foreground">
                  <div>mão {(alv * MAO[p] * MAO_MULT[tierPlan]).toFixed(0)} h</div>
                  <div>máq {(alv * MACH_H[p]).toFixed(0)} h</div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="border-t bg-muted/30 p-3">
          <div className="mono grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground sm:grid-cols-4">
            <Kv k="capLabour" v={`${Math.round(capLabPlan)} h`} />
            <Kv k="capMachine" v={`${Math.round(capMachPlan)} h`} />
            <Kv k="labNeed" v={`${Math.round(labNeed)} h`} />
            <Kv k="machNeed" v={`${Math.round(machNeed)} h`} />
          </div>
          <p className="mt-2 text-xs">
            Cobertura: <span className="mono">{supervisores}</span> × 8 = <span className="mono">{supervisores * 8}</span> de {trabalhadores}
            {descobertos > 0
              ? <span className="text-destructive font-medium"> · {descobertos} descobertos (−{(descobertos * 0.01).toFixed(2)} no prodMult)</span>
              : <span className="text-gold"> · adequada</span>}
          </p>
          {totalAlvo > 0 && scale < 1 && (
            <p className="mt-1 text-xs text-destructive">
              Alvos ({totalAlvo} un) excedem a capacidade (≈ {Math.floor(totalAlvo * scale)} un).
            </p>
          )}
        </div>
      </section>

      {/* Último turno resolvido */}
      <section className="rounded-sm border bg-card">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <ClipboardList className="mr-1 inline h-3 w-3" />
              Último turno resolvido
            </div>
            <h3 className="font-serif text-lg">
              {turnoResolvido > 0 ? `Resultado · T${turnoResolvido}` : "Ainda sem turno resolvido"}
            </h3>
          </div>
          {turnoResolvido > 0 && (
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
              tier {tierReal} · ritmo {ritmoReal.replace("_", " ")} · prodMult {prodMultReal.toFixed(2)}
            </div>
          )}
        </header>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <Bloco k="Produção total" v={`${producaoResumo} un`} />
          <Bloco k="Capacidade mão" v={`${Math.round(capLabReal)} h`} />
          <Bloco k="Capacidade máquinas" v={`${Math.round(capMachReal)} h`} />
        </div>
      </section>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      {k} <span className="text-foreground">{v}</span>
    </div>
  );
}

function Bloco({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-sm border bg-background p-3">
      <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="mt-1 font-serif text-xl">{v}</div>
    </div>
  );
}

function Metrica({ icone, rotulo, valor, destaque }: { icone: React.ReactNode; rotulo: string; valor: string | number; destaque?: boolean }) {
  return (
    <div className={`rounded-sm border p-4 ${destaque ? "bg-navy text-paper" : "bg-card"}`}>
      <div className={`mono text-[10px] uppercase tracking-widest ${destaque ? "text-gold" : "text-muted-foreground"}`}>{rotulo}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={destaque ? "text-gold" : "text-muted-foreground"}>{icone}</span>
        <span className="font-serif text-2xl">{valor}</span>
      </div>
    </div>
  );
}
